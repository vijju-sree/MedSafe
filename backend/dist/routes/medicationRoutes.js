"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const medicationController_1 = require("../controllers/medicationController");
const auth_1 = require("../middleware/auth");
const rbac_1 = require("../middleware/rbac");
const audit_1 = require("../middleware/audit");
const router = (0, express_1.Router)();
router.use(auth_1.authMiddleware);
router.get('/', medicationController_1.medicationController.getMedications);
router.get('/patient/:patientId', medicationController_1.medicationController.getMedications);
router.get('/:id', medicationController_1.medicationController.getMedicationById);
// Doctors and Admins can add or modify medications
router.post('/', (0, rbac_1.requireRoles)('DOCTOR', 'ADMIN'), (0, audit_1.logAudit)('MEDICATION_CREATED', 'Medication'), medicationController_1.medicationController.addMedication);
router.put('/:id', (0, rbac_1.requireRoles)('DOCTOR', 'ADMIN'), (0, audit_1.logAudit)('MEDICATION_PLAN_UPDATED', 'Medication'), medicationController_1.medicationController.updateMedicationPlan);
router.post('/:id/discontinue', (0, rbac_1.requireRoles)('DOCTOR', 'ADMIN'), (0, audit_1.logAudit)('MEDICATION_DISCONTINUED', 'Medication'), medicationController_1.medicationController.discontinueMedication);
exports.default = router;
