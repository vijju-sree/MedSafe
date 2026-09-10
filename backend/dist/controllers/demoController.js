"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.demoController = void 0;
const uuid_1 = require("uuid");
const db_1 = require("../database/db");
const reminderTicker_1 = require("../services/reminderTicker");
const seedData_1 = require("../database/seedData");
exports.demoController = {
    triggerTestReminder: async (req, res) => {
        try {
            const patientId = req.body.patientId || req.user?.patientId || 'PAT10001';
            const medicationId = req.body.medicationId;
            const schedule = reminderTicker_1.reminderTicker.triggerTestReminder(patientId, medicationId);
            res.json({
                success: true,
                data: {
                    schedule,
                    message: `[DEMO / TEST MODE] Immediate reminder created for ${schedule.medicationName}. Status is UPCOMING.`
                }
            });
        }
        catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    },
    simulateMissedDose: async (req, res) => {
        try {
            const patientId = req.body.patientId || req.user?.patientId || 'PAT10001';
            const now = new Date();
            const todayStr = now.toISOString().split('T')[0];
            // Find an upcoming schedule or create one for test
            let schedule = db_1.db.medicationSchedules.findOne(s => s.patientId === patientId && s.scheduledDate === todayStr && s.status === 'UPCOMING');
            if (!schedule) {
                schedule = reminderTicker_1.reminderTicker.triggerTestReminder(patientId);
            }
            // Mark it as missed
            const updated = db_1.db.medicationSchedules.update(schedule.id, {
                status: 'MISSED',
                notes: '[DEMO / TEST MODE] Simulated missed dose event.'
            });
            // Insert adherence record
            db_1.db.adherenceRecords.insert({
                id: `adh-demo-miss-${(0, uuid_1.v4)().substring(0, 8)}`,
                patientId,
                medicationId: schedule.medicationId,
                scheduleId: schedule.id,
                medicationName: schedule.medicationName,
                scheduledTime: schedule.scheduledTime,
                status: 'MISSED',
                notes: '[DEMO / TEST MODE] Simulated missed dose.',
                recordedAt: now.toISOString()
            });
            // Notification
            const patient = db_1.db.patients.findOne(p => p.patientId === patientId);
            const user = patient ? db_1.db.users.findOne(u => u.patientId === patient.patientId) : undefined;
            if (user) {
                db_1.db.notifications.insert({
                    id: `notif-demo-miss-${(0, uuid_1.v4)().substring(0, 8)}`,
                    recipientId: user.id,
                    recipientRole: 'PATIENT',
                    patientId,
                    type: 'DOSE_MISSED',
                    title: `[DEMO / TEST] Dose Missed: ${schedule.medicationName}`,
                    message: `Dose not recorded. Follow your prescribed medication instructions or contact your healthcare professional if you are unsure what to do.`,
                    readStatus: false,
                    deliveryStatus: 'DELIVERED',
                    createdAt: now.toISOString()
                });
            }
            res.json({
                success: true,
                data: {
                    schedule: updated,
                    message: '[DEMO / TEST MODE] Scheduled dose successfully transitioned to MISSED.'
                }
            });
        }
        catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    },
    simulateSafetyConflict: async (req, res) => {
        try {
            const patientId = req.body.patientId || req.user?.patientId || 'PAT10001';
            const alert = {
                id: `alert-demo-${(0, uuid_1.v4)().substring(0, 8)}`,
                patientId,
                alertType: 'DRUG_CONFLICT',
                severity: 'CRITICAL',
                title: '[DEMO / TEST] Drug Interaction Signal: Atorvastatin & Clarithromycin',
                description: 'Simulated safety signal: Clarithromycin strongly inhibits CYP3A4, dramatically increasing Atorvastatin blood plasma concentration and risk of myopathy/rhabdomyolysis.',
                recommendation: 'Possible concern detected — professional review recommended. Please verify concurrent therapy with prescribing physician.',
                disclaimer: 'This is a safety-support signal, not a medical diagnosis. Please consult your doctor/pharmacist before making medication changes.',
                acknowledged: false,
                createdAt: new Date().toISOString()
            };
            db_1.db.safetyAlerts.insert(alert);
            res.json({
                success: true,
                data: { alert, message: '[DEMO / TEST MODE] Safety conflict signal generated.' }
            });
        }
        catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    },
    resetDatabase: async (req, res) => {
        try {
            await (0, seedData_1.seedDatabase)(true);
            res.json({
                success: true,
                message: '[DEMO / TEST MODE] Database successfully re-seeded to initial state.'
            });
        }
        catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }
};
