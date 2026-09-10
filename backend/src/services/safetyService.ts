import { v4 as uuidv4 } from 'uuid';
import { db } from '../database/db';
import { SafetyAlert, Medication, MedicationReference, Prescription } from '../models/types';

export class SafetyService {
  private static DISCLAIMER = 'This is a safety-support signal, not a medical diagnosis. Please consult your doctor/pharmacist before making medication changes.';

  /**
   * Evaluates all safety rules for a specific patient and synchronizes the safety alert table.
   */
  evaluateAll(patientId: string): SafetyAlert[] {
    const alerts: SafetyAlert[] = [];

    // 1. Duplicate Medications Check
    const duplicateAlerts = this.checkDuplicates(patientId);
    alerts.push(...duplicateAlerts);

    // 2. Incomplete Information Check
    const missingInfoAlerts = this.checkMissingInfo(patientId);
    alerts.push(...missingInfoAlerts);

    // 3. Stale / Expired Prescriptions Check
    const prescriptionAlerts = this.checkPrescriptions(patientId);
    alerts.push(...prescriptionAlerts);

    // 4. Drug-Drug Interaction / Conflict Signals
    const conflictAlerts = this.checkDrugConflicts(patientId);
    alerts.push(...conflictAlerts);

    // 5. Repeated Missed Doses Pattern
    const missedDoseAlerts = this.checkRepeatedMissedDoses(patientId);
    alerts.push(...missedDoseAlerts);

    // Persist new alerts that don't already exist in DB
    for (const alert of alerts) {
      const existing = db.safetyAlerts.findOne(
        a => a.patientId === patientId && a.alertType === alert.alertType && a.title === alert.title && !a.acknowledged
      );
      if (!existing) {
        db.safetyAlerts.insert(alert);
      }
    }

    return db.safetyAlerts.find(a => a.patientId === patientId);
  }

  private checkDuplicates(patientId: string): SafetyAlert[] {
    const alerts: SafetyAlert[] = [];
    const activeMeds = db.medications.find(m => m.patientId === patientId && m.active);

    for (let i = 0; i < activeMeds.length; i++) {
      for (let j = i + 1; j < activeMeds.length; j++) {
        const medA = activeMeds[i];
        const medB = activeMeds[j];

        const matchGeneric = medA.genericName && medB.genericName &&
          medA.genericName.toLowerCase().trim() === medB.genericName.toLowerCase().trim();
        const matchName = medA.name.toLowerCase().trim() === medB.name.toLowerCase().trim();

        // Check if one contains the other (e.g. Paracetamol & Crocin Paracetamol)
        const partialMatch = 
          medA.name.toLowerCase().includes(medB.genericName.toLowerCase()) ||
          medB.name.toLowerCase().includes(medA.genericName.toLowerCase()) ||
          (medA.genericName && medB.genericName && (
            medA.genericName.toLowerCase().includes(medB.name.toLowerCase()) ||
            medB.genericName.toLowerCase().includes(medA.name.toLowerCase())
          ));

        if (matchGeneric || matchName || partialMatch) {
          alerts.push({
            id: `alert-dup-${uuidv4().substring(0, 8)}`,
            patientId,
            alertType: 'DUPLICATE_MEDICATION',
            severity: 'WARNING',
            title: `Possible Duplicate Medication Record: ${medA.name} & ${medB.name}`,
            description: `Active records detected for "${medA.name}" and "${medB.name}" sharing generic formulation "${medA.genericName || medB.genericName}".`,
            recommendation: 'Possible concern detected — professional review recommended. Please confirm with your prescribing clinician or pharmacist whether dual therapy was intended.',
            disclaimer: SafetyService.DISCLAIMER,
            medicationIds: [medA.id, medB.id],
            acknowledged: false,
            createdAt: new Date().toISOString()
          });
        }
      }
    }
    return alerts;
  }

  private checkMissingInfo(patientId: string): SafetyAlert[] {
    const alerts: SafetyAlert[] = [];
    const activeMeds = db.medications.find(m => m.patientId === patientId && m.active);

    for (const med of activeMeds) {
      const missingFields: string[] = [];
      if (!med.strength || med.strength.trim() === '') missingFields.push('strength');
      if (!med.dosageAmount || med.dosageAmount.trim() === '') missingFields.push('dosage');
      if (!med.frequency) missingFields.push('frequency');
      if (!med.scheduleTimes || med.scheduleTimes.length === 0) missingFields.push('schedule time');
      if (!med.instructions || med.instructions.trim() === '') missingFields.push('intake instructions');

      if (missingFields.length > 0) {
        alerts.push({
          id: `alert-miss-${uuidv4().substring(0, 8)}`,
          patientId,
          alertType: 'MISSING_INFO',
          severity: 'WARNING',
          title: `Incomplete Medication Details: ${med.name}`,
          description: `Key clinical administration information is incomplete for "${med.name}": missing ${missingFields.join(', ')}.`,
          recommendation: 'Medication information incomplete. Professional review recommended before administering this dose.',
          disclaimer: SafetyService.DISCLAIMER,
          medicationIds: [med.id],
          acknowledged: false,
          createdAt: new Date().toISOString()
        });
      }
    }
    return alerts;
  }

