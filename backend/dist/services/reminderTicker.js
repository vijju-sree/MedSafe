"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.reminderTicker = exports.ReminderTicker = void 0;
const uuid_1 = require("uuid");
const db_1 = require("../database/db");
const config_1 = require("../config");
const emailService_1 = require("./emailService");
class ReminderTicker {
    timer = null;
    start() {
        console.log(`Starting MedSafe Reminder Ticker (interval: ${config_1.config.reminderCheckIntervalSeconds}s, grace: ${config_1.config.gracePeriodMinutes}m)...`);
        this.checkSchedules();
        this.timer = setInterval(() => {
            this.checkSchedules();
        }, config_1.config.reminderCheckIntervalSeconds * 1000);
    }
    stop() {
        if (this.timer) {
            clearInterval(this.timer);
            this.timer = null;
        }
    }
    /**
     * Main evaluation loop.
     */
    checkSchedules() {
        const now = new Date();
        const todayStr = now.toISOString().split('T')[0];
        const currentHours = now.getHours();
        const currentMinutes = now.getMinutes();
        const currentTotalMinutes = currentHours * 60 + currentMinutes;
        const schedulesToday = db_1.db.medicationSchedules.find(s => s.scheduledDate === todayStr && s.status === 'UPCOMING');
        for (const schedule of schedulesToday) {
            const [schHour, schMin] = schedule.scheduledTime.split(':').map(Number);
            const scheduledTotalMinutes = schHour * 60 + schMin;
            const diffMinutes = currentTotalMinutes - scheduledTotalMinutes;
            // 1. Send Reminder if scheduled time has arrived or is within 10 minutes
            if (diffMinutes >= 0 && !schedule.reminderSent) {
                db_1.db.medicationSchedules.update(schedule.id, { reminderSent: true });
                const patient = db_1.db.patients.findOne(p => p.patientId === schedule.patientId);
                const user = patient ? db_1.db.users.findOne(u => u.patientId === patient.patientId) : undefined;
                if (user) {
                    // Deduplication: strictly check if a reminder notification already exists for this schedule
                    const existingNotif = db_1.db.notifications.findOne(n => n.type === 'MEDICATION_REMINDER' && n.metadata?.scheduleId === schedule.id);
                    if (!existingNotif) {
                        const notif = {
                            id: `notif-rem-${(0, uuid_1.v4)().substring(0, 8)}`,
                            recipientId: user.id,
                            recipientRole: 'PATIENT',
                            patientId: schedule.patientId,
                            type: 'MEDICATION_REMINDER',
                            title: `Medication Reminder: ${schedule.medicationName}`,
                            message: `Your scheduled dose of ${schedule.medicationName} (${schedule.dosage}) is due now (${schedule.scheduledTime}). Instructions: ${schedule.instructions || 'Follow prescription'}.`,
                            category: 'USER',
                            metadata: { scheduleId: schedule.id, medicationId: schedule.medicationId },
                            readStatus: false,
                            isRead: false,
                            scheduledAt: `${schedule.scheduledDate}T${schedule.scheduledTime}:00`,
                            deliveryStatus: 'DELIVERED',
                            createdAt: now.toISOString()
                        };
                        db_1.db.notifications.insert(notif);
                        // Attempt mock/SMTP email reminder
                        emailService_1.emailService.sendMedicationReminder(user.email, patient?.name || 'Patient', schedule.medicationName, schedule.scheduledTime, schedule.instructions).catch(e => console.error('Reminder email failed:', e));
                    }
                }
            }
            // 2. Mark Dose as Missed if current time exceeds grace period (30 min)
            if (diffMinutes > schedule.graceMinutes) {
                console.log(`[Auto-Missed] Dose ${schedule.medicationName} at ${schedule.scheduledTime} exceeded grace window (${diffMinutes}m > ${schedule.graceMinutes}m). Marking MISSED.`);
                db_1.db.medicationSchedules.update(schedule.id, { status: 'MISSED' });
                // Record Adherence
                db_1.db.adherenceRecords.insert({
                    id: `adh-miss-${(0, uuid_1.v4)().substring(0, 8)}`,
                    patientId: schedule.patientId,
                    medicationId: schedule.medicationId,
                    scheduleId: schedule.id,
                    medicationName: schedule.medicationName,
                    scheduledTime: schedule.scheduledTime,
                    status: 'MISSED',
                    notes: 'Automatic transition: Dose not recorded within grace window.',
                    recordedAt: now.toISOString()
                });
                // Patient Notification
                const patient = db_1.db.patients.findOne(p => p.patientId === schedule.patientId);
                const user = patient ? db_1.db.users.findOne(u => u.patientId === patient.patientId) : undefined;
                if (user) {
                    db_1.db.notifications.insert({
                        id: `notif-miss-${(0, uuid_1.v4)().substring(0, 8)}`,
                        recipientId: user.id,
                        recipientRole: 'PATIENT',
                        patientId: schedule.patientId,
                        type: 'DOSE_MISSED',
                        title: `Dose Missed: ${schedule.medicationName}`,
                        message: `Dose not recorded for ${schedule.medicationName} scheduled at ${schedule.scheduledTime}. Follow your prescribed medication instructions or contact your healthcare professional if you are unsure what to do. Do NOT take a double dose.`,
                        category: 'USER',
                        readStatus: false,
                        isRead: false,
                        deliveryStatus: 'DELIVERED',
                        createdAt: now.toISOString()
                    });
                }
                // Caregiver Notification (if authorized via active consent)
                const activeConsents = db_1.db.consents.find(c => c.patientId === schedule.patientId && c.granteeRole === 'CAREGIVER' && c.status === 'ACTIVE');
                for (const consent of activeConsents) {
                    db_1.db.notifications.insert({
                        id: `notif-cg-miss-${(0, uuid_1.v4)().substring(0, 8)}`,
                        recipientId: consent.granteeId,
                        recipientRole: 'CAREGIVER',
                        patientId: schedule.patientId,
                        type: 'CAREGIVER_ALERT',
                        title: `Caregiver Alert: Missed Dose for ${patient?.name || 'Patient'}`,
                        message: `A dose of ${schedule.medicationName} scheduled for ${schedule.scheduledTime} was not recorded within the grace period.`,
                        category: 'USER',
                        readStatus: false,
                        isRead: false,
                        deliveryStatus: 'DELIVERED',
                        createdAt: now.toISOString()
                    });
                    emailService_1.emailService.sendMissedDoseAlert(consent.granteeEmail, consent.granteeName, patient?.name || 'Patient', schedule.medicationName, schedule.scheduledTime).catch(e => console.error('Caregiver email failed:', e));
                }
                // Evaluate if follow-up is warranted
                const recentMissed = db_1.db.adherenceRecords.find(r => r.patientId === schedule.patientId && r.status === 'MISSED');
                if (recentMissed.length >= 3) {
                    const existingFollowUp = db_1.db.followUpActions.findOne(f => f.patientId === schedule.patientId && f.status === 'PENDING' && f.reason.includes('missed'));
                    if (!existingFollowUp) {
                        db_1.db.followUpActions.insert({
                            id: `flw-auto-${(0, uuid_1.v4)().substring(0, 8)}`,
                            patientId: schedule.patientId,
                            medicationId: schedule.medicationId,
                            medicationName: schedule.medicationName,
                            reason: `${recentMissed.length} doses missed. Adherence trend requires attention.`,
                            actionRequired: 'Review with healthcare professional to explore dosing or timing adjustments.',
                            status: 'PENDING',
                            recommendedForRole: 'DOCTOR',
                            createdAt: now.toISOString()
                        });
                    }
                }
            }
        }
    }
    /**
     * Helper to manually trigger an immediate test reminder for a specific medication.
     */
    triggerTestReminder(patientId, medicationId) {
        const now = new Date();
        const todayStr = now.toISOString().split('T')[0];
        const hours = String(now.getHours()).padStart(2, '0');
        const minutes = String(now.getMinutes()).padStart(2, '0');
        let med = medicationId ? db_1.db.medications.findById(medicationId) : undefined;
        if (!med) {
            med = db_1.db.medications.findOne(m => m.patientId === patientId && m.active) || {
                id: 'med-test',
                patientId,
                prescriptionId: 'RX10001',
                doctorId: 'DOC10001',
                name: 'Paracetamol 500 mg',
                genericName: 'Paracetamol',
                strength: '500 mg',
                dosageAmount: '1',
                dosageUnit: 'tablet',
                form: 'Tablet',
                route: 'Oral',
                frequency: 'DAILY',
                scheduleTimes: [`${hours}:${minutes}`],
                startDate: todayStr,
                endDate: todayStr,
                instructions: 'Take with plenty of water after food',
                foodInstruction: 'AFTER_FOOD',
                prescriptionStatus: 'ACTIVE',
                refillRemaining: 2,
                totalQuantity: 30,
                version: 1,
                active: true,
                createdAt: now.toISOString(),
                updatedAt: now.toISOString()
            };
        }
        const testSchedule = {
            id: `sch-test-${(0, uuid_1.v4)().substring(0, 8)}`,
            patientId,
            medicationId: med.id,
            prescriptionId: med.prescriptionId || 'RX-DEMO',
            medicationName: `${med.name} ${med.strength || ''}`.trim(),
            dosage: `${med.dosageAmount} ${med.dosageUnit}`,
            instructions: med.instructions || 'Take as prescribed',
            foodInstruction: med.foodInstruction || 'AFTER_FOOD',
            scheduledDate: todayStr,
            scheduledTime: `${hours}:${minutes}`,
            timeOfDay: 'AFTERNOON',
            status: 'UPCOMING',
            graceMinutes: config_1.config.gracePeriodMinutes,
            reminderSent: true,
            notes: '[DEMO / TEST TRIGGERED]',
            createdAt: now.toISOString()
        };
        db_1.db.medicationSchedules.insert(testSchedule);
        // Create immediate notification
        const patient = db_1.db.patients.findOne(p => p.patientId === patientId);
        const user = patient ? db_1.db.users.findOne(u => u.patientId === patient.patientId) : undefined;
        if (user) {
            db_1.db.notifications.insert({
                id: `notif-test-${(0, uuid_1.v4)().substring(0, 8)}`,
                recipientId: user.id,
                recipientRole: 'PATIENT',
                patientId,
                type: 'MEDICATION_REMINDER',
                title: `🔔 [TEST MODE] Medication Reminder: ${testSchedule.medicationName}`,
                message: `Your medication time has arrived for ${testSchedule.medicationName}. Scheduled for ${testSchedule.scheduledTime}.`,
                category: 'USER',
                metadata: { scheduleId: testSchedule.id, isDemo: true },
                readStatus: false,
                isRead: false,
                deliveryStatus: 'DELIVERED',
                createdAt: now.toISOString()
            });
        }
        return testSchedule;
    }
}
exports.ReminderTicker = ReminderTicker;
exports.reminderTicker = new ReminderTicker();
