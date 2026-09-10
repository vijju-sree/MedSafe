"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const receptionistController_1 = require("../controllers/receptionistController");
const auth_1 = require("../middleware/auth");
const rbac_1 = require("../middleware/rbac");
const audit_1 = require("../middleware/audit");
const router = (0, express_1.Router)();
router.use(auth_1.authMiddleware);
// Only Receptionists and Admins can access hospital reception endpoints
router.use((0, rbac_1.requireRoles)('RECEPTIONIST', 'ADMIN'));
// Dashboard overview
router.get('/dashboard', receptionistController_1.receptionistController.getDashboard);
// Patient connection requests queue
router.get('/requests', receptionistController_1.receptionistController.getRequests);
router.put('/requests/:id/respond', (0, audit_1.logAudit)('RECEPTIONIST_REQUEST_RESPONDED', 'ConsultationRequest'), receptionistController_1.receptionistController.respondToRequest);
// Hospital Patients Directory
router.get('/patients', receptionistController_1.receptionistController.getHospitalPatients);
router.get('/patients/search-global', receptionistController_1.receptionistController.searchGlobalPatient);
router.post('/patients/link', (0, audit_1.logAudit)('RECEPTIONIST_PATIENT_LINKED', 'PatientHospitalRelationship'), receptionistController_1.receptionistController.linkPatient);
router.get('/patients/:patientId', receptionistController_1.receptionistController.getPatientDetail);
// Reports for Hospital Patients (Read-Only)
router.get('/reports', receptionistController_1.receptionistController.getHospitalReports);
router.get('/reports/:id', (0, audit_1.logAudit)('REPORT_VIEWED_RECEPTIONIST', 'MedicalReport'), receptionistController_1.receptionistController.getHospitalReportDetail);
// Hospital Doctors
router.get('/doctors', receptionistController_1.receptionistController.getHospitalDoctors);
exports.default = router;
