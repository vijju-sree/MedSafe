"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireRoles = requireRoles;
exports.authorizePatientAccess = authorizePatientAccess;
const db_1 = require("../database/db");
function requireRoles(...allowedRoles) {
    return (req, res, next) => {
        if (!req.user) {
            res.status(401).json({ success: false, message: 'Authentication required.' });
            return;
        }
        if (!allowedRoles.includes(req.user.role)) {
            res.status(403).json({
                success: false,
                message: `Forbidden: Role "${req.user.role}" does not have permission to perform this action.`
            });
            return;
        }
        next();
    };
}
/**
 * Ensures that the authenticated user has legitimate authorization to access the specific patient's information.
 */
function authorizePatientAccess(paramName = 'patientId') {
    return (req, res, next) => {
        if (!req.user) {
            res.status(401).json({ success: false, message: 'Authentication required.' });
            return;
        }
        const patientId = req.params[paramName] || req.query[paramName] || req.body[paramName];
        if (!patientId) {
            res.status(400).json({ success: false, message: `Missing patient identifier (${paramName}).` });
            return;
        }
        // 1. Admin always has oversight access
        if (req.user.role === 'ADMIN') {
            return next();
        }
        // 2. Patient can only access their own records
        if (req.user.role === 'PATIENT') {
            if (req.user.patientId === patientId) {
                return next();
            }
            res.status(403).json({
                success: false,
                message: 'Access Denied: You cannot view or modify other patients records.'
            });
            return;
        }
        // 3. Caregiver can only access patients with active consent
        if (req.user.role === 'CAREGIVER') {
            const caregiver = db_1.db.caregivers.findOne(c => c.userId === req.user?.id);
            const activeConsent = db_1.db.consents.findOne(c => c.patientId === patientId && c.granteeId === req.user?.id && c.status === 'ACTIVE');
            if (activeConsent || (caregiver && caregiver.authorizedPatientIds.includes(patientId))) {
                return next();
            }
            res.status(403).json({
                success: false,
                message: 'Access Denied: You are not authorized by this patient as an active caregiver.'
            });
            return;
        }
        // 4. Doctor can access patients who authorized them or who belong to their clinic
        if (req.user.role === 'DOCTOR') {
            const doctor = db_1.db.doctors.findOne(d => d.userId === req.user?.id);
            const activeConsent = db_1.db.consents.findOne(c => c.patientId === patientId && (c.granteeId === req.user?.id || c.granteeId === doctor?.id) && c.status === 'ACTIVE');
            if (activeConsent || (doctor && doctor.authorizedPatientIds.includes(patientId))) {
                return next();
            }
            // Or if the patient is in the same hospital/clinic
            const patient = db_1.db.patients.findOne(p => p.patientId === patientId);
            if (patient && (patient.organizationId === req.user.organizationId || patient.doctorIds?.includes(doctor?.id || ''))) {
                return next();
            }
            res.status(403).json({
                success: false,
                message: 'Access Denied: Doctor not authorized to access this patient profile.'
            });
            return;
        }
        // 5. Pharmacist can access patients within authorized clinic/pharmacy network
        if (req.user.role === 'PHARMACIST') {
            const pharmacist = db_1.db.pharmacists.findOne(p => p.userId === req.user?.id);
            if (pharmacist && (pharmacist.authorizedPatientIds.includes(patientId) || pharmacist.authorizedPatientIds.length === 0)) {
                return next();
            }
            res.status(403).json({
                success: false,
                message: 'Access Denied: Pharmacist not authorized for this patient profile.'
            });
            return;
        }
        res.status(403).json({ success: false, message: 'Access Denied: Unauthorized role or resource.' });
    };
}