  private checkPrescriptions(patientId: string): SafetyAlert[] {
    const alerts: SafetyAlert[] = [];
    const prescriptions = db.prescriptions.find(p => p.patientId === patientId);
    const now = new Date();

    for (const rx of prescriptions) {
      const validUntil = new Date(rx.validUntil);
      const diffDays = Math.ceil((validUntil.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

      if (diffDays < 0) {
        alerts.push({
          id: `alert-rx-exp-${rx.id}`,
          patientId,
          alertType: 'EXPIRED_PRESCRIPTION',
          severity: 'CRITICAL',
          title: `Expired Prescription: ${rx.prescriptionId}`,
          description: `Prescription ${rx.prescriptionId} issued by Dr. ${rx.doctorName} expired ${Math.abs(diffDays)} day(s) ago on ${rx.validUntil}.`,
          recommendation: 'Prescription appears to be expired. Contact your healthcare provider immediately to review continuing therapy.',
          disclaimer: SafetyService.DISCLAIMER,
          acknowledged: false,
          createdAt: new Date().toISOString()
        });
      } else if (diffDays <= 7) {
        alerts.push({
          id: `alert-rx-near-${rx.id}`,
          patientId,
          alertType: 'EXPIRED_PRESCRIPTION',
          severity: 'INFO',
          title: `Prescription Renewal Due: ${rx.prescriptionId}`,
          description: `Prescription ${rx.prescriptionId} will expire in ${diffDays} day(s) on ${rx.validUntil}.`,
          recommendation: 'Prescription renewal reminder: contact your healthcare professional to secure an updated refill authorization.',
          disclaimer: SafetyService.DISCLAIMER,
          acknowledged: false,
          createdAt: new Date().toISOString()
        });
      }
    }
    return alerts;
  }

  private checkDrugConflicts(patientId: string): SafetyAlert[] {
    const alerts: SafetyAlert[] = [];
    const activeMeds = db.medications.find(m => m.patientId === patientId && m.active);
    const references = db.medicationReferences.find();

    for (let i = 0; i < activeMeds.length; i++) {
      for (let j = i + 1; j < activeMeds.length; j++) {
        const medA = activeMeds[i];
        const medB = activeMeds[j];

        // Search reference db for medA
        const refA = references.find(r =>
          r.drugName.toLowerCase() === medA.name.toLowerCase() ||
          (medA.genericName && r.genericName.toLowerCase() === medA.genericName.toLowerCase())
        );

        if (refA && refA.conflictingDrugs) {
          const isConflict = refA.conflictingDrugs.some(conflict =>
            medB.name.toLowerCase().includes(conflict.toLowerCase()) ||
            (medB.genericName && medB.genericName.toLowerCase().includes(conflict.toLowerCase()))
          );

          if (isConflict) {
            alerts.push({
              id: `alert-conf-${uuidv4().substring(0, 8)}`,
              patientId,
              alertType: 'DRUG_CONFLICT',
              severity: 'CRITICAL',
              title: `Possible Medication Conflict: ${medA.name} & ${medB.name}`,
              description: `Reference clinical data indicates potential interaction between "${medA.name}" and "${medB.name}".`,
              recommendation: 'Possible medication conflict detected. Professional review recommended. Do not discontinue or adjust medication without speaking with your doctor or pharmacist.',
              disclaimer: SafetyService.DISCLAIMER,
              medicationIds: [medA.id, medB.id],
              acknowledged: false,
              createdAt: new Date().toISOString()
            });
          }
        }
      }
    }
    return alerts;
  }

  private checkRepeatedMissedDoses(patientId: string): SafetyAlert[] {
    const alerts: SafetyAlert[] = [];
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const isoThreshold = sevenDaysAgo.toISOString();

    const recentMissed = db.adherenceRecords.find(
      r => r.patientId === patientId && r.status === 'MISSED' && r.recordedAt >= isoThreshold
    );

    if (recentMissed.length >= 3) {
      alerts.push({
        id: `alert-missed-pattern-${uuidv4().substring(0, 8)}`,
        patientId,
        alertType: 'REPEATED_MISSED_DOSES',
        severity: 'WARNING',
        title: 'Repeated Missed Doses Detected',
        description: `${recentMissed.length} scheduled doses were missed during the last 7 days.`,
        recommendation: 'Frequent missed doses detected. Review with your healthcare professional to discuss barrier solutions or schedule adjustments.',
        disclaimer: SafetyService.DISCLAIMER,
        acknowledged: false,
        createdAt: new Date().toISOString()
      });
    }
    return alerts;
  }
}

export const safetyService = new SafetyService();
