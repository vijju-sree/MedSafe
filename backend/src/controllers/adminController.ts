import { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../database/db';
import { MedicationReference, Organization, Clinic, OrganizationLicense, UsageRecord } from '../models/types';

export const adminController = {
  getSystemMetrics: async (req: Request, res: Response): Promise<void> => {
    try {
      const totalPatients = db.patients.count();
      const totalDoctors = db.doctors.count();
      const totalCaregivers = db.caregivers.count();
      const totalPharmacists = db.pharmacists.count();

      const activeMedications = db.medications.count(m => m.active);
      const activePrescriptions = db.prescriptions.count(p => p.status === 'ACTIVE');
      const expiringPrescriptions = db.prescriptions.count(p => p.status === 'EXPIRING');

      const todayStr = new Date().toISOString().split('T')[0];
      const missedDosesToday = db.medicationSchedules.count(
        s => s.scheduledDate === todayStr && s.status === 'MISSED'
      );
      const takenDosesToday = db.medicationSchedules.count(
        s => s.scheduledDate === todayStr && (s.status === 'ON_TIME' || s.status === 'LATE')
      );

      const totalSafetyAlerts = db.safetyAlerts.count();
      const unacknowledgedAlerts = db.safetyAlerts.count(a => !a.acknowledged);

      const allRecords = db.adherenceRecords.find();
      const takenCount = allRecords.filter(r => r.status === 'ON_TIME' || r.status === 'LATE').length;
      const overallAdherence = allRecords.length > 0
        ? Math.round((takenCount / allRecords.length) * 100)
        : 85;

      res.json({
        success: true,
        data: {
          metrics: {
            totalPatients,
            totalDoctors,
            totalCaregivers,
            totalPharmacists,
            activeMedications,
            activePrescriptions,
            expiringPrescriptions,
            missedDosesToday,
            takenDosesToday,
            totalSafetyAlerts,
            unacknowledgedAlerts,
            overallAdherence
          }
        }
      });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  },

  getUsers: async (req: Request, res: Response): Promise<void> => {
    try {
      const q = ((req.query.q as string) || '').toLowerCase().trim();
      let users = db.users.find().map(u => {
        const { passwordHash, ...safeUser } = u;
        return safeUser;
      });

      if (q) {
        users = users.filter(u =>
          u.name.toLowerCase().includes(q) ||
          u.email.toLowerCase().includes(q) ||
          u.role.toLowerCase().includes(q) ||
          (u.patientId && u.patientId.toLowerCase().includes(q))
        );
      }

      res.json({ success: true, data: { users } });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  },

  getAuditLogs: async (req: Request, res: Response): Promise<void> => {
    try {
      const limit = parseInt((req.query.limit as string) || '50', 10);
      const q = ((req.query.q as string) || '').toLowerCase().trim();

      let logs = db.auditLogs.find().sort((a, b) => b.timestamp.localeCompare(a.timestamp));
      if (q) {
        logs = logs.filter(l =>
          l.action.toLowerCase().includes(q) ||
          l.userName.toLowerCase().includes(q) ||
          l.resource.toLowerCase().includes(q) ||
          (l.patientId && l.patientId.toLowerCase().includes(q))
        );
      }

      res.json({ success: true, data: { logs: logs.slice(0, limit) } });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  },

  getDrugReferences: async (req: Request, res: Response): Promise<void> => {
    try {
      const references = db.medicationReferences.find();
      res.json({ success: true, data: { references } });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  },

  addDrugReference: async (req: Request, res: Response): Promise<void> => {
    try {
      const { drugName, genericName, category, standardDosageRange, commonInstructions, conflictingDrugs, contraindications } = req.body;
      if (!drugName || !genericName) {
        res.status(400).json({ success: false, message: 'drugName and genericName are required.' });
        return;
      }

      const newRef: MedicationReference = {
        id: `ref-${uuidv4().substring(0, 8)}`,
        drugName,
        genericName,
        category: category || 'General Therapeutics',
        standardDosageRange: standardDosageRange || 'Standard adult dosage',
        commonInstructions: commonInstructions || 'Follow prescribing clinician directions',
        conflictingDrugs: Array.isArray(conflictingDrugs) ? conflictingDrugs : (conflictingDrugs || '').split(',').map((s: string) => s.trim()).filter(Boolean),
        contraindications: contraindications || 'None specified'
      };

      db.medicationReferences.insert(newRef);
      res.status(201).json({ success: true, data: { reference: newRef } });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  },

  getOrganizations: async (req: Request, res: Response): Promise<void> => {
    try {
      const organizations = db.organizations.find();
      const clinics = db.clinics.find();
      res.json({ success: true, data: { organizations, clinics } });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  },

  getVerifications: async (req: Request, res: Response): Promise<void> => {
    try {
      const { status } = req.query;
      let users = db.users.find(u => u.role !== 'PATIENT' && u.role !== 'ADMIN');
      if (status) {
        users = users.filter(u => u.verificationStatus === status);
      }
      const data = users.map(u => {
        let details: any = {};
        if (u.role === 'DOCTOR') details = db.doctors.findOne(d => d.doctorId === u.doctorId) || {};
        else if (u.role === 'PHARMACIST') details = db.pharmacists.findOne(p => p.pharmacistId === u.pharmacistId) || {};
        else if (u.role === 'LAB') details = db.labs.findOne(l => l.labId === u.labId) || {};
        else if (u.role === 'CLINIC') details = db.clinics.findOne(c => c.id === u.clinicId) || {};

        return {
          id: u.id,
          name: u.name,
          email: u.email,
          phone: u.phone,
          role: u.role,
          licenseNumber: u.licenseNumber || details.licenseNumber,
          verificationStatus: u.verificationStatus || 'VERIFIED',
          rejectionReason: u.rejectionReason,
          details,
          createdAt: u.createdAt
        };
      });
      res.json({ success: true, data: { verifications: data } });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  },

  updateVerification: async (req: Request, res: Response): Promise<void> => {
    try {
      const { userId, status, reason } = req.body;
      if (!userId || !status) {
        res.status(400).json({ success: false, message: 'userId and status are required.' });
        return;
      }

      const user = db.users.findById(userId);
      if (!user) {
        res.status(404).json({ success: false, message: `User ${userId} not found.` });
        return;
      }

      const now = new Date().toISOString();
      db.users.update(user.id, {
        verificationStatus: status,
        rejectionReason: reason || undefined,
        updatedAt: now
      });

      // Update linked entities
      if (user.role === 'DOCTOR' && user.doctorId) {
        const doc = db.doctors.findOne(d => d.doctorId === user.doctorId);
        if (doc) db.doctors.update(doc.id, { verificationStatus: status });
      } else if (user.role === 'PHARMACIST' && user.pharmacistId) {
        const pha = db.pharmacists.findOne(p => p.pharmacistId === user.pharmacistId);
        if (pha) db.pharmacists.update(pha.id, { verificationStatus: status });
      } else if (user.role === 'LAB' && user.labId) {
        const lab = db.labs.findOne(l => l.labId === user.labId);
        if (lab) db.labs.update(lab.id, { verificationStatus: status });
      }

      // Notify the user
      db.notifications.insert({
        id: `notif-${uuidv4().substring(0, 8)}`,
        recipientId: user.id,
        recipientRole: user.role,
        patientId: '',
        type: 'VERIFICATION_STATUS',
        title: `Verification Status Updated: ${status}`,
        message: status === 'VERIFIED'
          ? `Congratulations! Your ${user.role} profile has been verified and approved by the MedSafe Administration. You now have full clinical access.`
          : `Your verification request has been marked as ${status}. ${reason ? 'Reason: ' + reason : ''}`,
        metadata: { status, reason },
        readStatus: false,
        deliveryStatus: 'DELIVERED',
        createdAt: now
      });

      res.json({
        success: true,
        data: {
          message: `User ${user.name} verification status updated to ${status}.`,
          user: { ...user, verificationStatus: status }
        }
      });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  },

  getDiagnosticOrders: async (req: Request, res: Response): Promise<void> => {
    try {
      const orders = db.testOrders.find().sort((a, b) => b.orderedAt.localeCompare(a.orderedAt));
      const reports = db.medicalReports.find();
      res.json({ success: true, data: { orders, reports } });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  },

  getBillingSummary: async (req: Request, res: Response): Promise<void> => {
    try {
      const bills = db.bills.find();
      const payments = db.payments.find();

      const totalRevenue = payments.reduce((sum, p) => sum + p.amount, 0);
      const pendingRevenue = bills.filter(b => b.status === 'PENDING').reduce((sum, b) => sum + b.totalAmount, 0);

      res.json({
        success: true,
        data: {
          bills,
          payments,
          summary: {
            totalBills: bills.length,
            paidBills: bills.filter(b => b.status === 'PAID').length,
            pendingBills: bills.filter(b => b.status === 'PENDING').length,
            totalRevenue,
            pendingRevenue
          }
        }
      });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  },

  getLicenses: async (req: Request, res: Response): Promise<void> => {
    try {
      const licenses = db.organizationLicenses.find();
      res.json({ success: true, data: { licenses } });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  },

  assignLicense: async (req: Request, res: Response): Promise<void> => {
    try {
      const { organizationId, organizationName, organizationType, planId, planName, durationDays, userLimit, patientLimit, featuresEnabled } = req.body;
      if (!organizationId || !organizationName) {
        res.status(400).json({ success: false, message: 'organizationId and organizationName are required.' });
        return;
      }

      const now = new Date();
      const todayStr = now.toISOString().split('T')[0];
      const endDate = new Date(now);
      endDate.setDate(endDate.getDate() + (durationDays ? parseInt(String(durationDays), 10) : 365));

      const licNum = Math.floor(10000 + Math.random() * 90000);
      const newLicense: OrganizationLicense = {
        id: `lic-${uuidv4().substring(0, 8)}`,
        licenseId: `LIC${licNum}`,
        organizationId,
        organizationName,
        organizationType: organizationType || 'CLINIC',
        planId: planId || 'PLAN_CLINIC_ORG',
        planName: planName || 'Clinic / Organization Enterprise Plan',
        licenseStartDate: todayStr,
        licenseEndDate: endDate.toISOString().split('T')[0],
        status: 'ACTIVE',
        userLimit: userLimit ? parseInt(String(userLimit), 10) : 50,
        patientLimit: patientLimit ? parseInt(String(patientLimit), 10) : 1000,
        featuresEnabled: featuresEnabled || ['CLINICAL_PORTAL', 'DIAGNOSTIC_ORDERS', 'PRESCRIPTION_MANAGEMENT', 'ITEMIZED_BILLING'],
        assignedByAdminId: req.user?.id,
        createdAt: now.toISOString(),
        updatedAt: now.toISOString()
      };

      db.organizationLicenses.insert(newLicense);
      res.status(201).json({ success: true, data: { license: newLicense, message: 'Organization license assigned successfully.' } });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  },

  updateLicenseStatus: async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const { status, licenseEndDate, userLimit, patientLimit } = req.body;
      const lic = db.organizationLicenses.findById(id) || db.organizationLicenses.findOne(l => l.licenseId === id);
      if (!lic) {
        res.status(404).json({ success: false, message: 'License not found.' });
        return;
      }

      const updated = db.organizationLicenses.update(lic.id, {
        ...(status ? { status } : {}),
        ...(licenseEndDate ? { licenseEndDate } : {}),
        ...(userLimit ? { userLimit: parseInt(String(userLimit), 10) } : {}),
        ...(patientLimit ? { patientLimit: parseInt(String(patientLimit), 10) } : {}),
        updatedAt: new Date().toISOString()
      });

      res.json({ success: true, data: { license: updated, message: `License status updated to ${status || lic.status}.` } });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  },

  getUsage: async (req: Request, res: Response): Promise<void> => {
    try {
      const { organizationId } = req.query;
      let records = db.usageRecords.find();
      if (organizationId) {
        records = records.filter((r: any) => r.organizationId === organizationId);
      }
      res.json({ success: true, data: { usageRecords: records } });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  },

  recordUsage: async (req: Request, res: Response): Promise<void> => {
    try {
      const { organizationId, organizationName, usageType, quantity, includedQuantity, billingPeriod, unitPrice } = req.body;
      const qty = parseInt(String(quantity || 0), 10);
      const inc = parseInt(String(includedQuantity || 0), 10);
      const billable = Math.max(0, qty - inc);
      const rate = parseFloat(String(unitPrice || 0));

      const newRecord: UsageRecord = {
        id: `usg-${uuidv4().substring(0, 8)}`,
        organizationId: organizationId || 'org-1',
        organizationName: organizationName || 'Apollo Health Center',
        usageType,
        quantity: qty,
        includedQuantity: inc,
        billableQuantity: billable,
        billingPeriod: billingPeriod || new Date().toISOString().substring(0, 7),
        unitPrice: rate,
        totalAmount: billable * rate,
        createdAt: new Date().toISOString()
      };

      db.usageRecords.insert(newRecord);
      res.status(201).json({ success: true, data: { usageRecord: newRecord } });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }
};
