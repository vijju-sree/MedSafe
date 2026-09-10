"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.doctorController = void 0;
const uuid_1 = require("uuid");
const db_1 = require("../database/db");
const safetyService_1 = require("../services/safetyService");
const adherenceService_1 = require("../services/adherenceService");
exports.doctorController = {
    getPatients: async (req, res) => {
        try {
            const doctorId = req.user?.doctorId || 'DOC10001';
            const doctor = db_1.db.doctors.findOne(d => d.doctorId === doctorId || d.userId === req.user?.id);
            const authorizedIds = doctor?.authorizedPatientIds || [];
            const patients = db_1.db.patients.find(p => p.doctorIds?.includes(doctor?.doctorId || doctorId) ||
                authorizedIds.includes(p.patientId));
            res.json({ success: true, data: { patients } });
        }
        catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    },
    searchPatients: async (req, res) => {
        try {
            const doctorId = req.user?.doctorId || 'DOC10001';
            const doctor = db_1.db.doctors.findOne(d => d.doctorId === doctorId || d.userId === req.user?.id);
            const authorizedIds = doctor?.authorizedPatientIds || [];
            // Filter only within authorized patients
            const myPatients = db_1.db.patients.find(p => p.doctorIds?.includes(doctor?.doctorId || doctorId) ||
                authorizedIds.includes(p.patientId));
            const query = (req.query.q || '').trim().toLowerCase();
            if (!query) {
                res.json({ success: true, data: { patients: myPatients } });
                return;
            }
            const filtered = myPatients.filter(p => p.patientId.toLowerCase().includes(query) ||
                p.name.toLowerCase().includes(query) ||
                p.phone.includes(query) ||
                p.email.toLowerCase().includes(query));
            res.json({ success: true, data: { patients: filtered } });
        }
        catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    },
    getPatientDetail: async (req, res) => {
        try {
            const { patientId } = req.params;
            const patient = db_1.db.patients.findOne(p => p.patientId === patientId);
            if (!patient) {
                res.status(404).json({ success: false, message: `Patient ${patientId} not found.` });
                return;
            }
            const medications = db_1.db.medications.find(m => m.patientId === patientId);
            const prescriptions = db_1.db.prescriptions.find(p => p.patientId === patientId);
            const planHistory = db_1.db.medicationPlanHistory.find(h => h.patientId === patientId);
            const safetyAlerts = safetyService_1.safetyService.evaluateAll(patientId);
            const analytics = adherenceService_1.adherenceService.getPatientAnalytics(patientId);
            const followUps = db_1.db.followUpActions.find(f => f.patientId === patientId);
            res.json({
                success: true,
                data: {
                    patient,
                    medications,
                    prescriptions,
                    planHistory,
                    safetyAlerts,
                    analytics,
                    followUps
                }
            });
        }
        catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    },
    addFollowUp: async (req, res) => {
        try {
            const { patientId, medicationId, medicationName, reason, actionRequired, notes } = req.body;
            if (!patientId || !actionRequired) {
                res.status(400).json({ success: false, message: 'patientId and actionRequired are mandatory.' });
                return;
            }
            const newFollowUp = {
                id: `flw-${(0, uuid_1.v4)().substring(0, 8)}`,
                patientId,
                medicationId,
                medicationName,
                reason: reason || 'Clinical review follow-up note',
                actionRequired,
                status: 'PENDING',
                recommendedForRole: 'PATIENT',
                notes,
                createdAt: new Date().toISOString()
            };
            db_1.db.followUpActions.insert(newFollowUp);
            // Notify patient
            const patient = db_1.db.patients.findOne(p => p.patientId === patientId);
            const user = patient ? db_1.db.users.findOne(u => u.patientId === patient.patientId) : undefined;
            if (user) {
                db_1.db.notifications.insert({
                    id: `notif-flw-${(0, uuid_1.v4)().substring(0, 8)}`,
                    recipientId: user.id,
                    recipientRole: 'PATIENT',
                    patientId,
                    type: 'FOLLOW_UP',
                    title: 'Clinical Follow-Up Recommendation',
                    message: `Dr. ${req.user?.name || 'Your Doctor'} added a follow-up action: ${actionRequired}.`,
                    readStatus: false,
                    deliveryStatus: 'DELIVERED',
                    createdAt: new Date().toISOString()
                });
            }
            res.status(201).json({ success: true, data: { followUp: newFollowUp } });
        }
        catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    },
    resolveFollowUp: async (req, res) => {
        try {
            const { id } = req.params;
            const updated = db_1.db.followUpActions.update(id, {
                status: 'RESOLVED',
                resolvedAt: new Date().toISOString(),
                resolvedBy: req.user?.name || 'Dr. Ravi Kumar'
            });
            res.json({ success: true, data: { followUp: updated, message: 'Follow-up resolved.' } });
        }
        catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }
};
