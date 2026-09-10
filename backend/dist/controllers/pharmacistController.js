"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.pharmacistController = void 0;
const uuid_1 = require("uuid");
const db_1 = require("../database/db");
const safetyService_1 = require("../services/safetyService");
exports.pharmacistController = {
    getRefillQueue: async (req, res) => {
        try {
            const expiringPrescriptions = db_1.db.prescriptions.find(p => p.status === 'ACTIVE' || p.status === 'EXPIRING');
            const queue = expiringPrescriptions.map(rx => {
                const patient = db_1.db.patients.findOne(p => p.patientId === rx.patientId);
                const medications = db_1.db.medications.find(m => rx.medicationIds.includes(m.id));
                const safetyAlerts = safetyService_1.safetyService.evaluateAll(rx.patientId);
                return {
                    prescription: rx,
                    patient,
                    medications,
                    safetyAlertsCount: safetyAlerts.length,
                    safetyAlerts
                };
            });
            res.json({ success: true, data: { queue } });
        }
        catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    },
    recordRefill: async (req, res) => {
        try {
            const { medicationId, quantity, notes } = req.body;
            if (!medicationId) {
                res.status(400).json({ success: false, message: 'Medication ID is required.' });
                return;
            }
            const med = db_1.db.medications.findById(medicationId);
            if (!med) {
                res.status(404).json({ success: false, message: 'Medication not found.' });
                return;
            }
            const addedQty = quantity ? parseInt(String(quantity), 10) : 30;
            const nextRefill = new Date();
            nextRefill.setDate(nextRefill.getDate() + 30);
            const updated = db_1.db.medications.update(medicationId, {
                totalQuantity: (med.totalQuantity || 0) + addedQty,
                refillDate: nextRefill.toISOString().split('T')[0],
                prescriptionStatus: 'ACTIVE'
            });
            // Notify patient
            const patient = db_1.db.patients.findOne(p => p.patientId === med.patientId);
            const user = patient ? db_1.db.users.findOne(u => u.patientId === patient.patientId) : undefined;
            if (user) {
                db_1.db.notifications.insert({
                    id: `notif-refill-done-${(0, uuid_1.v4)().substring(0, 8)}`,
                    recipientId: user.id,
                    recipientRole: 'PATIENT',
                    patientId: med.patientId,
                    type: 'REFILL_REMINDER',
                    title: `Refill Dispensed: ${med.name}`,
                    message: `${addedQty} units of ${med.name} dispensed by Pharmacist ${req.user?.name || 'Suresh Reddy'}. Next refill scheduled on ${nextRefill.toISOString().split('T')[0]}.`,
                    metadata: { medicationId, dispensedQuantity: addedQty },
                    readStatus: false,
                    deliveryStatus: 'DELIVERED',
                    createdAt: new Date().toISOString()
                });
            }
            res.json({
                success: true,
                data: {
                    medication: updated,
                    message: `Refill recorded. ${addedQty} units added to patient's active supply.`
                }
            });
        }
        catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    },
    addReviewNotes: async (req, res) => {
        try {
            const { prescriptionId, patientId, notes } = req.body;
            if (!notes) {
                res.status(400).json({ success: false, message: 'Review notes are required.' });
                return;
            }
            // Add as follow up action or prescription review note
            const followUp = {
                id: `flw-pha-${(0, uuid_1.v4)().substring(0, 8)}`,
                patientId: patientId || 'PAT10001',
                reason: 'Pharmacist Professional Medication Review Note',
                actionRequired: notes,
                status: 'PENDING',
                recommendedForRole: 'DOCTOR',
                notes: `Logged by Pharmacist ${req.user?.name} (RPh)`,
                createdAt: new Date().toISOString()
            };
            db_1.db.followUpActions.insert(followUp);
            res.json({
                success: true,
                data: { followUp, message: 'Pharmacist review notes recorded in clinical audit record.' }
            });
        }
        catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }
};
