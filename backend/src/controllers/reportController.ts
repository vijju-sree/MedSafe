import { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../database/db';
import { MedicalReport, Notification } from '../models/types';

export const reportController = {
  // Lab uploads/generates medical investigation report
  uploadReport: async (req: Request, res: Response): Promise<void> => {
    try {
      const {
        testOrderId,
        resultSummary,
        detailedFindings,
        referenceRange,
        status = 'FINAL',
        performedBy,
        fileData,
        fileName,
        fileType = 'text/plain'
      } = req.body;

      if (!testOrderId || !resultSummary || !detailedFindings) {
        res.status(400).json({ success: false, message: 'testOrderId, resultSummary, and detailedFindings are required.' });
        return;
      }

      const order = db.testOrders.findOne(o => o.id === testOrderId || o.testOrderId === testOrderId);
      if (!order) {
        res.status(404).json({ success: false, message: `Test order ${testOrderId} not found.` });
        return;
      }

      // Generate sequential report ID
      const allReports = db.medicalReports.find();
      let maxReportNum = 10001;
      for (const r of allReports) {
        const match = r.reportId?.match(/RPT(\d+)/);
        if (match) {
          const num = parseInt(match[1], 10);
          if (num >= maxReportNum) maxReportNum = num + 1;
        }
      }
      const reportId = `RPT${maxReportNum}`;

      const now = new Date().toISOString();
      const labName = order.labName || 'Apex Diagnostics & Imaging';

      const newReport: MedicalReport = {
        id: `rpt-${uuidv4().substring(0, 8)}`,
        reportId,
        testOrderId: order.testOrderId,
        patientId: order.patientId,
        patientName: order.patientName,
        doctorId: order.doctorId,
        doctorName: order.doctorName,
        labId: order.labId || 'LAB10001',
        labName,
        testName: order.testName,
        testDate: now.split('T')[0],
        resultSummary,
        detailedFindings,
        referenceRange: referenceRange || 'Within standard physiological limits',
        status: status as any,
        performedBy: performedBy || req.user?.name || 'Senior Clinical Pathologist',
        verifiedBy: 'Dr. R. K. Sharma, MD (Pathology)',
        fileData: fileData || undefined,
        fileName: fileName || `${order.testName.replace(/[^a-zA-Z0-9]/g, '_')}_Report.pdf`,
        fileType,
        uploadedAt: now,
        disclaimer: 'CLINICAL NOTICE: This diagnostic report is strictly for licensed medical review and clinical interpretation. MedSafe does not provide automated diagnosis.'
      };

      db.medicalReports.insert(newReport);

      // Update test order status to COMPLETED
      db.testOrders.update(order.id, {
        status: 'COMPLETED',
        completedAt: now,
        reportId: newReport.id
      });

      // Notify Patient
      const patient = db.patients.findOne(p => p.patientId === order.patientId);
      if (patient) {
        const patNotif: Notification = {
          id: `notif-${uuidv4().substring(0, 8)}`,
          recipientId: patient.userId,
          recipientRole: 'PATIENT',
          patientId: order.patientId,
          type: 'REPORT_READY',
          title: `Report Ready: ${order.testName}`,
          message: `Your medical investigation report #${reportId} for ${order.testName} has been published by ${labName}.`,
          metadata: { reportId, testOrderId: order.testOrderId, testName: order.testName },
          readStatus: false,
          deliveryStatus: 'DELIVERED',
          createdAt: now
        };
        db.notifications.insert(patNotif);
      }

      // Notify Prescribing Doctor
      const doctorUser = db.users.findOne(u => u.doctorId === order.doctorId);
      if (doctorUser) {
        const docNotif: Notification = {
          id: `notif-${uuidv4().substring(0, 8)}`,
          recipientId: doctorUser.id,
          recipientRole: 'DOCTOR',
          patientId: order.patientId,
          type: 'REPORT_READY',
          title: `Report Ready: ${order.patientName} (${order.testName})`,
          message: `Lab report #${reportId} for patient ${order.patientName} (${order.testName}) is now ready for clinical review.`,
          metadata: { reportId, testOrderId: order.testOrderId, patientId: order.patientId },
          readStatus: false,
          deliveryStatus: 'DELIVERED',
          createdAt: now
        };
        db.notifications.insert(docNotif);
      }

      res.status(201).json({
        success: true,
        data: {
          report: newReport,
          message: `Medical report #${reportId} successfully uploaded and linked to order #${order.testOrderId}.`
        }
      });
    } catch (error: any) {
      console.error('uploadReport error:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  },

  // Get reports for a patient with relationship checks
  getPatientReports: async (req: Request, res: Response): Promise<void> => {
    try {
      const patientId = req.params.patientId;
      const user = req.user;

      // Access verification: patient themselves, their doctor, caregiver, lab, or admin
      if (user) {
        if (user.role === 'PATIENT' && user.patientId !== patientId) {
          res.status(403).json({ success: false, message: 'Unauthorized access to patient reports.' });
          return;
        }
        if (user.role === 'DOCTOR') {
          const doc = db.doctors.findOne(d => d.doctorId === user.doctorId);
          if (doc && !doc.authorizedPatientIds?.includes(patientId)) {
            // Check if doctor has prescribed any order for this patient
            const hasOrder = db.testOrders.findOne(o => o.doctorId === user.doctorId && o.patientId === patientId);
            const hasReq = db.consultationRequests.findOne(c => c.doctorId === user.doctorId && c.patientId === patientId && c.status === 'ACCEPTED');
            if (!hasOrder && !hasReq) {
              res.status(403).json({ success: false, message: 'You are not an authorized doctor for this patient.' });
              return;
            }
          }
        }
        if (user.role === 'CAREGIVER') {
          const consent = db.consents.findOne(c => c.granteeId === user.id && c.patientId === patientId && c.status === 'ACTIVE');
          if (!consent) {
            res.status(403).json({ success: false, message: 'No active caregiver consent found for this patient.' });
            return;
          }
        }
        if (user.role === 'RECEPTIONIST') {
          const rel = db.patientHospitalRelationships.findOne(
            r => r.patientId === patientId && r.hospitalId === user.hospitalId && r.status === 'ACTIVE'
          );
          if (!rel) {
            res.status(403).json({ success: false, message: 'Access Denied: Patient is not associated with your hospital organization.' });
            return;
          }
        }
      }

      const reports = db.medicalReports.find(r => r.patientId === patientId).sort((a, b) => b.uploadedAt.localeCompare(a.uploadedAt));
      res.json({ success: true, data: { reports } });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  },

  // Get single report details
  getReportById: async (req: Request, res: Response): Promise<void> => {
    try {
      const id = req.params.id;
      const user = req.user;
      const report = db.medicalReports.findOne(r => r.id === id || r.reportId === id);
      if (!report) {
        res.status(404).json({ success: false, message: `Medical report ${id} not found.` });
        return;
      }

      if (user && user.role === 'RECEPTIONIST') {
        const rel = db.patientHospitalRelationships.findOne(
          r => r.patientId === report.patientId && r.hospitalId === user.hospitalId && r.status === 'ACTIVE'
        );
        if (!rel) {
          res.status(403).json({
            success: false,
            message: 'Access Denied: Medical report belongs to a patient from another hospital organization.'
          });
          return;
        }

        // Log audit
        db.auditLogs.insert({
          id: `aud-${uuidv4().substring(0, 8)}`,
          userId: user.id,
          userName: user.name || 'Receptionist',
          userRole: 'RECEPTIONIST',
          action: 'REPORT_VIEWED_RECEPTIONIST',
          resource: `MedicalReport:${report.reportId}`,
          details: { reportId: report.reportId, patientId: report.patientId, hospitalId: user.hospitalId },
          result: 'SUCCESS',
          timestamp: new Date().toISOString()
        });
      }

      res.json({ success: true, data: { report } });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  },

  // Secure download/export of report
  downloadReport: async (req: Request, res: Response): Promise<void> => {
    try {
      const id = req.params.id;
      const report = db.medicalReports.findOne(r => r.id === id || r.reportId === id);
      if (!report) {
        res.status(404).json({ success: false, message: `Medical report ${id} not found.` });
        return;
      }

      // Generate structured clinical document text representation
      const documentText = `
================================================================================
                    MEDSAFE DIAGNOSTIC SERVICES & IMAGING
                        OFFICIAL LABORATORY REPORT
================================================================================
Report ID      : ${report.reportId}
Test Order Ref : ${report.testOrderId}
Date of Test   : ${report.testDate}
Uploaded At    : ${report.uploadedAt}
Status         : ${report.status}
--------------------------------------------------------------------------------
PATIENT INFORMATION:
Name           : ${report.patientName}
Patient ID     : ${report.patientId}

CLINICAL REFERRAL:
Prescribed By  : ${report.doctorName} (${report.doctorId})

PERFORMING LABORATORY:
Facility       : ${report.labName} (${report.labId})
Investigator   : ${report.performedBy}
Verified By    : ${report.verifiedBy || 'Staff Pathologist'}
--------------------------------------------------------------------------------
INVESTIGATION PERFORMED:
Test Name      : ${report.testName}

RESULT SUMMARY:
${report.resultSummary}

DETAILED CLINICAL FINDINGS:
${report.detailedFindings}

REFERENCE RANGES:
${report.referenceRange || 'Standard adult reference ranges applied.'}
--------------------------------------------------------------------------------
DISCLAIMER & SAFETY NOTICE:
${report.disclaimer}
================================================================================
`.trim();

      res.setHeader('Content-Type', 'text/plain; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="${report.reportId}_${report.patientId}.txt"`);
      res.send(documentText);
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  },

  // Get all reports (Lab / Admin)
  getAllReports: async (req: Request, res: Response): Promise<void> => {
    try {
      const reports = db.medicalReports.find().sort((a, b) => b.uploadedAt.localeCompare(a.uploadedAt));
      res.json({ success: true, data: { reports } });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }
};
