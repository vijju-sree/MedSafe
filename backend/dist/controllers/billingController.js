"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.billingController = void 0;
const uuid_1 = require("uuid");
const db_1 = require("../database/db");
exports.billingController = {
    // Get all bills for a specific patient
    getPatientBills: async (req, res) => {
        try {
            const patientId = req.params.patientId;
            const user = req.user;
            if (user && user.role === 'PATIENT' && user.patientId !== patientId) {
                res.status(403).json({ success: false, message: 'Access denied to bills for this patient.' });
                return;
            }
            const bills = db_1.db.bills.find(b => b.patientId === patientId).sort((a, b) => b.billDate.localeCompare(a.billDate));
            const totalPending = bills.filter(b => b.status === 'PENDING').reduce((sum, b) => sum + b.totalAmount, 0);
            const totalPaid = bills.filter(b => b.status === 'PAID').reduce((sum, b) => sum + b.totalAmount, 0);
            res.json({
                success: true,
                data: {
                    bills,
                    summary: {
                        totalPending,
                        totalPaid,
                        count: bills.length,
                        pendingCount: bills.filter(b => b.status === 'PENDING').length
                    }
                }
            });
        }
        catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    },
    // Get single bill by ID
    getBillById: async (req, res) => {
        try {
            const id = req.params.id;
            const bill = db_1.db.bills.findOne(b => b.id === id || b.billId === id);
            if (!bill) {
                res.status(404).json({ success: false, message: `Bill ${id} not found.` });
                return;
            }
            const payment = bill.paymentId ? db_1.db.payments.findOne(p => p.id === bill.paymentId) : undefined;
            res.json({ success: true, data: { bill, payment } });
        }
        catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    },
    // Process Sandbox Payment
    payBill: async (req, res) => {
        try {
            const id = req.params.id;
            const { paymentMethod = 'UPI', payerDetails = {} } = req.body;
            const bill = db_1.db.bills.findOne(b => b.id === id || b.billId === id);
            if (!bill) {
                res.status(404).json({ success: false, message: `Bill ${id} not found.` });
                return;
            }
            if (bill.status === 'PAID') {
                res.status(400).json({ success: false, message: `Bill ${bill.billId} is already paid.` });
                return;
            }
            const now = new Date().toISOString();
            // Generate sequential Payment ID & Receipt Number
            const allPayments = db_1.db.payments.find();
            let maxPayNum = 10001;
            for (const p of allPayments) {
                const match = p.paymentId?.match(/PAY(\d+)/);
                if (match) {
                    const num = parseInt(match[1], 10);
                    if (num >= maxPayNum)
                        maxPayNum = num + 1;
                }
            }
            const paymentId = `PAY${maxPayNum}`;
            const receiptNumber = `RCP${maxPayNum}`;
            const transactionRef = `TXN-MEDSAFE-${Date.now().toString(36).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`;
            // Payer info sanitization (never store raw card numbers or CVV)
            const sanitizedPayer = {
                name: payerDetails.name || req.user?.name || bill.patientName,
                email: payerDetails.email || req.user?.email || 'patient@medsafe.local',
                phone: payerDetails.phone || '9876543210',
                last4: payerDetails.last4 || (paymentMethod === 'CARD' ? '4242' : undefined),
                upiId: paymentMethod === 'UPI' ? (payerDetails.upiId || `${sanitizedPayerUsername(bill.patientName)}@okaxis`) : undefined
            };
            const newPayment = {
                id: `pay-${(0, uuid_1.v4)().substring(0, 8)}`,
                paymentId,
                billId: bill.billId,
                patientId: bill.patientId,
                patientName: bill.patientName,
                amount: bill.totalAmount,
                currency: 'INR',
                paymentMethod: paymentMethod,
                transactionRef,
                paymentStatus: 'SUCCESS',
                gatewayMode: 'SANDBOX',
                paidAt: now,
                receiptNumber,
                payerDetails: sanitizedPayer
            };
            db_1.db.payments.insert(newPayment);
            // Update bill
            const updatedBill = db_1.db.bills.update(bill.id, {
                status: 'PAID',
                paidAt: now,
                paymentId: newPayment.id,
                paymentMethod: paymentMethod
            });
            // Notify Patient
            const patient = db_1.db.patients.findOne(p => p.patientId === bill.patientId);
            if (patient) {
                const notif = {
                    id: `notif-${(0, uuid_1.v4)().substring(0, 8)}`,
                    recipientId: patient.userId,
                    recipientRole: 'PATIENT',
                    patientId: bill.patientId,
                    type: 'PAYMENT_RECEIVED',
                    title: `Payment Confirmed: ₹${bill.totalAmount}`,
                    message: `Your payment of ₹${bill.totalAmount} for ${bill.items[0]?.description || 'medical services'} (Bill #${bill.billId}) is confirmed. Transaction Ref: ${transactionRef}.`,
                    metadata: { billId: bill.billId, receiptNumber, amount: bill.totalAmount },
                    readStatus: false,
                    deliveryStatus: 'DELIVERED',
                    createdAt: now
                };
                db_1.db.notifications.insert(notif);
            }
            res.status(200).json({
                success: true,
                data: {
                    payment: newPayment,
                    bill: updatedBill,
                    receipt: {
                        receiptNumber,
                        transactionRef,
                        billId: bill.billId,
                        patientName: bill.patientName,
                        patientId: bill.patientId,
                        amount: bill.totalAmount,
                        paymentMethod,
                        paidAt: now,
                        gatewayMode: 'SANDBOX'
                    },
                    message: `Payment of ₹${bill.totalAmount} processed successfully in sandbox mode.`
                }
            });
        }
        catch (error) {
            console.error('payBill error:', error);
            res.status(500).json({ success: false, message: error.message });
        }
    },
    // Get Receipt Details
    getReceipt: async (req, res) => {
        try {
            const id = req.params.id; // billId or paymentId
            const payment = db_1.db.payments.findOne(p => p.id === id || p.paymentId === id || p.billId === id || p.receiptNumber === id);
            if (!payment) {
                res.status(404).json({ success: false, message: `Payment receipt for ${id} not found.` });
                return;
            }
            const bill = db_1.db.bills.findOne(b => b.billId === payment.billId);
            res.json({
                success: true,
                data: {
                    receipt: payment,
                    bill
                }
            });
        }
        catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    },
    // All bills for admin or clinic
    getAllBills: async (req, res) => {
        try {
            const { status } = req.query;
            let bills = db_1.db.bills.find().sort((a, b) => b.billDate.localeCompare(a.billDate));
            if (status) {
                bills = bills.filter(b => b.status === status);
            }
            const totalRevenue = bills.filter(b => b.status === 'PAID').reduce((sum, b) => sum + b.totalAmount, 0);
            const pendingRevenue = bills.filter(b => b.status === 'PENDING').reduce((sum, b) => sum + b.totalAmount, 0);
            res.json({
                success: true,
                data: {
                    bills,
                    analytics: {
                        totalBills: bills.length,
                        paidBills: bills.filter(b => b.status === 'PAID').length,
                        pendingBills: bills.filter(b => b.status === 'PENDING').length,
                        totalRevenue,
                        pendingRevenue
                    }
                }
            });
        }
        catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }
};
function sanitizedPayerUsername(name) {
    return name.toLowerCase().replace(/[^a-z0-9]/g, '');
}
