"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.prescriptionController = void 0;
const uuid_1 = require("uuid");
const db_1 = require("../database/db");
exports.prescriptionController = {
    getPrescriptions: async (req, res) => {
        try {
            const patientId = req.params.patientId || req.query.patientId;
            if (!patientId) {
                res.status(400).json({ success: false, message: 'Patient ID is required.' });
                return;
            }
            const prescriptions = db_1.db.prescriptions.find(p => p.patientId === patientId);
            res.json({ success: true, data: { prescriptions } });
        }
        catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    },
    createPrescription: async (req, res) => {
        try {
            const { patientId, doctorId, doctorName, clinicName, prescriptionDate, validFrom, validUntil, notes, medicationIds, medications } = req.body;
            if (!patientId || !validFrom || !validUntil) {
                res.status(400).json({ success: false, message: 'patientId, validFrom, and validUntil are required.' });
                return;
            }
            const now = new Date();
            const todayStr = now.toISOString().split('T')[0];
            const rxIdNum = Math.floor(10000 + Math.random() * 90000);
            const prescriptionId = `RX${rxIdNum}`;
            const docId = doctorId || req.user?.doctorId || 'DOC10001';
            const docName = doctorName || req.user?.name || 'Dr. Ravi Kumar, MD';
            const finalMedicationIds = Array.isArray(medicationIds) ? [...medicationIds] : [];
            // If full medication objects were passed, instantiate them into db.medications
            if (Array.isArray(medications) && medications.length > 0) {
                for (const m of medications) {
                    const medId = `med-${(0, uuid_1.v4)().substring(0, 8)}`;
                    const times = Array.isArray(m.scheduleTimes) && m.scheduleTimes.length > 0 ? m.scheduleTimes : ['08:00 AM'];
                    const newMed = {
                        id: medId,
                        patientId,
                        prescriptionId,
                        doctorId: docId,
                        doctorName: docName,
                        name: m.name,
                        genericName: m.genericName || m.name,
                        strength: m.strength || '500 mg',
                        dosageAmount: String(m.dosageAmount || '1'),
                        dosageUnit: m.dosageUnit || 'tablet',
                        form: m.form || 'Tablet',
                        route: m.route || 'Oral',
                        frequency: m.frequency || 'DAILY',
                        scheduleTimes: times,
                        startDate: m.startDate || todayStr,
                        endDate: m.endDate || validUntil,
                        instructions: m.instructions || 'Take as prescribed by doctor',
                        foodInstruction: m.foodInstruction || 'AFTER_FOOD',
                        prescriptionStatus: 'ACTIVE',
                        refillDate: m.refillDate || validUntil,
                        refillRemaining: m.refillRemaining !== undefined ? m.refillRemaining : 1,
                        totalQuantity: m.totalQuantity ? parseInt(String(m.totalQuantity), 10) : 30,
                        version: 1,
                        active: true,
                        createdAt: now.toISOString(),
                        updatedAt: now.toISOString()
                    };
                    db_1.db.medications.insert(newMed);
                    finalMedicationIds.push(medId);
                    // Generate schedules
                    const schedulesToInsert = [];
                    for (let dayOffset = 0; dayOffset < 7; dayOffset++) {
                        const targetDate = new Date(now);
                        targetDate.setDate(targetDate.getDate() + dayOffset);
                        const dateStr = targetDate.toISOString().split('T')[0];
                        for (const time of newMed.scheduleTimes) {
                            const hour = parseInt(time.split(':')[0], 10) || 8;
                            let tod = 'MORNING';
                            if (hour >= 12 && hour < 17)
                                tod = 'AFTERNOON';
                            else if (hour >= 17 && hour < 20)
                                tod = 'EVENING';
                            else if (hour >= 20 || hour < 5)
                                tod = 'NIGHT';
                            schedulesToInsert.push({
                                id: `sch-${(0, uuid_1.v4)().substring(0, 8)}`,
                                patientId,
                                medicationId: newMed.id,
                                prescriptionId: newMed.prescriptionId,
                                medicationName: `${newMed.name} ${newMed.strength}`,
                                dosage: `${newMed.dosageAmount} ${newMed.dosageUnit}`,
                                instructions: newMed.instructions,
                                foodInstruction: newMed.foodInstruction,
                                scheduledDate: dateStr,
                                scheduledTime: time,
                                timeOfDay: tod,
                                status: 'UPCOMING',
                                graceMinutes: 60,
                                reminderSent: false,
                                createdAt: now.toISOString()
                            });
                        }
                    }
                    db_1.db.medicationSchedules.insertMany(schedulesToInsert);
                    // Create supply
                    const daily = times.length;
                    const initQty = newMed.totalQuantity || 30;
                    const daysRemaining = Math.floor(initQty / Math.max(1, daily));
                    const depletionDate = new Date(now);
                    depletionDate.setDate(depletionDate.getDate() + daysRemaining);
                    db_1.db.medicationSupplies.insert({
                        id: `sup-${(0, uuid_1.v4)().substring(0, 8)}`,
                        patientId,
                        medicationId: newMed.id,
                        medicationName: `${newMed.name} ${newMed.strength}`,
                        prescriptionId,
                        prescribingDoctorId: docId,
                        prescribingDoctorName: docName,
                        initialQuantity: initQty,
                        quantityDispensed: initQty,
                        quantityRemaining: initQty,
                        dailyUsage: daily,
                        dispensedDate: todayStr,
                        expectedDepletionDate: depletionDate.toISOString().split('T')[0],
                        refillThresholdDays: 7,
                        refillDate: depletionDate.toISOString().split('T')[0],
                        refillStatus: 'NOT_DUE',
                        notes: `Dispensed: ${initQty} units (~${daysRemaining} days)`,
                        createdAt: now.toISOString(),
                        updatedAt: now.toISOString()
                    });
                }
            }
            const newRx = {
                id: `rx-${(0, uuid_1.v4)().substring(0, 8)}`,
                prescriptionId,
                patientId,
                doctorId: docId,
                doctorName: docName,
                clinicName: clinicName || 'Apollo Internal Medicine Wing',
                prescriptionDate: prescriptionDate || todayStr,
                validFrom,
                validUntil,
                status: 'ACTIVE',
                notes: notes || 'Prescription issued following clinical consultation.',
                medicationIds: finalMedicationIds,
                createdAt: now.toISOString()
            };
            db_1.db.prescriptions.insert(newRx);
            // Notify patient
            const patient = db_1.db.patients.findOne(p => p.patientId === patientId);
            const user = patient ? db_1.db.users.findOne(u => u.patientId === patient.patientId) : undefined;
            if (user) {
                db_1.db.notifications.insert({
                    id: `notif-rx-${(0, uuid_1.v4)().substring(0, 8)}`,
                    recipientId: user.id,
                    recipientRole: 'PATIENT',
                    patientId,
                    type: 'NEW_PRESCRIPTION',
                    title: `New Prescription #${newRx.prescriptionId}`,
                    message: `Dr. ${newRx.doctorName} issued Prescription #${newRx.prescriptionId} containing ${finalMedicationIds.length} medication(s).`,
                    category: 'USER',
                    metadata: { prescriptionId: newRx.prescriptionId },
                    readStatus: false,
                    isRead: false,
                    deliveryStatus: 'DELIVERED',
                    createdAt: now.toISOString()
                });
            }
            res.status(201).json({
                success: true,
                data: { prescription: newRx, message: 'Prescription created successfully.' }
            });
        }
        catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    },
    renewPrescription: async (req, res) => {
        try {
            const { id } = req.params;
            const { additionalDays, notes } = req.body;
            const rx = db_1.db.prescriptions.findById(id);
            if (!rx) {
                res.status(404).json({ success: false, message: 'Prescription not found.' });
                return;
            }
            const currentUntil = new Date(rx.validUntil);
            const days = additionalDays ? parseInt(String(additionalDays), 10) : 30;
            currentUntil.setDate(currentUntil.getDate() + days);
            const updated = db_1.db.prescriptions.update(id, {
                validUntil: currentUntil.toISOString().split('T')[0],
                status: 'ACTIVE',
                notes: `${rx.notes || ''} [Renewed +${days} days by ${req.user?.name}: ${notes || 'Prescription extension authorized'}]`.trim()
            });
            res.json({
                success: true,
                data: { prescription: updated, message: `Prescription renewed for ${days} additional days.` }
            });
        }
        catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }
};
