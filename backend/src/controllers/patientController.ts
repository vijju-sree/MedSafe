import { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../database/db';
import { safetyService } from '../services/safetyService';
import { adherenceService } from '../services/adherenceService';
import { TimeOfDay, MedicationSupply, RefillRequest, Notification, FollowUpAction } from '../models/types';

export const patientController = {
  getDashboard: async (req: Request, res: Response): Promise<void> => {
    try {
      const patientId = req.params.patientId;
      const patient = db.patients.findOne(p => p.patientId === patientId);

      if (!patient) {
        res.status(404).json({ success: false, message: `Patient ${patientId} not found.` });
        return;
      }

      const todayStr = new Date().toISOString().split('T')[0];

      // Retrieve today's schedules
      const schedulesToday = db.medicationSchedules.find(
        s => s.patientId === patientId && s.scheduledDate === todayStr
      ).sort((a, b) => a.scheduledTime.localeCompare(b.scheduledTime));

      // Group schedules by time of day
      const groupedSchedule: Record<TimeOfDay, typeof schedulesToday> = {
        MORNING: [],
        AFTERNOON: [],
        EVENING: [],
        NIGHT: []
      };

      for (const sch of schedulesToday) {
        if (!sch.timeOfDay) {
          const hour = parseInt(sch.scheduledTime.split(':')[0], 10);
          if (hour < 12) sch.timeOfDay = 'MORNING';
          else if (hour < 17) sch.timeOfDay = 'AFTERNOON';
          else if (hour < 20) sch.timeOfDay = 'EVENING';
          else sch.timeOfDay = 'NIGHT';
        }
        groupedSchedule[sch.timeOfDay].push(sch);
      }

      // Live safety check evaluation
      const safetyAlerts = safetyService.evaluateAll(patientId);

      // Adherence Analytics
      const analytics = adherenceService.getPatientAnalytics(patientId);

      // Prescriptions & Medications
      const prescriptions = db.prescriptions.find(p => p.patientId === patientId);
      const medications = db.medications.find(m => m.patientId === patientId);
      const supplies = db.medicationSupplies.find(s => s.patientId === patientId);
      const refillsDue = supplies.filter(s => s.refillStatus === 'REFILL_DUE' || s.refillStatus === 'DUE_SOON').length ||
        prescriptions.filter(p => p.status === 'EXPIRING' || p.status === 'EXPIRED').length;

      // Follow-up actions
      const followUps = db.followUpActions.find(f => f.patientId === patientId);

      // Authorized Caregivers
      const activeConsents = db.consents.find(c => c.patientId === patientId && c.status === 'ACTIVE');

      // Summary counts
      const todayTaken = schedulesToday.filter(s => s.status === 'ON_TIME' || s.status === 'LATE').length;
      const todayMissed = schedulesToday.filter(s => s.status === 'MISSED').length;

      res.json({
        success: true,
        data: {
          patient,
          summary: {
            todayScheduled: schedulesToday.length,
            todayTaken,
            todayMissed,
            todayUpcoming: schedulesToday.filter(s => s.status === 'UPCOMING').length,
            adherencePercentage: analytics.adherencePercentage,
            riskScore: analytics.riskScore,
            riskRationale: analytics.riskRationale,
            refillsDue,
            activeMedications: medications.length
          },
          schedulesToday,
          todaySchedule: schedulesToday,
          groupedSchedule,
          medications,
          prescriptions,
          safetyAlerts,
          followUps,
          caregivers: activeConsents,
          analytics
        }
      });
    } catch (error: any) {
      console.error('getDashboard error:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  },

  getSchedule: async (req: Request, res: Response): Promise<void> => {
    try {
      const patientId = req.params.patientId;
      const todayStr = (req.query.date as string) || new Date().toISOString().split('T')[0];
      const schedules = db.medicationSchedules.find(
        s => s.patientId === patientId && s.scheduledDate === todayStr
      ).sort((a, b) => a.scheduledTime.localeCompare(b.scheduledTime));

      res.json({ success: true, data: { date: todayStr, schedules } });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  },

  getCaregivers: async (req: Request, res: Response): Promise<void> => {
    try {
      const patientId = req.params.patientId;
      const consents = db.consents.find(c => c.patientId === patientId);
      res.json({ success: true, data: { consents } });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  },

  addCaregiver: async (req: Request, res: Response): Promise<void> => {
    try {
      const patientId = req.params.patientId;
      const { name, email, relationship, accessScope } = req.body;

      if (!name || !email) {
        res.status(400).json({ success: false, message: 'Caregiver name and email are required.' });
        return;
      }

      // Check if caregiver user exists or create placeholder
      let caregiverUser = db.users.findOne(u => u.email.toLowerCase() === email.toLowerCase());
      if (!caregiverUser) {
        caregiverUser = {
          id: `usr-car-${uuidv4().substring(0, 8)}`,
          email,
          passwordHash: 'dummy_hash',
          role: 'CAREGIVER',
          name,
          caregiverId: `CAR${Math.floor(10000 + Math.random() * 90000)}`,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        db.users.insert(caregiverUser);
      }

      const newConsent = {
        id: `con-${uuidv4().substring(0, 8)}`,
        patientId,
        granteeId: caregiverUser.id,
        granteeName: `${name} (${relationship || 'Caregiver'})`,
        granteeEmail: email,
        granteeRole: 'CAREGIVER' as const,
        accessScope: accessScope || 'SCHEDULE_ADHERENCE',
        status: 'ACTIVE' as const,
        grantedAt: new Date().toISOString()
      };

      db.consents.insert(newConsent);

      res.json({
        success: true,
        data: { consent: newConsent, message: `Access successfully granted to ${name}.` }
      });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  },

  revokeCaregiver: async (req: Request, res: Response): Promise<void> => {
    try {
      const { consentId } = req.params;
      const consent = db.consents.findById(consentId);

      if (!consent) {
        res.status(404).json({ success: false, message: 'Consent record not found.' });
        return;
      }

      const updated = db.consents.update(consentId, {
        status: 'REVOKED',
        revokedAt: new Date().toISOString()
      });

      res.json({
        success: true,
        data: { consent: updated, message: `Access for ${consent.granteeName} has been revoked.` }
      });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  },

  getNotifications: async (req: Request, res: Response): Promise<void> => {
    try {
      const patientId = req.params.patientId;
      const allActive = db.notifications.find(
        n => (n.patientId === patientId || n.recipientId === req.user?.id || n.category === 'SYSTEM_DISPATCH') && !n.isCleared
      ).sort((a, b) => b.createdAt.localeCompare(a.createdAt));

      const userNotifications = allActive.filter(n => n.category !== 'SYSTEM_DISPATCH');
      const systemDispatches = allActive.filter(n => n.category === 'SYSTEM_DISPATCH');

      res.json({
        success: true,
        data: {
          notifications: allActive,
          userNotifications,
          systemDispatches
        }
      });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  },

  markNotificationRead: async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const updated = db.notifications.update(id, {
        readStatus: true,
        isRead: true,
        readAt: new Date().toISOString()
      });
      res.json({ success: true, data: { notification: updated } });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  },

  markAllNotificationsRead: async (req: Request, res: Response): Promise<void> => {
    try {
      const patientId = req.params.patientId;
      const nowIso = new Date().toISOString();
      const notifs = db.notifications.find(
        n => (n.patientId === patientId || n.recipientId === req.user?.id || n.category === 'SYSTEM_DISPATCH') && !n.isCleared && !n.readStatus
      );
      for (const n of notifs) {
        db.notifications.update(n.id, {
          readStatus: true,
          isRead: true,
          readAt: nowIso
        });
      }
      res.json({
        success: true,
        data: {
          updatedCount: notifs.length,
          message: 'All active notifications marked as read.'
        }
      });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  },

  clearNotification: async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const nowIso = new Date().toISOString();
      const updated = db.notifications.update(id, {
        isCleared: true,
        clearedAt: nowIso
      });
      res.json({
        success: true,
        data: {
          notification: updated,
          message: 'Notification removed from active notifications.'
        }
      });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  },

  clearAllNotifications: async (req: Request, res: Response): Promise<void> => {
    try {
      const patientId = req.params.patientId;
      const nowIso = new Date().toISOString();
      const notifs = db.notifications.find(
        n => (n.patientId === patientId || n.recipientId === req.user?.id || n.category === 'SYSTEM_DISPATCH') && !n.isCleared
      );
      for (const n of notifs) {
        db.notifications.update(n.id, {
          isCleared: true,
          clearedAt: nowIso
        });
      }
      res.json({
        success: true,
        data: {
          clearedCount: notifs.length,
          message: 'All notifications cleared.'
        }
      });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  },

  getFollowUps: async (req: Request, res: Response): Promise<void> => {
    try {
      const patientId = req.params.patientId;
      const followUps = db.followUpActions.find(
        f => f.patientId === patientId
      ).sort((a, b) => b.createdAt.localeCompare(a.createdAt));

      res.json({ success: true, data: { followUps } });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  },

  updateFollowUpStatus: async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const { status, notes } = req.body;
      const updated = db.followUpActions.update(id, {
        status: status || 'COMPLETED',
        notes: notes || undefined,
        resolvedAt: (status === 'COMPLETED' || status === 'RESOLVED') ? new Date().toISOString() : undefined,
        resolvedBy: req.user?.id
      });
      res.json({ success: true, data: { followUp: updated, message: 'Follow-up status updated.' } });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  },

  requestRefill: async (req: Request, res: Response): Promise<void> => {
    try {
      const patientId = req.params.patientId;
      const medicationId = req.params.medicationId || req.body?.medicationId;
      const patient = db.patients.findOne(p => p.patientId === patientId);
      const med = db.medications.findById(medicationId);
      if (!med) {
        res.status(404).json({ success: false, message: 'Medication not found.' });
        return;
      }

      const now = new Date();
      const nowISO = now.toISOString();
      const todayStr = nowISO.split('T')[0];
      const updated = db.medications.update(medicationId, {
        notes: `${med.instructions || ''} [Refill Requested: ${new Date().toLocaleDateString()}]`.trim()
      });

      const requestedQty = req.body?.quantityRequested ? parseInt(String(req.body.quantityRequested), 10) : (med.totalQuantity || 30);
      const refillNum = Math.floor(10000 + Math.random() * 90000);

      // Create RefillRequest entity
      const refillRequest: RefillRequest = {
        id: `rfl-${uuidv4().substring(0, 8)}`,
        refillRequestId: `RFL${refillNum}`,
        patientId,
        patientName: patient?.name || 'Patient',
        medicationId: med.id,
        medicationName: `${med.name} ${med.strength}`,
        prescriptionId: med.prescriptionId,
        doctorId: med.doctorId,
        doctorName: med.doctorName,
        pharmacyName: 'MedSafe Central Pharmacy Network',
        quantityRequested: requestedQty,
        status: 'REQUESTED',
        notes: req.body?.notes || `Refill requested for ${requestedQty} doses.`,
        statusHistory: [
          {
            status: 'REQUESTED',
            changedBy: req.user?.id || patientId,
            changedByRole: req.user?.role || 'PATIENT',
            timestamp: nowISO,
            notes: req.body?.notes || 'Refill initiated via Patient Portal'
          }
        ],
        requestedDate: todayStr,
        updatedAt: nowISO
      };
      db.refillRequests.insert(refillRequest);

      // Update or create MedicationSupply
      let supply = db.medicationSupplies.findOne(s => s.medicationId === medicationId && s.patientId === patientId);
      if (supply) {
        db.medicationSupplies.update(supply.id, {
          refillStatus: 'REFILL_REQUESTED',
          lastRefillRequestId: refillRequest.refillRequestId,
          notes: `Refill #${refillRequest.refillRequestId} requested (${requestedQty} units) on ${todayStr}`,
          updatedAt: nowISO
        });
      } else {
        const daily = med.scheduleTimes?.length || 1;
        db.medicationSupplies.insert({
          id: `sup-${uuidv4().substring(0, 8)}`,
          patientId,
          patientName: patient?.name,
          medicationId: med.id,
          medicationName: `${med.name} ${med.strength}`,
          prescriptionId: med.prescriptionId,
          prescribingDoctorId: med.doctorId,
          prescribingDoctorName: med.doctorName,
          initialQuantity: med.totalQuantity || 30,
          quantityDispensed: med.totalQuantity || 30,
          quantityRemaining: med.refillRemaining !== undefined ? med.refillRemaining : (med.totalQuantity || 30),
          dailyUsage: daily,
          refillThresholdDays: 7,
          refillStatus: 'REFILL_REQUESTED',
          lastRefillRequestId: refillRequest.refillRequestId,
          notes: `Refill #${refillRequest.refillRequestId} requested on ${todayStr}`,
          createdAt: nowISO,
          updatedAt: nowISO
        });
      }

      // Insert patient notification
      const user = patient ? db.users.findOne(u => u.patientId === patient.patientId) : undefined;
      if (user) {
        db.notifications.insert({
          id: `notif-refill-req-${uuidv4().substring(0, 8)}`,
          recipientId: user.id,
          recipientRole: 'PATIENT',
          patientId,
          type: 'REFILL_REQUESTED',
          title: `Refill Requested: ${med.name}`,
          message: `Your refill request #${refillRequest.refillRequestId} for ${med.name} (${requestedQty} doses) has been submitted to Dr. ${med.doctorName || 'your physician'} and pharmacy.`,
          category: 'USER',
          metadata: { refillRequestId: refillRequest.refillRequestId, medicationId: med.id },
          readStatus: false,
          isRead: false,
          deliveryStatus: 'DELIVERED',
          createdAt: nowISO
        });
      }

      // Notify Doctor if doctor user exists
      const docUser = db.users.findOne(u => u.doctorId === med.doctorId);
      if (docUser) {
        db.notifications.insert({
          id: `notif-doc-rfl-${uuidv4().substring(0, 8)}`,
          recipientId: docUser.id,
          recipientRole: 'DOCTOR',
          patientId,
          type: 'REFILL_REQUESTED',
          title: `Refill Requested by ${patient?.name || 'Patient'}`,
          message: `${patient?.name || 'Patient'} submitted Refill Request #${refillRequest.refillRequestId} for ${med.name} (${requestedQty} doses).`,
          category: 'USER',
          metadata: { refillRequestId: refillRequest.refillRequestId, patientId, medicationId: med.id },
          readStatus: false,
          isRead: false,
          deliveryStatus: 'DELIVERED',
          createdAt: nowISO
        });
      }

      // Add to FollowUpActions if not already pending
      const existing = db.followUpActions.findOne(
        f => f.patientId === patientId && f.medicationId === medicationId && f.type === 'REFILL_REQUIRED' && f.status === 'PENDING'
      );
      if (!existing) {
        db.followUpActions.insert({
          id: `flw-refill-${uuidv4().substring(0, 8)}`,
          patientId,
          medicationId,
          medicationName: med.name,
          type: 'REFILL_REQUIRED',
          doctorId: med.doctorId,
          doctorName: med.doctorName,
          reason: `Refill #${refillRequest.refillRequestId} requested for ${med.name} (${requestedQty} doses).`,
          actionRequired: 'Pharmacy dispensing clearance or clinician prescription renewal review.',
          status: 'PENDING',
          recommendedForRole: 'PHARMACIST',
          notes: 'Submitted via Patient Portal Medical Refills section.',
          createdAt: nowISO
        });
      }

      res.json({
        success: true,
        data: {
          refillRequest,
          medication: updated,
          message: `Refill request #${refillRequest.refillRequestId} submitted for ${med.name}. Follow-up tracked.`
        }
      });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  },

  getSupplies: async (req: Request, res: Response): Promise<void> => {
    try {
      const patientId = req.params.patientId;
      const patient = db.patients.findOne(p => p.patientId === patientId);
      if (!patient) {
        res.status(404).json({ success: false, message: 'Patient not found' });
        return;
      }
      const now = new Date();
      const todayStr = now.toISOString().split('T')[0];
      const user = db.users.findOne(u => u.patientId === patientId);

      const medications = db.medications.find(m => m.patientId === patientId);
      const existingSupplies = db.medicationSupplies.find(s => s.patientId === patientId);

      for (const med of medications) {
        let supply = existingSupplies.find(s => s.medicationId === med.id);
        const daily = med.scheduleTimes?.length || (med.frequency === 'TWICE_DAILY' ? 2 : med.frequency === 'THREE_TIMES_DAILY' ? 3 : 1);

        if (!supply) {
          const initQty = med.totalQuantity || 30;
          const remaining = med.refillRemaining !== undefined ? med.refillRemaining : initQty;
          const daysRemaining = Math.floor(remaining / Math.max(1, daily));
          const targetDate = new Date(now);
          targetDate.setDate(targetDate.getDate() + daysRemaining);

          let initialStatus: any = 'NOT_DUE';
          if (remaining <= 0) initialStatus = 'EXPIRED';
          else if (daysRemaining <= 7) initialStatus = 'REFILL_DUE';
          else if (daysRemaining <= 10) initialStatus = 'DUE_SOON';

          supply = {
            id: `sup-${uuidv4().substring(0, 8)}`,
            patientId,
            patientName: patient.name,
            medicationId: med.id,
            medicationName: `${med.name} ${med.strength}`,
            prescriptionId: med.prescriptionId,
            prescribingDoctorId: med.doctorId,
            prescribingDoctorName: med.doctorName,
            initialQuantity: initQty,
            quantityDispensed: initQty,
            quantityRemaining: remaining,
            dailyUsage: daily,
            dispensedDate: med.startDate || todayStr,
            expectedDepletionDate: targetDate.toISOString().split('T')[0],
            refillThresholdDays: 7,
            refillDate: targetDate.toISOString().split('T')[0],
            refillStatus: initialStatus,
            notes: `${remaining} doses remaining (~${daysRemaining} days)`,
            createdAt: med.createdAt || now.toISOString(),
            updatedAt: now.toISOString()
          };
          db.medicationSupplies.insert(supply);
        } else {
          // Dynamic calculation
          const daysRemaining = Math.floor(supply.quantityRemaining / Math.max(1, supply.dailyUsage));
          let updatedStatus = supply.refillStatus;
          if (supply.refillStatus !== 'REFILL_REQUESTED' && supply.refillStatus !== 'REFILLED') {
            if (supply.quantityRemaining <= 0) updatedStatus = 'EXPIRED';
            else if (daysRemaining <= 7) updatedStatus = 'REFILL_DUE';
            else if (daysRemaining <= 10) updatedStatus = 'DUE_SOON';
            else updatedStatus = 'NOT_DUE';

            if (updatedStatus !== supply.refillStatus) {
              db.medicationSupplies.update(supply.id, {
                refillStatus: updatedStatus,
                notes: `${supply.quantityRemaining} doses remaining (~${daysRemaining} days)`,
                updatedAt: now.toISOString()
              });
              supply.refillStatus = updatedStatus;
            }
          }

          // Trigger automated notification if supply is due and not already notified
          if (supply.refillStatus === 'REFILL_DUE' && user) {
            const alreadyNotified = db.notifications.findOne(
              n => n.recipientId === user.id && n.type === 'REFILL_DUE' && n.metadata?.medicationId === med.id && n.isCleared !== true
            );
            if (!alreadyNotified) {
              db.notifications.insert({
                id: `notif-refill-due-${uuidv4().substring(0, 8)}`,
                recipientId: user.id,
                recipientRole: 'PATIENT',
                patientId,
                type: 'REFILL_DUE',
                title: `Refill Due: ${supply.medicationName}`,
                message: `Your supply of ${supply.medicationName} is low (${supply.quantityRemaining} doses remaining, ~${daysRemaining} days). Please request a refill.`,
                category: 'USER',
                metadata: { medicationId: med.id, prescriptionId: med.prescriptionId },
                readStatus: false,
                isRead: false,
                deliveryStatus: 'DELIVERED',
                createdAt: now.toISOString()
              });
            }
          }
        }
      }

      const supplies = db.medicationSupplies.find(s => s.patientId === patientId);
      res.json({ success: true, data: { supplies } });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  },

  getRefills: async (req: Request, res: Response): Promise<void> => {
    try {
      const patientId = req.params.patientId;
      const refillRequests = db.refillRequests.find(r => r.patientId === patientId).sort(
        (a, b) => new Date(b.requestedDate).getTime() - new Date(a.requestedDate).getTime()
      );
      res.json({ success: true, data: { refillRequests } });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }
};
