"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.refillController = void 0;
const uuid_1 = require("uuid");
const db_1 = require("../database/db");
exports.refillController = {
    getAllRefills: async (req, res) => {
        try {
            const { doctorId, patientId, status } = req.query;
            let refills = db_1.db.refillRequests.find();
            if (doctorId) {
                refills = refills.filter((r) => r.doctorId === doctorId);
            }
            if (patientId) {
                refills = refills.filter((r) => r.patientId === patientId);
            }
            if (status) {
                refills = refills.filter((r) => r.status === status);
            }
            refills.sort((a, b) => new Date(b.requestedDate).getTime() - new Date(a.requestedDate).getTime());
            res.json({ success: true, data: { refills } });
        }
        catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    },
    getRefillById: async (req, res) => {
        try {
            const { id } = req.params;
            const refill = db_1.db.refillRequests.findById(id) || db_1.db.refillRequests.findOne(r => r.refillRequestId === id);
            if (!refill) {
                res.status(404).json({ success: false, message: 'Refill request not found' });
                return;
            }
            res.json({ success: true, data: { refill } });
        }
        catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    },
    updateRefillStatus: async (req, res) => {
        try {
            const { id } = req.params;
            const { status, notes } = req.body;
            const refill = db_1.db.refillRequests.findById(id) || db_1.db.refillRequests.findOne(r => r.refillRequestId === id);
            if (!refill) {
                res.status(404).json({ success: false, message: 'Refill request not found' });
                return;
            }
            const now = new Date();
            const nowISO = now.toISOString();
            const updatedHistory = [
                ...(refill.statusHistory || []),
                {
                    status,
                    changedBy: req.user?.id || 'PROVIDER',
                    changedByRole: req.user?.role || 'DOCTOR',
                    timestamp: nowISO,
                    notes: notes || `Status updated to ${status}`
                }
            ];
            const updatedRefill = db_1.db.refillRequests.update(refill.id, {
                status,
                statusHistory: updatedHistory,
                updatedAt: nowISO
            });
            // If COMPLETED, automatically replenish the medication supply!
            if (status === 'COMPLETED') {
                const supply = db_1.db.medicationSupplies.findOne(s => s.medicationId === refill.medicationId && s.patientId === refill.patientId);
                if (supply) {
                    const replenishedQty = supply.initialQuantity || refill.quantityRequested || 30;
                    const daysRemaining = Math.floor(replenishedQty / Math.max(1, supply.dailyUsage));
                    const depletionDate = new Date(now);
                    depletionDate.setDate(depletionDate.getDate() + daysRemaining);
                    db_1.db.medicationSupplies.update(supply.id, {
                        quantityRemaining: replenishedQty,
                        quantityDispensed: replenishedQty,
                        refillStatus: 'REFILLED',
                        dispensedDate: nowISO.split('T')[0],
                        expectedDepletionDate: depletionDate.toISOString().split('T')[0],
                        refillDate: depletionDate.toISOString().split('T')[0],
                        notes: `Supply replenished (+${replenishedQty} units) upon Refill #${refill.refillRequestId} completion.`,
                        updatedAt: nowISO
                    });
                }
                // Also update medication remaining count
                const med = db_1.db.medications.findById(refill.medicationId);
                if (med) {
                    db_1.db.medications.update(med.id, {
                        refillRemaining: med.totalQuantity || refill.quantityRequested || 30,
                        updatedAt: nowISO
                    });
                }
                // Complete any pending FollowUpAction for this refill
                const followUps = db_1.db.followUpActions.find(f => f.patientId === refill.patientId && f.medicationId === refill.medicationId && f.type === 'REFILL_REQUIRED' && f.status === 'PENDING');
                for (const flw of followUps) {
                    db_1.db.followUpActions.update(flw.id, {
                        status: 'COMPLETED',
                        resolvedAt: nowISO,
                        notes: `Resolved by Refill #${refill.refillRequestId} completion.`
                    });
                }
            }
            // Notify Patient
            const patient = db_1.db.patients.findOne(p => p.patientId === refill.patientId);
            const user = patient ? db_1.db.users.findOne(u => u.patientId === patient.patientId) : undefined;
            if (user) {
                const notif = {
                    id: `notif-rfl-status-${(0, uuid_1.v4)().substring(0, 8)}`,
                    recipientId: user.id,
                    recipientRole: 'PATIENT',
                    patientId: refill.patientId,
                    type: 'REFILL_STATUS_CHANGED',
                    title: `Refill Request ${status}: ${refill.medicationName}`,
                    message: `Your refill request #${refill.refillRequestId} for ${refill.medicationName} is now marked as ${status}.`,
                    category: 'USER',
                    metadata: { refillRequestId: refill.refillRequestId, status },
                    readStatus: false,
                    isRead: false,
                    deliveryStatus: 'DELIVERED',
                    createdAt: nowISO
                };
                db_1.db.notifications.insert(notif);
            }
            res.json({
                success: true,
                data: {
                    refill: updatedRefill,
                    message: `Refill request #${refill.refillRequestId} status updated to ${status}.`
                }
            });
        }
        catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }
};
