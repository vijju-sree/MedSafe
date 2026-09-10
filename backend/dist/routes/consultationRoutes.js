"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const consultationController_1 = require("../controllers/consultationController");
const auth_1 = require("../middleware/auth");
const rbac_1 = require("../middleware/rbac");
const audit_1 = require("../middleware/audit");
const router = (0, express_1.Router)();
// Public doctor discovery search does not require auth
router.get('/search-doctors', consultationController_1.consultationController.searchDoctors);
router.use(auth_1.authMiddleware);
// Patient routes
router.post('/request', (0, rbac_1.requireRoles)('PATIENT', 'ADMIN'), (0, audit_1.logAudit)('CONSULTATION_REQUEST_SUBMITTED', 'ConsultationRequest'), consultationController_1.consultationController.requestConsultation);
router.get('/patient/:patientId', consultationController_1.consultationController.getPatientConsultations);
router.get('/patient/:patientId/my-doctors', consultationController_1.consultationController.getMyDoctors);
router.get('/patient/:patientId/my-clinics', consultationController_1.consultationController.getMyClinics);
// Doctor routes
router.get('/doctor/requests', (0, rbac_1.requireRoles)('DOCTOR', 'ADMIN'), consultationController_1.consultationController.getDoctorRequests);
router.put('/:id/respond', (0, rbac_1.requireRoles)('DOCTOR', 'ADMIN'), (0, audit_1.logAudit)('CONSULTATION_REQUEST_RESPONDED', 'ConsultationRequest'), consultationController_1.consultationController.respondToRequest);
exports.default = router;
