import { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../database/db';
import {
  PatientHospitalRelationship,
  DoctorPatientRelationship,
  Consultation,
  Consent,
  Notification
} from '../models/types';

export const receptionistController = {
  // Get Receptionist Dashboard Metrics & Overview
  getDashboard: async (req: Request, res: Response): Promise<void> => {
    try {
      const user = req.user;
      if (!user || user.role !== 'RECEPTIONIST' && user.role !== 'ADMIN') {
        res.status(403).json({ success: false, message: 'Access denied. Receptionist role required.' });
        return;
      }

      const hospitalId = user.hospitalId || 'HOSP-00125';
      const org = db.organizations.findOne(o => o.hospitalId === hospitalId || o.id === hospitalId);
      const hospitalName = org?.name || user.hospitalName || 'ABC Hospital';

      // 1. Hospital Patients count
      const hospitalPatientRels = db.patientHospitalRelationships.find(
        r => r.hospitalId === hospitalId && r.status === 'ACTIVE'
      );
      const patientIds = Array.from(new Set(hospitalPatientRels.map(r => r.patientId)));

      // 2. Pending Requests for this hospital
      const pendingRequests = db.consultationRequests.find(
        r => (r.hospitalId === hospitalId || (!r.hospitalId && hospitalId === 'HOSP-00125')) && r.status === 'PENDING'
      );

      // 3. Hospital Doctors
      const hospitalDoctors = db.doctors.find(
        d => Boolean(d.hospitalId === hospitalId || (org && d.organizationId === org.id))
      );

      // 4. Reports for this hospital's patients
      const hospitalReports = db.medicalReports.find(
        r => patientIds.includes(r.patientId)
      );

      // 5. Test orders for this hospital
      const hospitalOrders = db.testOrders.find(
        o => patientIds.includes(o.patientId)
      );

      // 6. Recent requests
      const allHospitalRequests = db.consultationRequests.find(
        r => r.hospitalId === hospitalId || (!r.hospitalId && hospitalId === 'HOSP-00125')
      ).sort((a, b) => b.requestedAt.localeCompare(a.requestedAt));

      res.json({
        success: true,
        data: {
          hospital: {
            hospitalId,
            hospitalName,
            address: org?.address || 'Healthcare Blvd, City Center',
            phone: org?.phone || '+91 40 2360 7777',
            type: org?.type || 'HOSPITAL'
          },
          counts: {
            totalPatients: patientIds.length,
            pendingRequests: pendingRequests.length,
            hospitalDoctors: hospitalDoctors.length,
            totalReports: hospitalReports.length,
            testOrders: hospitalOrders.length
          },
          recentRequests: allHospitalRequests.slice(0, 10),
          doctors: hospitalDoctors.map(d => ({
            id: d.id,
            doctorId: d.doctorId,
            name: d.name,
            specialty: d.specialty,
            councilRegistrationId: d.councilRegistrationId || d.licenseNumber,
            phone: d.phone,
            email: d.email,
            patientCount: d.authorizedPatientIds?.length || 0
          }))
        }
      });
    } catch (error: any) {
      console.error('getReceptionistDashboard error:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  },

  // Get Patient Connection Requests for Receptionist's Hospital
  getRequests: async (req: Request, res: Response): Promise<void> => {
    try {
      const user = req.user;
      if (!user) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }

      const hospitalId = user.hospitalId || 'HOSP-00125';
      const statusFilter = req.query.status as string;

      let requests = db.consultationRequests.find(
        r => r.hospitalId === hospitalId || (!r.hospitalId && hospitalId === 'HOSP-00125')
      );

      if (statusFilter && statusFilter !== 'ALL') {
        requests = requests.filter(r => r.status === statusFilter);
      }

      requests.sort((a, b) => b.requestedAt.localeCompare(a.requestedAt));

      res.json({ success: true, data: { requests } });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  },

  // Receptionist Accepts or Rejects Patient Request
  respondToRequest: async (req: Request, res: Response): Promise<void> => {
    try {
      const user = req.user;
      const { id } = req.params;
      const { action: rawAction, response, notes } = req.body; // 'ACCEPTED' | 'REJECTED'
      const action = rawAction || response;

      if (!action || !['ACCEPTED', 'REJECTED'].includes(action)) {
        res.status(400).json({ success: false, message: 'Valid action (ACCEPTED or REJECTED) is required.' });
        return;
      }

      const request = db.consultationRequests.findById(id);
      if (!request) {
        res.status(404).json({ success: false, message: 'Consultation request not found.' });
        return;
      }

      const hospitalId = user?.hospitalId || 'HOSP-00125';
      const org = db.organizations.findOne(o => o.hospitalId === hospitalId || o.id === hospitalId);
      const hospitalName = org?.name || user?.hospitalName || 'ABC Hospital';

      // Enforce organization-level authorization
      if (request.hospitalId && request.hospitalId !== hospitalId) {
        res.status(403).json({
          success: false,
          message: 'Access Denied: This patient request belongs to a different hospital organization.'
        });
        return;
      }

      const now = new Date().toISOString();
      const updatedReq = db.consultationRequests.update(id, {
        status: action,
        respondedAt: now,
        acceptedBy: user?.receptionistId || user?.name || 'Receptionist',
        acceptedByRole: 'RECEPTIONIST',
        notes: notes || (action === 'ACCEPTED' ? `Request accepted by hospital receptionist ${user?.name || ''}` : 'Doctor unavailable')
      });

      if (action === 'ACCEPTED') {
        const doctor = db.doctors.findOne(d => d.doctorId === request.doctorId || d.id === request.doctorId);
        const patient = db.patients.findOne(p => p.patientId === request.patientId);

        if (patient) {
          // 1. Create Patient-Hospital Relationship
          const existingPhr = db.patientHospitalRelationships.findOne(
            r => r.patientId === patient.patientId && r.hospitalId === hospitalId
          );
          if (!existingPhr) {
            db.patientHospitalRelationships.insert({
              id: `phr-${uuidv4().substring(0, 8)}`,
              relationshipId: `REL-HOSP-${Date.now()}`,
              patientId: patient.patientId,
              hospitalId,
              hospitalName,
              receptionistId: user?.receptionistId || 'REC-0018',
              status: 'ACTIVE',
              createdAt: now
            });
          } else if (existingPhr.status !== 'ACTIVE') {
            db.patientHospitalRelationships.update(existingPhr.id, { status: 'ACTIVE' });
          }

          // 2. Create Doctor-Patient Relationship
          if (doctor) {
            const existingDpr = db.doctorPatientRelationships.findOne(
              r => r.patientId === patient.patientId && r.doctorId === doctor.doctorId && r.hospitalId === hospitalId
            );
            if (!existingDpr) {
              db.doctorPatientRelationships.insert({
                id: `dpr-${uuidv4().substring(0, 8)}`,
                relationshipId: `REL-DOC-${Date.now()}`,
                patientId: patient.patientId,
                doctorId: doctor.doctorId,
                doctorName: doctor.name,
                hospitalId,
                hospitalName,
                status: 'ACTIVE',
                createdAt: now,
                acceptedBy: user?.receptionistId || 'REC-0018',
                acceptedByRole: 'RECEPTIONIST',
                acceptedAt: now
              });
            } else if (existingDpr.status !== 'ACTIVE') {
              db.doctorPatientRelationships.update(existingDpr.id, {
                status: 'ACTIVE',
                acceptedBy: user?.receptionistId || 'REC-0018',
                acceptedAt: now
              });
            }

            // Add patient to doctor's authorized list
            if (!doctor.authorizedPatientIds.includes(patient.patientId)) {
              db.doctors.update(doctor.id, {
                authorizedPatientIds: [...doctor.authorizedPatientIds, patient.patientId]
              });
            }

            // Add doctor and hospital to patient's lists
            const updatedDoctorIds = Array.from(new Set([...(patient.doctorIds || []), doctor.doctorId]));
            const updatedClinicIds = Array.from(new Set([...(patient.clinicIds || []), hospitalId, doctor.clinicId]));
            db.patients.update(patient.id, {
              doctorIds: updatedDoctorIds,
              clinicIds: updatedClinicIds
            });

            // Create Consent
            const consent: Consent = {
              id: `con-${uuidv4().substring(0, 8)}`,
              patientId: patient.patientId,
              granteeId: doctor.userId,
              granteeName: doctor.name,
              granteeEmail: doctor.email,
              granteeRole: 'DOCTOR',
              accessScope: 'ALL',
              status: 'ACTIVE',
              grantedAt: now
            };
            db.consents.insert(consent);

            // Create scheduled consultation milestone
            const consultation: Consultation = {
              id: `cns-${uuidv4().substring(0, 8)}`,
              consultationRequestId: id,
              patientId: patient.patientId,
              doctorId: doctor.doctorId,
              clinicId: doctor.clinicId,
              consultationDate: now.split('T')[0],
              status: 'SCHEDULED',
              createdAt: now
            };
            db.consultations.insert(consultation);

            // Notify Doctor
            const docUser = db.users.findOne(u => u.doctorId === doctor.doctorId || u.id === doctor.userId);
            if (docUser) {
              db.notifications.insert({
                id: `notif-doc-linked-${uuidv4().substring(0, 8)}`,
                recipientId: docUser.id,
                recipientRole: 'DOCTOR',
                patientId: patient.patientId,
                type: 'FOLLOW_UP',
                title: `New Patient Added: ${patient.name}`,
                message: `New patient ${patient.name} has been approved and added to your patient list by ${user?.name || 'Hospital Reception'}.`,
                metadata: { patientId: patient.patientId, consultationRequestId: id },
                readStatus: false,
                deliveryStatus: 'DELIVERED',
                createdAt: now
              });
            }
          }

          // Notify Patient
          const patientUser = db.users.findOne(u => u.patientId === patient.patientId);
          if (patientUser) {
            db.notifications.insert({
              id: `notif-pat-acc-${uuidv4().substring(0, 8)}`,
              recipientId: patientUser.id,
              recipientRole: 'PATIENT',
              patientId: patient.patientId,
              type: 'FOLLOW_UP',
              title: `Consultation Request Accepted! 🎉`,
              message: `Your request to consult Dr. ${request.doctorName} at ${hospitalName} has been accepted. You are now connected.`,
              metadata: { consultationRequestId: id, hospitalId, doctorId: request.doctorId },
              readStatus: false,
              deliveryStatus: 'DELIVERED',
              createdAt: now
            });
          }

          // Log Audit Trail
          db.auditLogs.insert({
            id: `aud-${uuidv4().substring(0, 8)}`,
            userId: user?.id || 'usr-rec',
            userName: user?.name || 'Receptionist',
            userRole: 'RECEPTIONIST',
            action: 'PATIENT_REQUEST_ACCEPTED',
            resource: `ConsultationRequest:${id}`,
            details: {
              requestId: id,
              patientId: patient.patientId,
              doctorId: request.doctorId,
              hospitalId,
              receptionistId: user?.receptionistId
            },
            result: 'SUCCESS',
            timestamp: now
          });
        }
      }

      res.json({
        success: true,
        data: {
          request: updatedReq,
          message: action === 'ACCEPTED'
            ? 'Patient request accepted. Care relationship established with Hospital & Doctor.'
            : 'Patient request rejected.'
        }
      });
    } catch (error: any) {
      console.error('respondToRequest error:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  },

  // Get Patients connected to Receptionist's Hospital
  getHospitalPatients: async (req: Request, res: Response): Promise<void> => {
    try {
      const user = req.user;
      const hospitalId = user?.hospitalId || 'HOSP-00125';
      const q = ((req.query.q as string) || '').toLowerCase().trim();

      const hospitalRels = db.patientHospitalRelationships.find(
        r => r.hospitalId === hospitalId && r.status === 'ACTIVE'
      );
      const patientIdSet = new Set(hospitalRels.map(r => r.patientId));

      let patients = db.patients.find(p => patientIdSet.has(p.patientId));

      if (q) {
        patients = patients.filter(
          p =>
            p.name.toLowerCase().includes(q) ||
            p.patientId.toLowerCase().includes(q) ||
            p.email.toLowerCase().includes(q) ||
            p.phone.includes(q)
        );
      }

      // Enrich with assigned hospital doctors
      const enriched = patients.map(p => {
        const dprs = db.doctorPatientRelationships.find(
          r => r.patientId === p.patientId && r.hospitalId === hospitalId && r.status === 'ACTIVE'
        );
        const rel = hospitalRels.find(r => r.patientId === p.patientId);

        return {
          id: p.id,
          patientId: p.patientId,
          name: p.name,
          dob: p.dob,
          gender: p.gender,
          email: p.email,
          phone: p.phone,
          address: p.address,
          emergencyContact: p.emergencyContact,
          connectedSince: rel?.createdAt || p.registeredDate,
          assignedDoctors: dprs.map(d => ({
            doctorId: d.doctorId,
            doctorName: d.doctorName
          }))
        };
      });

      res.json({ success: true, data: { patients: enriched } });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  },

  // Get Operational Detail for a Hospital Patient (Non-Clinical Receptionist View)
  getPatientDetail: async (req: Request, res: Response): Promise<void> => {
    try {
      const user = req.user;
      const { patientId } = req.params;
      const hospitalId = user?.hospitalId || 'HOSP-00125';

      // Security check: Patient must belong to receptionist's hospital
      const rel = db.patientHospitalRelationships.findOne(
        r => r.patientId === patientId && r.hospitalId === hospitalId && r.status === 'ACTIVE'
      );
      if (!rel && user?.role !== 'ADMIN') {
        res.status(403).json({
          success: false,
          message: 'Access Denied: Patient is not registered with your hospital organization.'
        });
        return;
      }

      const patient = db.patients.findOne(p => p.patientId === patientId);
      if (!patient) {
        res.status(404).json({ success: false, message: 'Patient not found.' });
        return;
      }

      // Operational Information
      const assignedDoctors = db.doctorPatientRelationships.find(
        r => r.patientId === patientId && r.hospitalId === hospitalId && r.status === 'ACTIVE'
      );

      const testOrders = db.testOrders.find(
        o => o.patientId === patientId
      );

      const reports = db.medicalReports.find(
        r => r.patientId === patientId
      );

      // Medication operational overview (Read-only summary)
      const medications = db.medications.find(
        m => m.patientId === patientId && m.active
      ).map(m => ({
        name: m.name,
        dosage: `${m.dosageAmount} ${m.dosageUnit}`,
        frequency: m.frequency,
        prescribingDoctorName: m.doctorName || 'Attending Physician',
        startDate: m.startDate,
        endDate: m.endDate,
        status: m.prescriptionStatus
      }));

      // Consultations
      const consultations = db.consultations.find(
        c => c.patientId === patientId
      );

      // Bills
      const bills = db.bills.find(
        b => b.patientId === patientId
      );

      const dobDate = patient.dob ? new Date(patient.dob) : null;
      const age = dobDate ? Math.floor((Date.now() - dobDate.getTime()) / (365.25 * 24 * 3600 * 1000)) : undefined;

      res.json({
        success: true,
        data: {
          patient: {
            patientId: patient.patientId,
            name: patient.name,
            dob: patient.dob,
            age,
            gender: patient.gender,
            bloodGroup: (patient as any).bloodGroup || 'O+',
            email: patient.email,
            phone: patient.phone,
            address: patient.address,
            emergencyContact: patient.emergencyContact,
            registeredDate: patient.registeredDate,
            connectedAt: rel?.createdAt
          },
          assignedDoctors: assignedDoctors.map(d => {
            const docInfo = db.doctors.findOne(doc => doc.doctorId === d.doctorId || doc.id === d.doctorId);
            return {
              doctorId: d.doctorId,
              doctorName: d.doctorName || docInfo?.name || 'Dr. Attending',
              name: d.doctorName || docInfo?.name || 'Dr. Attending',
              specialization: docInfo?.specialty || (docInfo as any)?.specialization || 'General Medicine',
              councilRegistrationId: docInfo?.councilRegistrationId || docInfo?.licenseNumber,
              acceptedBy: d.acceptedBy,
              connectedAt: d.createdAt
            };
          }),
          medications,
          medicationsSummary: medications,
          testOrders,
          reports: reports.map(r => ({
            reportId: r.reportId,
            testName: r.testName,
            testDate: r.testDate,
            orderingDoctor: r.doctorName,
            status: r.status,
            resultSummary: r.resultSummary
          })),
          consultations,
          bills
        }
      });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  },

  // Global Patient Search (by Patient ID, Email, Phone) to link existing patient
  searchGlobalPatient: async (req: Request, res: Response): Promise<void> => {
    try {
      const q = ((req.query.q as string) || (req.body.q as string) || '').trim();
      if (!q) {
        res.status(400).json({ success: false, message: 'Search query (Patient ID, Email, or Phone) is required.' });
        return;
      }

      const hospitalId = req.user?.hospitalId || 'HOSP-00125';

      const patient = db.patients.findOne(
        p =>
          p.patientId.toUpperCase() === q.toUpperCase() ||
          p.email.toLowerCase() === q.toLowerCase() ||
          p.phone.includes(q)
      );

      if (!patient) {
        res.json({ success: true, data: { found: false, message: 'No patient found matching search criteria.' } });
        return;
      }

      // Check if already linked
      const existingRel = db.patientHospitalRelationships.findOne(
        r => r.patientId === patient.patientId && r.hospitalId === hospitalId && r.status === 'ACTIVE'
      );

      const patData = {
        patientId: patient.patientId,
        name: patient.name,
        gender: patient.gender,
        dob: patient.dob,
        email: patient.email,
        phone: patient.phone,
        address: patient.address,
        isLinked: !!existingRel,
        alreadyLinked: !!existingRel
      };

      res.json({
        success: true,
        data: {
          found: true,
          patient: patData,
          patients: [patData]
        }
      });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  },

  // Link Existing Patient to Receptionist's Hospital
  linkPatient: async (req: Request, res: Response): Promise<void> => {
    try {
      const user = req.user;
      const { patientId, doctorId } = req.body;

      if (!patientId) {
        res.status(400).json({ success: false, message: 'Patient ID is required.' });
        return;
      }

      const hospitalId = user?.hospitalId || 'HOSP-00125';
      const org = db.organizations.findOne(o => o.hospitalId === hospitalId || o.id === hospitalId);
      const hospitalName = org?.name || user?.hospitalName || 'ABC Hospital';

      const patient = db.patients.findOne(p => p.patientId === patientId);
      if (!patient) {
        res.status(404).json({ success: false, message: `Patient ${patientId} not found.` });
        return;
      }

      const now = new Date().toISOString();

      // 1. Create or Activate Patient-Hospital Relationship
      let phr = db.patientHospitalRelationships.findOne(
        r => r.patientId === patient.patientId && r.hospitalId === hospitalId
      );
      if (!phr) {
        phr = db.patientHospitalRelationships.insert({
          id: `phr-${uuidv4().substring(0, 8)}`,
          relationshipId: `REL-HOSP-${Date.now()}`,
          patientId: patient.patientId,
          hospitalId,
          hospitalName,
          receptionistId: user?.receptionistId || 'REC-0018',
          status: 'ACTIVE',
          createdAt: now
        });
      } else if (phr.status !== 'ACTIVE') {
        db.patientHospitalRelationships.update(phr.id, {
          status: 'ACTIVE',
          receptionistId: user?.receptionistId,
          endedAt: undefined
        });
      }

      // Add hospital to patient clinicIds
      const updatedClinicIds = Array.from(new Set([...(patient.clinicIds || []), hospitalId]));
      db.patients.update(patient.id, { clinicIds: updatedClinicIds });

      // 2. If Doctor selected, link doctor as well
      let doctorName = '';
      if (doctorId) {
        const doctor = db.doctors.findOne(d => d.doctorId === doctorId || d.id === doctorId);
        if (doctor) {
          doctorName = doctor.name;
          let dpr = db.doctorPatientRelationships.findOne(
            r => r.patientId === patient.patientId && r.doctorId === doctor.doctorId && r.hospitalId === hospitalId
          );
          if (!dpr) {
            db.doctorPatientRelationships.insert({
              id: `dpr-${uuidv4().substring(0, 8)}`,
              relationshipId: `REL-DOC-${Date.now()}`,
              patientId: patient.patientId,
              doctorId: doctor.doctorId,
              doctorName: doctor.name,
              hospitalId,
              hospitalName,
              status: 'ACTIVE',
              createdAt: now,
              acceptedBy: user?.receptionistId || 'REC-0018',
              acceptedByRole: 'RECEPTIONIST',
              acceptedAt: now
            });
          }

          // Add to doctor's authorized patients
          if (!doctor.authorizedPatientIds.includes(patient.patientId)) {
            db.doctors.update(doctor.id, {
              authorizedPatientIds: [...doctor.authorizedPatientIds, patient.patientId]
            });
          }

          // Add to patient's doctorIds
          const updatedDoctorIds = Array.from(new Set([...(patient.doctorIds || []), doctor.doctorId]));
          db.patients.update(patient.id, { doctorIds: updatedDoctorIds });

          // Add consent
          db.consents.insert({
            id: `con-${uuidv4().substring(0, 8)}`,
            patientId: patient.patientId,
            granteeId: doctor.userId,
            granteeName: doctor.name,
            granteeEmail: doctor.email,
            granteeRole: 'DOCTOR',
            accessScope: 'ALL',
            status: 'ACTIVE',
            grantedAt: now
          });
        }
      }

      // Notify Patient
      const patientUser = db.users.findOne(u => u.patientId === patient.patientId);
      if (patientUser) {
        db.notifications.insert({
          id: `notif-pat-reg-${uuidv4().substring(0, 8)}`,
          recipientId: patientUser.id,
          recipientRole: 'PATIENT',
          patientId: patient.patientId,
          type: 'FOLLOW_UP',
          title: `Registered with ${hospitalName}`,
          message: `You have been added to ${hospitalName} by reception.${doctorName ? ` Assigned Doctor: Dr. ${doctorName}.` : ''}`,
          metadata: { hospitalId },
          readStatus: false,
          deliveryStatus: 'DELIVERED',
          createdAt: now
        });
      }

      // Log Audit Trail
      db.auditLogs.insert({
        id: `aud-${uuidv4().substring(0, 8)}`,
        userId: user?.id || 'usr-rec',
        userName: user?.name || 'Receptionist',
        userRole: 'RECEPTIONIST',
        action: 'RECEPTIONIST_PATIENT_LINKED',
        resource: `Patient:${patient.patientId}`,
        details: { patientId: patient.patientId, hospitalId, doctorId, receptionistId: user?.receptionistId },
        result: 'SUCCESS',
        timestamp: now
      });

      res.status(201).json({
        success: true,
        data: {
          patientId: patient.patientId,
          name: patient.name,
          hospitalId,
          hospitalName,
          message: `Patient ${patient.name} (${patient.patientId}) successfully enrolled at ${hospitalName}.`
        }
      });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  },

  // Get Diagnostic Reports belonging to Receptionist's Hospital Patients
  getHospitalReports: async (req: Request, res: Response): Promise<void> => {
    try {
      const user = req.user;
      const hospitalId = user?.hospitalId || 'HOSP-00125';

      // Find all patients associated with this hospital
      const hospitalRels = db.patientHospitalRelationships.find(
        r => r.hospitalId === hospitalId && r.status === 'ACTIVE'
      );
      const patientIds = Array.from(new Set(hospitalRels.map(r => r.patientId)));

      const reports = db.medicalReports.find(
        r => patientIds.includes(r.patientId)
      ).sort((a, b) => b.uploadedAt.localeCompare(a.uploadedAt));

      res.json({ success: true, data: { reports } });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  },

  // View Single Diagnostic Report (Read-Only with Security Check & Audit Log)
  getHospitalReportDetail: async (req: Request, res: Response): Promise<void> => {
    try {
      const user = req.user;
      const { id } = req.params;
      const hospitalId = user?.hospitalId || 'HOSP-00125';

      const report = db.medicalReports.findOne(r => r.id === id || r.reportId === id);
      if (!report) {
        res.status(404).json({ success: false, message: 'Medical report not found.' });
        return;
      }

      // Multi-tenant check: Report's patient must be associated with receptionist's hospital
      const rel = db.patientHospitalRelationships.findOne(
        r => r.patientId === report.patientId && r.hospitalId === hospitalId && r.status === 'ACTIVE'
      );

      if (!rel && user?.role !== 'ADMIN') {
        res.status(403).json({
          success: false,
          message: 'Access Denied: Medical report belongs to a patient from another hospital organization.'
        });
        return;
      }

      // Log audit access
      db.auditLogs.insert({
        id: `aud-${uuidv4().substring(0, 8)}`,
        userId: user?.id || 'usr-rec',
        userName: user?.name || 'Receptionist',
        userRole: 'RECEPTIONIST',
        action: 'REPORT_VIEWED_RECEPTIONIST',
        resource: `MedicalReport:${report.reportId}`,
        details: { reportId: report.reportId, patientId: report.patientId, hospitalId },
        result: 'SUCCESS',
        timestamp: new Date().toISOString()
      });

      res.json({ success: true, data: { report } });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  },

  // Get Doctors practicing at Receptionist's Hospital
  getHospitalDoctors: async (req: Request, res: Response): Promise<void> => {
    try {
      const user = req.user;
      const hospitalId = user?.hospitalId || 'HOSP-00125';
      const org = db.organizations.findOne(o => o.hospitalId === hospitalId || o.id === hospitalId);

      const doctors = db.doctors.find(
        d => Boolean(d.hospitalId === hospitalId || (org && d.organizationId === org.id))
      ).map(d => ({
        id: d.id,
        doctorId: d.doctorId,
        name: d.name,
        specialty: d.specialty,
        councilRegistrationId: d.councilRegistrationId || d.licenseNumber,
        hospitalId: d.hospitalId || hospitalId,
        hospitalName: d.hospitalName || org?.name || 'ABC Hospital',
        phone: d.phone,
        email: d.email,
        authorizedPatientsCount: d.authorizedPatientIds?.length || 0
      }));

      res.json({ success: true, data: { doctors } });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }
};
