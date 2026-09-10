import { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../database/db';
import { safetyService } from '../services/safetyService';
import { adherenceService } from '../services/adherenceService';
import { FollowUpAction } from '../models/types';

export const doctorController = {
  getPatients: async (req: Request, res: Response): Promise<void> => {
    try {
      const doctorId = req.user?.doctorId || 'DOC10001';
      const doctor = db.doctors.findOne(d => d.doctorId === doctorId || d.userId === req.user?.id);
      const authorizedIds = doctor?.authorizedPatientIds || [];

      const patients = db.patients.find(p =>
        p.doctorIds?.includes(doctor?.doctorId || doctorId) ||
        authorizedIds.includes(p.patientId)
      );
      res.json({ success: true, data: { patients } });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  },

  searchPatients: async (req: Request, res: Response): Promise<void> => {
    try {
      const doctorId = req.user?.doctorId || 'DOC10001';
      const doctor = db.doctors.findOne(d => d.doctorId === doctorId || d.userId === req.user?.id);
      const authorizedIds = doctor?.authorizedPatientIds || [];

      // Filter only within authorized patients
      const myPatients = db.patients.find(p =>
        p.doctorIds?.includes(doctor?.doctorId || doctorId) ||
        authorizedIds.includes(p.patientId)
      );

      const query = ((req.query.q as string) || '').trim().toLowerCase();
      if (!query) {
        res.json({ success: true, data: { patients: myPatients } });
        return;
      }

      const filtered = myPatients.filter(p =>
        p.patientId.toLowerCase().includes(query) ||
        p.name.toLowerCase().includes(query) ||
        p.phone.includes(query) ||
        p.email.toLowerCase().includes(query)
      );

      res.json({ success: true, data: { patients: filtered } });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  },

  getPatientDetail: async (req: Request, res: Response): Promise<void> => {
    try {
      const { patientId } = req.params;
      const patient = db.patients.findOne(p => p.patientId === patientId);
      if (!patient) {
        res.status(404).json({ success: false, message: `Patient ${patientId} not found.` });
        return;
      }

      const medications = db.medications.find(m => m.patientId === patientId);
      const prescriptions = db.prescriptions.find(p => p.patientId === patientId);
      const planHistory = db.medicationPlanHistory.find(h => h.patientId === patientId);
      const safetyAlerts = safetyService.evaluateAll(patientId);
      const analytics = adherenceService.getPatientAnalytics(patientId);
      const followUps = db.followUpActions.find(f => f.patientId === patientId);

      res.json({
        success: true,
        data: {
          patient,
          medications,
          prescriptions,
          planHistory,
          safetyAlerts,
          analytics,
          followUps
        }
      });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  },

  addFollowUp: async (req: Request, res: Response): Promise<void> => {
    try {
      const { patientId, medicationId, medicationName, reason, actionRequired, notes } = req.body;
      if (!patientId || !actionRequired) {
        res.status(400).json({ success: false, message: 'patientId and actionRequired are mandatory.' });
        return;
      }

      const newFollowUp: FollowUpAction = {
        id: `flw-${uuidv4().substring(0, 8)}`,
        patientId,
        medicationId,
        medicationName,
        reason: reason || 'Clinical review follow-up note',
        actionRequired,
        status: 'PENDING',
        recommendedForRole: 'PATIENT',
        notes,
        createdAt: new Date().toISOString()
      };

      db.followUpActions.insert(newFollowUp);

      // Notify patient
      const patient = db.patients.findOne(p => p.patientId === patientId);
      const user = patient ? db.users.findOne(u => u.patientId === patient.patientId) : undefined;
      if (user) {
        db.notifications.insert({
          id: `notif-flw-${uuidv4().substring(0, 8)}`,
          recipientId: user.id,
          recipientRole: 'PATIENT',
          patientId,
          type: 'FOLLOW_UP',
          title: 'Clinical Follow-Up Recommendation',
          message: `Dr. ${req.user?.name || 'Your Doctor'} added a follow-up action: ${actionRequired}.`,
          readStatus: false,
          deliveryStatus: 'DELIVERED',
          createdAt: new Date().toISOString()
        });
      }

      res.status(201).json({ success: true, data: { followUp: newFollowUp } });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  },

  resolveFollowUp: async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const updated = db.followUpActions.update(id, {
        status: 'RESOLVED',
        resolvedAt: new Date().toISOString(),
        resolvedBy: req.user?.name || 'Dr. Ravi Kumar'
      });
      res.json({ success: true, data: { followUp: updated, message: 'Follow-up resolved.' } });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }
};
