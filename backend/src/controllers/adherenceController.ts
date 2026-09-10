import { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../database/db';
import { config } from '../config';
import { adherenceService } from '../services/adherenceService';
import { emailService } from '../services/emailService';
import { AdherenceRecord, FollowUpAction, Notification } from '../models/types';

export const adherenceController = {
  recordTaken: async (req: Request, res: Response): Promise<void> => {
    try {
      const { scheduleId, actualTakenTime } = req.body;
      if (!scheduleId) {
        res.status(400).json({ success: false, message: 'Schedule ID is required.' });
        return;
      }

      const schedule = db.medicationSchedules.findById(scheduleId);
      if (!schedule) {
        res.status(404).json({ success: false, message: 'Medication schedule item not found.' });
        return;
      }

      const now = actualTakenTime ? new Date(actualTakenTime) : new Date();
      const nowISO = now.toISOString();

      // Determine on-time vs late
      // Parse scheduled time for comparison
      const [schHour, schMin] = schedule.scheduledTime.split(':').map(Number);
      const scheduledMinutes = schHour * 60 + schMin;
      const actualMinutes = now.getHours() * 60 + now.getMinutes();

      let diffMinutes = actualMinutes - scheduledMinutes;
      // Handle day wrap if clicked near midnight
      if (diffMinutes < -720) diffMinutes += 1440;

      const gracePeriod = schedule.graceMinutes || config.gracePeriodMinutes; // default 30 mins
      const isLate = diffMinutes > gracePeriod;
      const status = isLate ? 'LATE' : 'ON_TIME';

      // Update schedule record
      const updatedSchedule = db.medicationSchedules.update(scheduleId, {
        status,
        actualTakenTime: nowISO
      });

      // Insert adherence history record
      const adherenceRecord: AdherenceRecord = {
        id: `adh-${uuidv4().substring(0, 8)}`,
        patientId: schedule.patientId,
        medicationId: schedule.medicationId,
        scheduleId,
        medicationName: schedule.medicationName,
        scheduledTime: schedule.scheduledTime,
        actualTakenTime: nowISO,
        status,
        timeDifferenceMinutes: Math.max(0, diffMinutes),
        notes: isLate ? `Taken ${diffMinutes} minutes past schedule.` : 'Taken on time.',
        recordedAt: nowISO
      };
      db.adherenceRecords.insert(adherenceRecord);

      // Decrement medication quantity and check refill
      const med = db.medications.findById(schedule.medicationId);
      if (med && med.totalQuantity > 0) {
        const remaining = med.totalQuantity - 1;
        db.medications.update(med.id, { totalQuantity: remaining });

        // Trigger refill reminder if remaining <= 5
        if (remaining <= 5) {
          const patient = db.patients.findOne(p => p.patientId === schedule.patientId);
          const user = patient ? db.users.findOne(u => u.patientId === patient.patientId) : undefined;
          if (user) {
            db.notifications.insert({
              id: `notif-refill-${uuidv4().substring(0, 8)}`,
              recipientId: user.id,
              recipientRole: 'PATIENT',
              patientId: schedule.patientId,
              type: 'REFILL_REMINDER',
              title: `Low Supply Alert: ${med.name}`,
              message: `Only ${remaining} dose(s) remaining for ${med.name}. Please contact your pharmacy or doctor for a refill.`,
              readStatus: false,
              deliveryStatus: 'DELIVERED',
              createdAt: nowISO
            });
          }
        }
      }

      // Live recalculated analytics
      const analytics = adherenceService.getPatientAnalytics(schedule.patientId);

      res.json({
        success: true,
        data: {
          schedule: updatedSchedule,
          status,
          timeDifferenceMinutes: Math.max(0, diffMinutes),
          adherencePercentage: analytics.adherencePercentage,
          message: status === 'ON_TIME' ? 'Dose marked as Taken — On Time' : `Dose marked as Taken — Late (+${diffMinutes}m)`
        }
      });
    } catch (error: any) {
      console.error('recordTaken error:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  },

  recordMissed: async (req: Request, res: Response): Promise<void> => {
    try {
      const { scheduleId, notes } = req.body;
      if (!scheduleId) {
        res.status(400).json({ success: false, message: 'Schedule ID is required.' });
        return;
      }

      const schedule = db.medicationSchedules.findById(scheduleId);
      if (!schedule) {
        res.status(404).json({ success: false, message: 'Medication schedule item not found.' });
        return;
      }

      const now = new Date();
      const nowISO = now.toISOString();

      const updatedSchedule = db.medicationSchedules.update(scheduleId, {
        status: 'MISSED',
        notes: notes || 'Patient reported missed dose.'
      });

      // Insert Adherence record
      const adherenceRecord: AdherenceRecord = {
        id: `adh-${uuidv4().substring(0, 8)}`,
        patientId: schedule.patientId,
        medicationId: schedule.medicationId,
        scheduleId,
        medicationName: schedule.medicationName,
        scheduledTime: schedule.scheduledTime,
        status: 'MISSED',
        notes: notes || 'Missed dose confirmed.',
        recordedAt: nowISO
      };
      db.adherenceRecords.insert(adherenceRecord);

      // Create patient notification with strict safety boundary text
      const patient = db.patients.findOne(p => p.patientId === schedule.patientId);
      const user = patient ? db.users.findOne(u => u.patientId === patient.patientId) : undefined;
      if (user) {
        db.notifications.insert({
          id: `notif-miss-${uuidv4().substring(0, 8)}`,
          recipientId: user.id,
          recipientRole: 'PATIENT',
          patientId: schedule.patientId,
          type: 'DOSE_MISSED',
          title: `Dose Missed: ${schedule.medicationName}`,
          message: `Dose not recorded for ${schedule.medicationName}. Follow your prescribed medication instructions or contact your healthcare professional if you are unsure what to do. Never take an extra dose without clinical approval.`,
          readStatus: false,
          deliveryStatus: 'DELIVERED',
          createdAt: nowISO
        });
      }

      // Notify Caregiver if authorized
      const consents = db.consents.find(
        c => c.patientId === schedule.patientId && c.granteeRole === 'CAREGIVER' && c.status === 'ACTIVE'
      );
      for (const con of consents) {
        db.notifications.insert({
          id: `notif-cg-miss-${uuidv4().substring(0, 8)}`,
          recipientId: con.granteeId,
          recipientRole: 'CAREGIVER',
          patientId: schedule.patientId,
          type: 'CAREGIVER_ALERT',
          title: `Caregiver Notice: Missed Dose for ${patient?.name || 'Patient'}`,
          message: `A dose of ${schedule.medicationName} scheduled at ${schedule.scheduledTime} was marked as missed.`,
          readStatus: false,
          deliveryStatus: 'DELIVERED',
          createdAt: nowISO
        });
      }

      // Check if repeated missed doses require follow up
      const recentMissed = db.adherenceRecords.find(
        r => r.patientId === schedule.patientId && r.status === 'MISSED'
      );
      if (recentMissed.length >= 3) {
        const existingFollowUp = db.followUpActions.findOne(
          f => f.patientId === schedule.patientId && f.status === 'PENDING' && f.reason.includes('missed')
        );
        if (!existingFollowUp) {
          db.followUpActions.insert({
            id: `flw-${uuidv4().substring(0, 8)}`,
            patientId: schedule.patientId,
            medicationId: schedule.medicationId,
            medicationName: schedule.medicationName,
            reason: `${recentMissed.length} doses of ${schedule.medicationName} were missed during recent days.`,
            actionRequired: 'Review with healthcare professional',
            status: 'PENDING',
            recommendedForRole: 'DOCTOR',
            createdAt: nowISO
          });
        }
      }

      const analytics = adherenceService.getPatientAnalytics(schedule.patientId);

      res.json({
        success: true,
        data: {
          schedule: updatedSchedule,
          adherencePercentage: analytics.adherencePercentage,
          guidance: 'Dose not recorded. Follow your prescribed medication instructions or contact your healthcare professional if you are unsure what to do.',
          message: 'Dose recorded as Missed.'
        }
      });
    } catch (error: any) {
      console.error('recordMissed error:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  },

  recordSkipped: async (req: Request, res: Response): Promise<void> => {
    try {
      const { scheduleId, reason } = req.body;
      if (!scheduleId) {
        res.status(400).json({ success: false, message: 'Schedule ID is required.' });
        return;
      }

      const schedule = db.medicationSchedules.findById(scheduleId);
      if (!schedule) {
        res.status(404).json({ success: false, message: 'Medication schedule item not found.' });
        return;
      }

      const now = new Date();
      const nowISO = now.toISOString();

      const updatedSchedule = db.medicationSchedules.update(scheduleId, {
        status: 'SKIPPED',
        notes: reason || 'Patient recorded skipped dose.'
      });

      // 1. Insert Adherence record
      const adherenceRecord: AdherenceRecord = {
        id: `adh-${uuidv4().substring(0, 8)}`,
        patientId: schedule.patientId,
        medicationId: schedule.medicationId,
        scheduleId,
        medicationName: schedule.medicationName,
        scheduledTime: schedule.scheduledTime,
        status: 'SKIPPED',
        notes: reason || 'Dose marked as Skipped by patient.',
        recordedAt: nowISO
      };
      db.adherenceRecords.insert(adherenceRecord);

      // 2. Identify prescribing doctor
      const med = db.medications.findById(schedule.medicationId);
      const prescription = schedule.prescriptionId ? db.prescriptions.findOne(p => p.prescriptionId === schedule.prescriptionId) : undefined;
      const doctorId = med?.doctorId || prescription?.doctorId;
      const doctorName = med?.doctorName || prescription?.doctorName;

      // 3. Create Follow-Up Action record
      const followUp: FollowUpAction = {
        id: `flw-skip-${uuidv4().substring(0, 8)}`,
        patientId: schedule.patientId,
        medicationId: schedule.medicationId,
        medicationName: schedule.medicationName,
        type: 'SKIPPED_MEDICATION',
        scheduledDateTime: `${schedule.scheduledDate} ${schedule.scheduledTime}`,
        doctorId,
        doctorName,
        reason: 'Medication dose was skipped. Follow-up required.',
        actionRequired: 'Assess reason for skipped dose and adjust schedule or consult doctor.',
        status: 'PENDING',
        recommendedForRole: 'PATIENT',
        notes: reason || 'Dose skipped via patient reminder/medication action.',
        createdAt: nowISO
      };
      db.followUpActions.insert(followUp);

      // 4. Create Patient Notification
      const patient = db.patients.findOne(p => p.patientId === schedule.patientId);
      const user = patient ? db.users.findOne(u => u.patientId === patient.patientId) : undefined;
      if (user) {
        db.notifications.insert({
          id: `notif-skip-${uuidv4().substring(0, 8)}`,
          recipientId: user.id,
          recipientRole: 'PATIENT',
          patientId: schedule.patientId,
          type: 'DOSE_SKIPPED',
          title: `Dose Skipped: ${schedule.medicationName}`,
          message: `Medication dose was skipped for ${schedule.medicationName} (${schedule.scheduledTime}). A follow-up action has been recorded in your Follow-Up portal.`,
          category: 'USER',
          readStatus: false,
          isRead: false,
          deliveryStatus: 'DELIVERED',
          createdAt: nowISO
        });
      }

      // 5. Notify Caregiver if authorized
      const consents = db.consents.find(
        c => c.patientId === schedule.patientId && c.granteeRole === 'CAREGIVER' && c.status === 'ACTIVE'
      );
      for (const con of consents) {
        db.notifications.insert({
          id: `notif-cg-skip-${uuidv4().substring(0, 8)}`,
          recipientId: con.granteeId,
          recipientRole: 'CAREGIVER',
          patientId: schedule.patientId,
          type: 'CAREGIVER_ALERT',
          title: `Caregiver Notice: Skipped Dose for ${patient?.name || 'Patient'}`,
          message: `A dose of ${schedule.medicationName} scheduled at ${schedule.scheduledTime} was skipped by the patient.`,
          category: 'USER',
          readStatus: false,
          isRead: false,
          deliveryStatus: 'DELIVERED',
          createdAt: nowISO
        });
      }

      const analytics = adherenceService.getPatientAnalytics(schedule.patientId);

      res.json({
        success: true,
        data: {
          schedule: updatedSchedule,
          followUp,
          adherencePercentage: analytics.adherencePercentage,
          message: 'Dose marked as Skipped. Follow-up action generated.'
        }
      });
    } catch (error: any) {
      console.error('recordSkipped error:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  },

  getAnalytics: async (req: Request, res: Response): Promise<void> => {
    try {
      const patientId = req.params.patientId;
      const analytics = adherenceService.getPatientAnalytics(patientId);
      res.json({ success: true, data: { analytics } });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }
};
