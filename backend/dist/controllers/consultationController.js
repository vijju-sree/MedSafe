"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.consultationController = void 0;
const uuid_1 = require("uuid");
const db_1 = require("../database/db");
exports.consultationController = {
    // Public Discovery Search for Doctors & Clinics (No patient records exposed)
    searchDoctors: async (req, res) => {
        try {
            const q = (req.query.q || '').toLowerCase().trim();
            const allDoctors = db_1.db.doctors.find();
            const clinics = db_1.db.clinics.find();
            const organizations = db_1.db.organizations.find();
            const doctorCatalog = allDoctors.map(doc => {
                const clinic = clinics.find(c => c.id === doc.clinicId);
                const org = organizations.find(o => o.id === doc.organizationId);
                return {
                    id: doc.id,
                    doctorId: doc.doctorId,
                    name: doc.name,
                    specialty: doc.specialty,
                    councilRegistrationId: doc.councilRegistrationId || doc.licenseNumber,
                    hospitalId: doc.hospitalId || org?.hospitalId || 'HOSP-00125',
                    hospitalName: doc.hospitalName || org?.name || 'ABC Hospital',
                    clinicId: doc.clinicId,
                    clinicName: clinic?.name || 'Central Clinic',
                    organizationName: org?.name || doc.hospitalName || 'ABC Hospital',
                    location: clinic?.location || 'Main Medical Center',
                    phone: doc.phone,
                    email: doc.email
                };
            });
            if (!q) {
                res.json({ success: true, data: { doctors: doctorCatalog } });
                return;
            }
            const filtered = doctorCatalog.filter(doc => doc.name.toLowerCase().includes(q) ||
                doc.specialty.toLowerCase().includes(q) ||
                doc.clinicName.toLowerCase().includes(q) ||
                doc.organizationName.toLowerCase().includes(q) ||
                doc.location.toLowerCase().includes(q));
            res.json({ success: true, data: { doctors: filtered } });
        }
        catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    },
    // Patient creates a Consultation Request (Status: PENDING)
    requestConsultation: async (req, res) => {
        try {
            const { doctorId, reason } = req.body;
            const patientId = req.user?.patientId || req.body.patientId;
            if (!patientId || !doctorId) {
                res.status(400).json({ success: false, message: 'patientId and doctorId are required.' });
                return;
            }
            const patient = db_1.db.patients.findOne(p => p.patientId === patientId);
            const doctor = db_1.db.doctors.findOne(d => d.doctorId === doctorId || d.id === doctorId);
            if (!patient) {
                res.status(404).json({ success: false, message: `Patient ${patientId} not found.` });
                return;
            }
            if (!doctor) {
                res.status(404).json({ success: false, message: `Doctor ${doctorId} not found.` });
                return;
            }
            // Check if there is already a pending request
            const existingPending = db_1.db.consultationRequests.findOne(r => r.patientId === patientId && (r.doctorId === doctor.doctorId || r.doctorId === doctor.id) && r.status === 'PENDING');
            if (existingPending) {
                res.status(400).json({
                    success: false,
                    message: 'A consultation request to this doctor is already pending approval.'
                });
                return;
            }
            const clinic = db_1.db.clinics.findById(doctor.clinicId);
            const now = new Date().toISOString();
            const hospId = doctor.hospitalId || 'HOSP-00125';
            const hospName = doctor.hospitalName || (hospId === 'HOSP-00482' ? 'XYZ Hospital' : 'ABC Hospital');
            const reqNumber = `REQ-${Math.floor(10000 + Math.random() * 90000)}`;
            const newRequest = {
                id: `cr-${(0, uuid_1.v4)().substring(0, 8)}`,
                requestId: reqNumber,
                patientId: patient.patientId,
                patientName: patient.name,
                patientEmail: patient.email,
                patientPhone: patient.phone,
                doctorId: doctor.doctorId,
                doctorName: doctor.name,
                specialty: doctor.specialty,
                hospitalId: hospId,
                hospitalName: hospName,
                clinicId: doctor.clinicId,
                clinicName: clinic?.name || hospName,
                reason: reason || 'Initial consultation & medication prescription request',
                status: 'PENDING',
                requestedAt: now
            };
            db_1.db.consultationRequests.insert(newRequest);
            // Notify Doctor
            const doctorUser = db_1.db.users.findOne(u => u.doctorId === doctor.doctorId || u.id === doctor.userId);
            if (doctorUser) {
                db_1.db.notifications.insert({
                    id: `notif-cr-${(0, uuid_1.v4)().substring(0, 8)}`,
                    recipientId: doctorUser.id,
                    recipientRole: 'DOCTOR',
                    patientId: patient.patientId,
                    type: 'FOLLOW_UP',
                    title: `New Consultation Request: ${patient.name}`,
                    message: `Patient ${patient.name} (${patient.patientId}) has requested a consultation with you at ${hospName}.`,
                    metadata: { consultationRequestId: newRequest.id },
                    readStatus: false,
                    deliveryStatus: 'DELIVERED',
                    createdAt: now
                });
            }
            // Notify Hospital Receptionists
            const hospitalRecs = db_1.db.receptionists.find(r => r.hospitalId === hospId);
            for (const rec of hospitalRecs) {
                const recUser = db_1.db.users.findOne(u => u.id === rec.userId || u.receptionistId === rec.receptionistId);
                if (recUser) {
                    db_1.db.notifications.insert({
                        id: `notif-cr-rec-${(0, uuid_1.v4)().substring(0, 8)}`,
                        recipientId: recUser.id,
                        recipientRole: 'RECEPTIONIST',
                        patientId: patient.patientId,
                        type: 'FOLLOW_UP',
                        title: `New Patient Request: ${patient.name}`,
                        message: `Patient ${patient.name} (${patient.patientId}) requested Dr. ${doctor.name} at ${hospName}. Action required.`,
                        metadata: { consultationRequestId: newRequest.id, requestId: reqNumber },
                        readStatus: false,
                        deliveryStatus: 'DELIVERED',
                        createdAt: now
                    });
                }
            }
            res.status(201).json({
                success: true,
                data: {
                    request: newRequest,
                    message: 'Consultation request submitted. Hospital receptionist or doctor can approve your request.'
                }
            });
        }
        catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    },
    // Patient views their own consultation requests
    getPatientConsultations: async (req, res) => {
        try {
            const patientId = req.params.patientId || req.user?.patientId;
            const requests = db_1.db.consultationRequests.find(r => r.patientId === patientId)
                .sort((a, b) => b.requestedAt.localeCompare(a.requestedAt));
            res.json({ success: true, data: { requests } });
        }
        catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    },
    // Patient views ONLY connected doctors (strict privacy boundary)
    getMyDoctors: async (req, res) => {
        try {
            const patientId = req.params.patientId || req.user?.patientId;
            const patient = db_1.db.patients.findOne(p => p.patientId === patientId);
            if (!patient) {
                res.status(404).json({ success: false, message: `Patient ${patientId} not found.` });
                return;
            }
            const connectedDoctorIds = patient.doctorIds || [];
            const clinics = db_1.db.clinics.find();
            const prescriptions = db_1.db.prescriptions.find(p => p.patientId === patientId);
            // Fetch only doctors where relationship exists
            const doctors = db_1.db.doctors.find(d => connectedDoctorIds.includes(d.doctorId) || connectedDoctorIds.includes(d.id)).map(doc => {
                const clinic = clinics.find(c => c.id === doc.clinicId);
                const lastRx = prescriptions
                    .filter(p => p.doctorId === doc.doctorId || p.doctorId === doc.id)
                    .sort((a, b) => b.prescriptionDate.localeCompare(a.prescriptionDate))[0];
                return {
                    id: doc.id,
                    doctorId: doc.doctorId,
                    name: doc.name,
                    specialty: doc.specialty,
                    clinicName: clinic?.name || 'Apollo Medical Clinic',
                    location: clinic?.location || 'Central Facility',
                    phone: doc.phone,
                    email: doc.email,
                    status: 'Connected',
                    lastConsultationDate: lastRx ? lastRx.prescriptionDate : patient.registeredDate
                };
            });
            res.json({ success: true, data: { doctors } });
        }
        catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    },
    // Patient views ONLY connected clinics
    getMyClinics: async (req, res) => {
        try {
            const patientId = req.params.patientId || req.user?.patientId;
            const patient = db_1.db.patients.findOne(p => p.patientId === patientId);
            if (!patient) {
                res.status(404).json({ success: false, message: `Patient ${patientId} not found.` });
                return;
            }
            const connectedDoctorIds = patient.doctorIds || [];
            const connectedDoctors = db_1.db.doctors.find(d => connectedDoctorIds.includes(d.doctorId) || connectedDoctorIds.includes(d.id));
            const clinicIds = Array.from(new Set([
                ...(patient.clinicIds || []),
                patient.clinicId || '',
                ...connectedDoctors.map(d => d.clinicId)
            ])).filter(Boolean);
            const clinics = db_1.db.clinics.find(c => clinicIds.includes(c.id)).map(clinic => {
                const org = db_1.db.organizations.findById(clinic.organizationId);
                return {
                    ...clinic,
                    organizationName: org?.name || 'Connected Healthcare Network',
                    organizationType: org?.type || 'HOSPITAL'
                };
            });
            res.json({ success: true, data: { clinics } });
        }
        catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    },
    // Doctor views incoming consultation requests
    getDoctorRequests: async (req, res) => {
        try {
            const doctorId = req.user?.doctorId || 'DOC10001';
            const requests = db_1.db.consultationRequests.find(r => r.doctorId === doctorId).sort((a, b) => b.requestedAt.localeCompare(a.requestedAt));
            res.json({ success: true, data: { requests } });
        }
        catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    },
    // Doctor accepts or rejects Consultation Request
    respondToRequest: async (req, res) => {
        try {
            const { id } = req.params;
            const { response: action, notes } = req.body; // 'ACCEPTED' | 'REJECTED'
            if (!action || !['ACCEPTED', 'REJECTED'].includes(action)) {
                res.status(400).json({ success: false, message: 'Valid response (ACCEPTED or REJECTED) is required.' });
                return;
            }
            const consultationReq = db_1.db.consultationRequests.findById(id);
            if (!consultationReq) {
                res.status(404).json({ success: false, message: 'Consultation request not found.' });
                return;
            }
            const now = new Date().toISOString();
            const updatedReq = db_1.db.consultationRequests.update(id, {
                status: action,
                respondedAt: now,
                notes: notes || (action === 'ACCEPTED' ? 'Consultation accepted by doctor' : 'Doctor unavailable')
            });
            if (action === 'ACCEPTED') {
                // Form the active care relationship!
                const doctor = db_1.db.doctors.findOne(d => d.doctorId === consultationReq.doctorId || d.id === consultationReq.doctorId);
                const patient = db_1.db.patients.findOne(p => p.patientId === consultationReq.patientId);
                if (doctor && patient) {
                    // Add patient to doctor's authorized list
                    if (!doctor.authorizedPatientIds.includes(patient.patientId)) {
                        db_1.db.doctors.update(doctor.id, {
                            authorizedPatientIds: [...doctor.authorizedPatientIds, patient.patientId]
                        });
                    }
                    // Add doctor and clinic to patient's connected lists
                    const updatedDoctorIds = Array.from(new Set([...(patient.doctorIds || []), doctor.doctorId]));
                    const updatedClinicIds = Array.from(new Set([...(patient.clinicIds || []), doctor.clinicId]));
                    db_1.db.patients.update(patient.id, {
                        doctorIds: updatedDoctorIds,
                        clinicIds: updatedClinicIds
                    });
                    // Create active Consent record
                    const consentDoctor = {
                        id: `con-${(0, uuid_1.v4)().substring(0, 8)}`,
                        patientId: patient.patientId,
                        granteeId: doctor.userId,
                        granteeName: doctor.name,
                        granteeEmail: doctor.email,
                        granteeRole: 'DOCTOR',
                        accessScope: 'ALL',
                        status: 'ACTIVE',
                        grantedAt: now
                    };
                    db_1.db.consents.insert(consentDoctor);
                    // Create scheduled Consultation record
                    const consultationRecord = {
                        id: `cns-${(0, uuid_1.v4)().substring(0, 8)}`,
                        consultationRequestId: id,
                        patientId: patient.patientId,
                        doctorId: doctor.doctorId,
                        clinicId: doctor.clinicId,
                        consultationDate: now.split('T')[0],
                        status: 'SCHEDULED',
                        createdAt: now
                    };
                    db_1.db.consultations.insert(consultationRecord);
                }
                // Notify patient
                const patientUser = db_1.db.users.findOne(u => u.patientId === consultationReq.patientId);
                if (patientUser) {
                    db_1.db.notifications.insert({
                        id: `notif-c-acc-${(0, uuid_1.v4)().substring(0, 8)}`,
                        recipientId: patientUser.id,
                        recipientRole: 'PATIENT',
                        patientId: consultationReq.patientId,
                        type: 'FOLLOW_UP',
                        title: 'Consultation Request Accepted! 🎉',
                        message: `${consultationReq.doctorName} accepted your consultation request. You are now connected.`,
                        metadata: { consultationRequestId: id },
                        readStatus: false,
                        deliveryStatus: 'DELIVERED',
                        createdAt: now
                    });
                }
            }
            else {
                // REJECTED: Notify patient respectfully
                const patientUser = db_1.db.users.findOne(u => u.patientId === consultationReq.patientId);
                if (patientUser) {
                    db_1.db.notifications.insert({
                        id: `notif-c-rej-${(0, uuid_1.v4)().substring(0, 8)}`,
                        recipientId: patientUser.id,
                        recipientRole: 'PATIENT',
                        patientId: consultationReq.patientId,
                        type: 'FOLLOW_UP',
                        title: 'Consultation Request Update',
                        message: `${consultationReq.doctorName} is currently unavailable for consultations. Please find another clinician.`,
                        readStatus: false,
                        deliveryStatus: 'DELIVERED',
                        createdAt: now
                    });
                }
            }
            res.json({
                success: true,
                data: {
                    request: updatedReq,
                    message: action === 'ACCEPTED'
                        ? 'Consultation request accepted. Active patient-doctor care relationship created.'
                        : 'Consultation request rejected.'
                }
            });
        }
        catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }
};
