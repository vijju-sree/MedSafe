import { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../database/db';
import { config } from '../config';
import { safetyService } from '../services/safetyService';
import { Medication, MedicationSchedule, MedicationPlanHistory, TimeOfDay, MedicationSupply } from '../models/types';

export const medicationController = {
  getMedications: async (req: Request, res: Response): Promise<void> => {
    try {
      const patientId = req.params.patientId || req.query.patientId as string;
      if (!patientId) {
        res.status(400).json({ success: false, message: 'Patient ID is required.' });
        return;
      }
      const medications = db.medications.find(m => m.patientId === patientId);
      res.json({ success: true, data: { medications } });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  },

  getMedicationById: async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const medication = db.medications.findById(id);
      if (!medication) {
        res.status(404).json({ success: false, message: 'Medication not found.' });
        return;
      }
      const history = db.medicationPlanHistory.find(h => h.medicationId === id);
      res.json({ success: true, data: { medication, history } });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  },

  addMedication: async (req: Request, res: Response): Promise<void> => {
    try {
      const {
        patientId,
        prescriptionId,
        doctorId,
        doctorName,
        name,
        genericName,
        strength,
        dosageAmount,
        dosageUnit,
        form,
        route,
        frequency,
        scheduleTimes,
        startDate,
        endDate,
        instructions,
        foodInstruction,
        totalQuantity,
        refillDate
      } = req.body;

      if (!patientId || !name || !dosageAmount || !frequency || !scheduleTimes || scheduleTimes.length === 0) {
        res.status(400).json({
          success: false,
          message: 'Missing required fields: patientId, name, dosageAmount, frequency, and scheduleTimes are mandatory.'
        });
        return;
      }

      const now = new Date();
      const todayStr = now.toISOString().split('T')[0];

      const newMedication: Medication = {
        id: `med-${uuidv4().substring(0, 8)}`,
        patientId,
        prescriptionId: prescriptionId || 'RX-MANUAL',
        doctorId: doctorId || req.user?.doctorId || 'DOC10001',
        doctorName: doctorName || req.user?.name || 'Dr. Ravi Kumar, MD',
        name,
        genericName: genericName || name,
        strength: strength || '500 mg',
        dosageAmount: String(dosageAmount),
        dosageUnit: dosageUnit || 'tablet',
        form: form || 'Tablet',
        route: route || 'Oral',
        frequency: frequency || 'DAILY',
        scheduleTimes: Array.isArray(scheduleTimes) ? scheduleTimes : [scheduleTimes],
        startDate: startDate || todayStr,
        endDate: endDate || todayStr,
        instructions: instructions || 'Take as prescribed by doctor',
        foodInstruction: foodInstruction || 'AFTER_FOOD',
        prescriptionStatus: 'ACTIVE',
        refillDate: refillDate || endDate,
        refillRemaining: 1,
        totalQuantity: totalQuantity ? parseInt(String(totalQuantity), 10) : 30,
        version: 1,
        active: true,
        createdAt: now.toISOString(),
        updatedAt: now.toISOString()
      };

      db.medications.insert(newMedication);

      // Record Plan History (Initial Creation)
      const historyRecord: MedicationPlanHistory = {
        id: `mph-${uuidv4().substring(0, 8)}`,
        patientId,
        medicationId: newMedication.id,
        version: 1,
        changeType: 'CREATED',
        newValue: newMedication,
        changedBy: req.user?.id || 'sys',
        changedByName: req.user?.name || 'Healthcare Provider',
        changedByRole: req.user?.role || 'DOCTOR',
        reason: 'Initial medication addition and schedule activation',
        timestamp: now.toISOString()
      };
      db.medicationPlanHistory.insert(historyRecord);

      // Automatically generate schedules for today and upcoming 7 days
      const schedulesToInsert: MedicationSchedule[] = [];
      const daysToGenerate = 7;

      for (let dayOffset = 0; dayOffset < daysToGenerate; dayOffset++) {
        const targetDate = new Date(now);
        targetDate.setDate(targetDate.getDate() + dayOffset);
        const dateStr = targetDate.toISOString().split('T')[0];

        for (const time of newMedication.scheduleTimes) {
          const hour = parseInt(time.split(':')[0], 10);
          let tod: TimeOfDay = 'MORNING';
          if (hour >= 12 && hour < 17) tod = 'AFTERNOON';
          else if (hour >= 17 && hour < 20) tod = 'EVENING';
          else if (hour >= 20 || hour < 5) tod = 'NIGHT';

          schedulesToInsert.push({
            id: `sch-${uuidv4().substring(0, 8)}`,
            patientId,
            medicationId: newMedication.id,
            prescriptionId: newMedication.prescriptionId,
            medicationName: `${newMedication.name} ${newMedication.strength}`,
            dosage: `${newMedication.dosageAmount} ${newMedication.dosageUnit}`,
            instructions: newMedication.instructions,
            foodInstruction: newMedication.foodInstruction,
            scheduledDate: dateStr,
            scheduledTime: time,
            timeOfDay: tod,
            status: 'UPCOMING',
            graceMinutes: config.gracePeriodMinutes,
            reminderSent: false,
            createdAt: now.toISOString()
          });
        }
      }

      db.medicationSchedules.insertMany(schedulesToInsert);

      // Trigger automatic safety checks
      const safetyAlerts = safetyService.evaluateAll(patientId);

      // Create Supply tracking record
      const patient = db.patients.findOne(p => p.patientId === patientId);
      const daily = newMedication.scheduleTimes?.length || 1;
      const initQty = newMedication.totalQuantity || 30;
      const daysRemaining = Math.floor(initQty / Math.max(1, daily));
      const depletionDate = new Date(now);
      depletionDate.setDate(depletionDate.getDate() + daysRemaining);

      const supplyRecord: MedicationSupply = {
        id: `sup-${uuidv4().substring(0, 8)}`,
        patientId,
        patientName: patient?.name,
        medicationId: newMedication.id,
        medicationName: `${newMedication.name} ${newMedication.strength}`,
        prescriptionId: newMedication.prescriptionId,
        prescribingDoctorId: newMedication.doctorId,
        prescribingDoctorName: newMedication.doctorName,
        initialQuantity: initQty,
        quantityDispensed: initQty,
        quantityRemaining: initQty,
        dailyUsage: daily,
        dispensedDate: todayStr,
        expectedDepletionDate: depletionDate.toISOString().split('T')[0],
        refillThresholdDays: 7,
        refillDate: depletionDate.toISOString().split('T')[0],
        refillStatus: 'NOT_DUE',
        notes: `Initial supply dispensed: ${initQty} units (~${daysRemaining} days)`,
        createdAt: now.toISOString(),
        updatedAt: now.toISOString()
      };
      db.medicationSupplies.insert(supplyRecord);

      // Link to prescription if prescriptionId provided
      if (newMedication.prescriptionId && newMedication.prescriptionId !== 'RX-MANUAL') {
        const rx = db.prescriptions.findOne(
          p => p.id === newMedication.prescriptionId || p.prescriptionId === newMedication.prescriptionId
        );
        if (rx) {
          const currentMedIds = rx.medicationIds || [];
          if (!currentMedIds.includes(newMedication.id)) {
            db.prescriptions.update(rx.id, {
              medicationIds: [...currentMedIds, newMedication.id]
            });
          }
        }
      }

      // Notify patient
      const user = patient ? db.users.findOne(u => u.patientId === patient.patientId) : undefined;
      if (user) {
        db.notifications.insert({
          id: `notif-newmed-${uuidv4().substring(0, 8)}`,
          recipientId: user.id,
          recipientRole: 'PATIENT',
          patientId,
          type: 'MEDICATION_PLAN_CHANGED',
          title: 'New Medication Added to Your Plan',
          message: `Dr. ${newMedication.doctorName} added ${newMedication.name} (${newMedication.strength}) to your active regimen.`,
          metadata: { medicationId: newMedication.id, prescriptionId: newMedication.prescriptionId },
          readStatus: false,
          isRead: false,
          deliveryStatus: 'DELIVERED',
          createdAt: now.toISOString()
        });
      }

      res.status(201).json({
        success: true,
        data: {
          medication: newMedication,
          schedulesGenerated: schedulesToInsert.length,
          safetyAlerts,
          message: 'Medication added and schedule generated successfully.'
        }
      });
    } catch (error: any) {
      console.error('addMedication error:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  },

  updateMedicationPlan: async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const { reason, ...updates } = req.body;

      const existingMed = db.medications.findById(id);
      if (!existingMed) {
        res.status(404).json({ success: false, message: 'Medication not found.' });
        return;
      }

      const now = new Date();
      const newVersion = (existingMed.version || 1) + 1;

      // Update medication record with new version
      const updatedMed = db.medications.update(id, {
        ...updates,
        version: newVersion,
        updatedAt: now.toISOString()
      });

      // Save Medication Plan History record (Phase 2 audit requirement)
      const historyRecord: MedicationPlanHistory = {
        id: `mph-${uuidv4().substring(0, 8)}`,
        patientId: existingMed.patientId,
        medicationId: id,
        version: newVersion,
        changeType: 'UPDATED',
        previousValue: existingMed,
        newValue: updatedMed || updates,
        changedBy: req.user?.id || 'sys',
        changedByName: req.user?.name || 'Healthcare Clinician',
        changedByRole: req.user?.role || 'DOCTOR',
        reason: reason || 'Routine clinical adjustment to dosage or timing',
        timestamp: now.toISOString()
      };
      db.medicationPlanHistory.insert(historyRecord);

      // Notify Patient
      const patient = db.patients.findOne(p => p.patientId === existingMed.patientId);
      const user = patient ? db.users.findOne(u => u.patientId === patient.patientId) : undefined;
      if (user) {
        db.notifications.insert({
          id: `notif-planup-${uuidv4().substring(0, 8)}`,
          recipientId: user.id,
          recipientRole: 'PATIENT',
          patientId: existingMed.patientId,
          type: 'MEDICATION_PLAN_CHANGED',
          title: 'Your Medication Plan Has Been Updated',
          message: `Your healthcare provider updated the plan for "${existingMed.name}". Reason: ${reason || 'Clinical adjustment'}. Please view your updated schedule.`,
          metadata: { medicationId: id, version: newVersion },
          readStatus: false,
          deliveryStatus: 'DELIVERED',
          createdAt: now.toISOString()
        });
      }

      // Re-evaluate safety rules
      const safetyAlerts = safetyService.evaluateAll(existingMed.patientId);

      res.json({
        success: true,
        data: {
          medication: updatedMed,
          planVersion: newVersion,
          history: historyRecord,
          safetyAlerts,
          message: `Medication plan updated to Version ${newVersion}.`
        }
      });
    } catch (error: any) {
      console.error('updateMedicationPlan error:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  },

  discontinueMedication: async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const { reason } = req.body;

      const med = db.medications.findById(id);
      if (!med) {
        res.status(404).json({ success: false, message: 'Medication not found.' });
        return;
      }

      const updated = db.medications.update(id, { active: false, prescriptionStatus: 'DISCONTINUED' });

      // Record Plan History
      db.medicationPlanHistory.insert({
        id: `mph-${uuidv4().substring(0, 8)}`,
        patientId: med.patientId,
        medicationId: id,
        version: (med.version || 1) + 1,
        changeType: 'DISCONTINUED',
        previousValue: med,
        newValue: { active: false, prescriptionStatus: 'DISCONTINUED' },
        changedBy: req.user?.id || 'sys',
        changedByName: req.user?.name || 'Healthcare Clinician',
        changedByRole: req.user?.role || 'DOCTOR',
        reason: reason || 'Course completed or therapy discontinued',
        timestamp: new Date().toISOString()
      });

      res.json({ success: true, data: { medication: updated, message: 'Medication discontinued.' } });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }
};
