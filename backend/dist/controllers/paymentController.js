"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.paymentController = void 0;
const uuid_1 = require("uuid");
const db_1 = require("../database/db");
const sqlite_1 = require("../database/sqlite");
const razorpayService_1 = require("../services/razorpayService");
exports.paymentController = {
    // Get public Razorpay Key ID for frontend Checkout initialization (never secret!)
    getConfig: async (req, res) => {
        try {
            res.json({
                success: true,
                data: {
                    keyId: razorpayService_1.razorpayService.getKeyId(),
                    mode: razorpayService_1.razorpayService.getMode(),
                }
            });
        }
        catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    },
    // Helper for test mode signature generation
    getTestSignature: async (req, res) => {
        try {
            if (razorpayService_1.razorpayService.getMode() === 'LIVE') {
                res.status(403).json({
                    success: false,
                    message: 'Test signature generation is strictly disallowed in LIVE production mode. Real payments required.'
                });
                return;
            }
            const { orderId, paymentId } = req.body;
            if (!orderId || !paymentId) {
                res.status(400).json({ success: false, message: 'orderId and paymentId are required.' });
                return;
            }
            const signature = razorpayService_1.razorpayService.generateTestSignature(orderId, paymentId);
            res.json({ success: true, signature });
        }
        catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    },
    // 1. Create Razorpay Order on Server-Side
    createOrder: async (req, res) => {
        try {
            const user = req.user;
            if (!user) {
                res.status(401).json({ success: false, message: 'Unauthorized. Login required to initiate payment.' });
                return;
            }
            const { type, referenceId, billingCycle } = req.body;
            if (!type || !referenceId) {
                res.status(400).json({ success: false, message: 'Payment type (SUBSCRIPTION or BILL) and referenceId are required.' });
                return;
            }
            let amountInRupees = 0;
            let orderNotes = {
                userId: user.id,
                patientId: user.patientId || 'PAT10001',
                type,
                referenceId
            };
            // SERVER-SIDE AMOUNT VALIDATION: Never trust client amount!
            if (type === 'SUBSCRIPTION' || type === 'FAMILY_SUBSCRIPTION') {
                const targetPlanId = type === 'FAMILY_SUBSCRIPTION' ? 'PLAN_FAMILY_PLUS' : referenceId;
                const plan = db_1.db.subscriptionPlans.findOne(p => p.planId === targetPlanId || p.id === targetPlanId);
                if (!plan) {
                    res.status(404).json({ success: false, message: `Subscription plan ${targetPlanId} not found.` });
                    return;
                }
                const cycle = (billingCycle || plan.billingCycle || 'MONTHLY').toUpperCase();
                amountInRupees = cycle === 'YEARLY' ? plan.price * 10 : plan.price;
                if (amountInRupees <= 0) {
                    res.status(400).json({ success: false, message: 'Free plans do not require payment processing.' });
                    return;
                }
                orderNotes.planId = plan.planId;
                orderNotes.planName = plan.planName;
                orderNotes.billingCycle = cycle;
                orderNotes.customerType = 'PATIENT';
            }
            else if (type === 'BILL') {
                const bill = db_1.db.bills.findOne(b => b.billId === referenceId || b.id === referenceId);
                if (!bill) {
                    res.status(404).json({ success: false, message: `Healthcare bill ${referenceId} not found.` });
                    return;
                }
                if (bill.status === 'PAID') {
                    res.status(400).json({ success: false, message: 'This bill has already been paid.' });
                    return;
                }
                amountInRupees = bill.totalAmount || 0;
                if (amountInRupees <= 0) {
                    res.status(400).json({ success: false, message: 'Bill amount must be greater than zero.' });
                    return;
                }
                orderNotes.billId = bill.billId;
                orderNotes.clinicId = bill.clinicId;
                orderNotes.labId = bill.labId;
            }
            else if (type === 'ORGANIZATION_LICENSE') {
                // 4. Organization Subscription / Licensing payments
                const license = db_1.db.organizationLicenses.findOne(l => l.licenseId === referenceId || l.id === referenceId);
                const plan = db_1.db.subscriptionPlans.findOne(p => p.planId === (license?.planId || referenceId) || p.id === (license?.planId || referenceId));
                const cycle = (billingCycle || 'MONTHLY').toUpperCase();
                const basePrice = plan?.price || 4999;
                amountInRupees = cycle === 'YEARLY' ? basePrice * 10 : basePrice;
                orderNotes.licenseId = license?.licenseId || referenceId;
                orderNotes.organizationId = license?.organizationId || req.body.organizationId || 'org-1';
                orderNotes.organizationName = license?.organizationName || req.body.organizationName || 'Healthcare Facility';
                orderNotes.planId = plan?.planId || 'PLAN_CLINIC_ORG';
                orderNotes.billingCycle = cycle;
                orderNotes.customerType = 'ORGANIZATION';
            }
            else if (type === 'ORGANIZATION_USAGE') {
                // 5. Organization Usage-Based Billing
                const usage = db_1.db.usageRecords.findOne(u => u.id === referenceId || u.id === referenceId.replace('usage-', 'usg-') || u.id === referenceId.replace('usg-', 'usage-'));
                if (!usage) {
                    res.status(404).json({ success: false, message: `Usage record ${referenceId} not found.` });
                    return;
                }
                amountInRupees = (usage.totalAmount && usage.totalAmount > 0)
                    ? usage.totalAmount
                    : ((usage.billableQuantity || 1) * (usage.unitPrice || 15)) || 750;
                orderNotes.usageRecordId = usage.id;
                orderNotes.organizationId = usage.organizationId;
                orderNotes.billingPeriod = usage.billingPeriod;
                orderNotes.customerType = 'ORGANIZATION';
            }
            else {
                res.status(400).json({
                    success: false,
                    message: `Invalid payment type: ${type}. Expected SUBSCRIPTION, FAMILY_SUBSCRIPTION, BILL, ORGANIZATION_LICENSE, or ORGANIZATION_USAGE.`
                });
                return;
            }
            // Create order via Razorpay service
            const order = razorpayService_1.razorpayService.createOrder(amountInRupees, type === 'SUBSCRIPTION' ? 'sub' : 'bill', orderNotes);
            res.status(201).json({
                success: true,
                data: order
            });
        }
        catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    },
    // 2. Server-Side Payment Verification & Fulfillment
    verifyPayment: async (req, res) => {
        try {
            const user = req.user;
            const { razorpay_order_id, razorpay_payment_id, razorpay_signature, type, referenceId, billingCycle } = req.body;
            if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
                res.status(400).json({
                    success: false,
                    message: 'Missing required Razorpay payment confirmation parameters (order ID, payment ID, signature).'
                });
                return;
            }
            // Official HMAC-SHA256 signature verification
            const isValid = razorpayService_1.razorpayService.verifySignature(razorpay_order_id, razorpay_payment_id, razorpay_signature);
            const patientId = user?.patientId || 'PAT10001';
            const now = new Date().toISOString();
            if (!isValid) {
                // Log payment failure & send notification
                db_1.db.notifications.insert({
                    id: `notif-${(0, uuid_1.v4)().substring(0, 8)}`,
                    patientId,
                    recipientId: user?.id || 'usr-pat-1',
                    recipientRole: 'PATIENT',
                    type: 'SYSTEM_ALERT',
                    title: 'Payment Failed',
                    message: 'Payment failed. Your account/bill has not been marked as paid.',
                    category: 'SYSTEM_DISPATCH',
                    readStatus: false,
                    deliveryStatus: 'DELIVERED',
                    createdAt: now
                });
                res.status(400).json({
                    success: false,
                    message: 'Payment failed. Signature verification error. Please try again.'
                });
                return;
            }
            // IDEMPOTENCY CHECK: Prevent duplicate processing of the same payment ID
            // IDEMPOTENCY CHECK: Prevent duplicate processing across all tables
            const existingSubPayment = await sqlite_1.sqliteDb.getSubscriptionPaymentByPaymentId(razorpay_payment_id);
            const existingBillPayment = await sqlite_1.sqliteDb.getBillPaymentByPaymentId(razorpay_payment_id);
            const existingOrgPayment = await sqlite_1.sqliteDb.getOrganizationPaymentByPaymentId(razorpay_payment_id);
            if (existingSubPayment || existingBillPayment || existingOrgPayment) {
                res.json({
                    success: true,
                    message: 'Payment already processed and recorded.',
                    data: existingSubPayment || existingBillPayment || existingOrgPayment
                });
                return;
            }
            // FULFILLMENT: Handle all 5 payment types
            if (type === 'SUBSCRIPTION' || type === 'FAMILY_SUBSCRIPTION') {
                const plan = db_1.db.subscriptionPlans.findOne(p => p.planId === referenceId || p.id === referenceId);
                if (!plan) {
                    res.status(404).json({ success: false, message: 'Subscription plan not found.' });
                    return;
                }
                const cycle = (billingCycle || plan.billingCycle || 'MONTHLY').toUpperCase();
                const price = cycle === 'YEARLY' ? plan.price * 10 : plan.price;
                const subId = `SUB-${Date.now().toString().slice(-6)}`;
                const daysValid = cycle === 'YEARLY' ? 365 : 30;
                const startDate = now;
                const renewalDate = new Date(Date.now() + daysValid * 24 * 60 * 60 * 1000).toISOString();
                // Check if Family Plus plan (up to 5 members)
                const isFamilyPlan = plan.planId === 'PLAN_FAMILY_PLUS' || plan.planName.toLowerCase().includes('family');
                const familyMembersLimit = isFamilyPlan ? 5 : 0;
                const subscriptionRecord = {
                    id: `sub-${(0, uuid_1.v4)().substring(0, 8)}`,
                    subscriptionId: subId,
                    userId: user?.id,
                    patientId,
                    planId: plan.planId,
                    planName: plan.planName,
                    price,
                    billingCycle: cycle,
                    startDate,
                    endDate: renewalDate,
                    renewalDate,
                    status: 'ACTIVE',
                    autoRenew: true,
                    razorpayPaymentId: razorpay_payment_id,
                    familyMembersLimit,
                    familyMembersCount: 0,
                    createdAt: now,
                    updatedAt: now
                };
                // Update JSON collection
                const existingSub = db_1.db.subscriptions.findOne(s => s.patientId === patientId);
                if (existingSub) {
                    db_1.db.subscriptions.update(existingSub.id, subscriptionRecord);
                }
                else {
                    db_1.db.subscriptions.insert(subscriptionRecord);
                }
                // Update SQLite Subscriptions table
                await sqlite_1.sqliteDb.upsertSubscription(subscriptionRecord);
                // Record Subscription Payment in SQLite
                const subPaymentId = `SPAY-${Date.now().toString().slice(-6)}`;
                const subPaymentRecord = {
                    id: `spay-${(0, uuid_1.v4)().substring(0, 8)}`,
                    subscriptionPaymentId: subPaymentId,
                    userId: user?.id || 'usr-pat-1',
                    patientId,
                    subscriptionId: subId,
                    planId: plan.planId,
                    planName: plan.planName,
                    amount: price,
                    currency: 'INR',
                    razorpayOrderId: razorpay_order_id,
                    razorpayPaymentId: razorpay_payment_id,
                    razorpaySignature: razorpay_signature,
                    status: 'PAID',
                    paymentMethod: 'Razorpay',
                    createdAt: now,
                    paidAt: now
                };
                await sqlite_1.sqliteDb.insertSubscriptionPayment(subPaymentRecord);
                // Record in in-memory payments collection
                db_1.db.payments.insert({
                    id: `pay-${(0, uuid_1.v4)().substring(0, 8)}`,
                    paymentId: subPaymentId,
                    patientId,
                    patientName: user?.name || 'Patient',
                    amount: price,
                    currency: 'INR',
                    paymentMethod: 'Razorpay',
                    transactionRef: razorpay_payment_id,
                    paymentStatus: 'SUCCESS',
                    gatewayMode: razorpayService_1.razorpayService.getMode() === 'TEST' ? 'SANDBOX' : 'LIVE',
                    paidAt: now,
                    receiptNumber: `RCP-${subPaymentId}`,
                    payerDetails: {
                        name: user?.name || 'Patient',
                        email: user?.email || '',
                        phone: user?.phone || ''
                    }
                });
                // Dispatch notification
                db_1.db.notifications.insert({
                    id: `notif-${(0, uuid_1.v4)().substring(0, 8)}`,
                    patientId,
                    recipientId: user?.id || 'usr-pat-1',
                    recipientRole: 'PATIENT',
                    type: 'PLATFORM_FEATURE',
                    title: 'Subscription Activated',
                    message: `${plan.planName} subscription activated successfully.`,
                    category: 'SYSTEM_DISPATCH',
                    readStatus: false,
                    deliveryStatus: 'DELIVERED',
                    createdAt: now
                });
                res.json({
                    success: true,
                    message: `${plan.planName} subscription activated successfully.`,
                    data: {
                        subscription: subscriptionRecord,
                        payment: subPaymentRecord
                    }
                });
            }
            else if (type === 'BILL') {
                const bill = db_1.db.bills.findOne(b => b.billId === referenceId || b.id === referenceId);
                if (!bill) {
                    res.status(404).json({ success: false, message: 'Healthcare bill not found.' });
                    return;
                }
                const billAmount = bill.totalAmount || 0;
                // Mark Bill as PAID in db
                db_1.db.bills.update(bill.id, {
                    status: 'PAID',
                    paidAt: now,
                    paymentReference: razorpay_payment_id
                });
                // Record in SQLite Bill Payments table
                const bPaymentId = `BPAY-${Date.now().toString().slice(-6)}`;
                const billPaymentRecord = {
                    id: `bpay-${(0, uuid_1.v4)().substring(0, 8)}`,
                    billPaymentId: bPaymentId,
                    billId: bill.billId || bill.id,
                    patientId: bill.patientId,
                    organizationId: bill.clinicId || bill.labId,
                    amount: billAmount,
                    currency: 'INR',
                    razorpayOrderId: razorpay_order_id,
                    razorpayPaymentId: razorpay_payment_id,
                    razorpaySignature: razorpay_signature,
                    status: 'PAID',
                    paymentMethod: 'Razorpay',
                    createdAt: now,
                    paidAt: now
                };
                await sqlite_1.sqliteDb.insertBillPayment(billPaymentRecord);
                // Record in in-memory payments collection
                db_1.db.payments.insert({
                    id: `pay-${(0, uuid_1.v4)().substring(0, 8)}`,
                    paymentId: bPaymentId,
                    billId: bill.billId || bill.id,
                    patientId: bill.patientId,
                    patientName: bill.patientName || user?.name || 'Patient',
                    amount: billAmount,
                    currency: 'INR',
                    paymentMethod: 'Razorpay',
                    transactionRef: razorpay_payment_id,
                    paymentStatus: 'SUCCESS',
                    gatewayMode: razorpayService_1.razorpayService.getMode() === 'TEST' ? 'SANDBOX' : 'LIVE',
                    paidAt: now,
                    receiptNumber: `RCP-${bPaymentId}`,
                    payerDetails: {
                        name: user?.name || 'Patient',
                        email: user?.email || '',
                        phone: user?.phone || ''
                    }
                });
                // Dispatch notification
                const serviceName = bill.items?.[0]?.description || bill.testName || 'medical investigation';
                db_1.db.notifications.insert({
                    id: `notif-${(0, uuid_1.v4)().substring(0, 8)}`,
                    patientId: bill.patientId,
                    recipientId: user?.id || 'usr-pat-1',
                    recipientRole: 'PATIENT',
                    type: 'PLATFORM_FEATURE',
                    title: 'Payment Successful',
                    message: `Payment successful for ${serviceName}. Bill ${bill.billId || bill.id} is now paid.`,
                    category: 'SYSTEM_DISPATCH',
                    readStatus: false,
                    deliveryStatus: 'DELIVERED',
                    createdAt: now
                });
                res.json({
                    success: true,
                    message: `Payment successful for ${serviceName}. Bill ${bill.billId || bill.id} is now paid.`,
                    data: {
                        bill: db_1.db.bills.findById(bill.id),
                        payment: billPaymentRecord
                    }
                });
            }
            else if (type === 'ORGANIZATION_LICENSE') {
                const license = db_1.db.organizationLicenses.findOne(l => l.licenseId === referenceId || l.id === referenceId);
                const plan = db_1.db.subscriptionPlans.findOne(p => p.planId === (license?.planId || referenceId) || p.id === (license?.planId || referenceId));
                const cycle = (billingCycle || 'MONTHLY').toUpperCase();
                const basePrice = plan?.price || 4999;
                const price = cycle === 'YEARLY' ? basePrice * 10 : basePrice;
                const orgId = license?.organizationId || req.body.organizationId || 'org-1';
                const orgName = license?.organizationName || req.body.organizationName || 'Apollo Health Center';
                if (license) {
                    db_1.db.organizationLicenses.update(license.id, {
                        status: 'ACTIVE',
                        updatedAt: now
                    });
                }
                const opayId = `OPAY-${Date.now().toString().slice(-6)}`;
                const orgPaymentRecord = {
                    id: `opay-${(0, uuid_1.v4)().substring(0, 8)}`,
                    organizationPaymentId: opayId,
                    organizationId: orgId,
                    organizationName: orgName,
                    paymentType: 'LICENSE',
                    referenceId: license?.licenseId || referenceId,
                    amount: price,
                    currency: 'INR',
                    razorpayOrderId: razorpay_order_id,
                    razorpayPaymentId: razorpay_payment_id,
                    razorpaySignature: razorpay_signature,
                    status: 'PAID',
                    paymentMethod: 'Razorpay',
                    createdAt: now,
                    paidAt: now
                };
                await sqlite_1.sqliteDb.insertOrganizationPayment(orgPaymentRecord);
                db_1.db.payments.insert({
                    id: `pay-${(0, uuid_1.v4)().substring(0, 8)}`,
                    paymentId: opayId,
                    organizationId: orgId,
                    patientName: orgName,
                    amount: price,
                    currency: 'INR',
                    paymentMethod: 'Razorpay',
                    transactionRef: razorpay_payment_id,
                    paymentStatus: 'SUCCESS',
                    gatewayMode: razorpayService_1.razorpayService.getMode() === 'TEST' ? 'SANDBOX' : 'LIVE',
                    paidAt: now,
                    receiptNumber: `RCP-${opayId}`,
                    payerDetails: {
                        name: orgName,
                        email: user?.email || 'admin@apollohealth.local',
                        phone: user?.phone || ''
                    }
                });
                res.json({
                    success: true,
                    message: `Organization license ${referenceId} verified and renewed successfully via Razorpay.`,
                    data: {
                        payment: orgPaymentRecord,
                        license: license || null
                    }
                });
            }
            else if (type === 'ORGANIZATION_USAGE') {
                const usage = db_1.db.usageRecords.findOne(u => u.id === referenceId || u.id === referenceId.replace('usage-', 'usg-') || u.id === referenceId.replace('usg-', 'usage-'));
                const orgId = usage?.organizationId || req.body.organizationId || 'org-1';
                const orgName = usage?.organizationName || req.body.organizationName || 'Apollo Health Center';
                const price = (usage?.totalAmount && usage.totalAmount > 0)
                    ? usage.totalAmount
                    : ((usage?.billableQuantity || 1) * (usage?.unitPrice || 15)) || 750;
                const opayId = `OPAY-${Date.now().toString().slice(-6)}`;
                const orgPaymentRecord = {
                    id: `opay-${(0, uuid_1.v4)().substring(0, 8)}`,
                    organizationPaymentId: opayId,
                    organizationId: orgId,
                    organizationName: orgName,
                    paymentType: 'USAGE_OVERAGE',
                    referenceId: usage?.id || referenceId,
                    amount: price,
                    currency: 'INR',
                    razorpayOrderId: razorpay_order_id,
                    razorpayPaymentId: razorpay_payment_id,
                    razorpaySignature: razorpay_signature,
                    status: 'PAID',
                    paymentMethod: 'Razorpay',
                    createdAt: now,
                    paidAt: now
                };
                await sqlite_1.sqliteDb.insertOrganizationPayment(orgPaymentRecord);
                db_1.db.payments.insert({
                    id: `pay-${(0, uuid_1.v4)().substring(0, 8)}`,
                    paymentId: opayId,
                    organizationId: orgId,
                    patientName: orgName,
                    amount: price,
                    currency: 'INR',
                    paymentMethod: 'Razorpay',
                    transactionRef: razorpay_payment_id,
                    paymentStatus: 'SUCCESS',
                    gatewayMode: razorpayService_1.razorpayService.getMode() === 'TEST' ? 'SANDBOX' : 'LIVE',
                    paidAt: now,
                    receiptNumber: `RCP-${opayId}`,
                    payerDetails: {
                        name: orgName,
                        email: user?.email || 'admin@apollohealth.local',
                        phone: user?.phone || ''
                    }
                });
                res.json({
                    success: true,
                    message: `Organization usage billing settled successfully via Razorpay.`,
                    data: {
                        payment: orgPaymentRecord,
                        usage: usage || null
                    }
                });
            }
            else {
                res.status(400).json({ success: false, message: 'Invalid payment type.' });
            }
        }
        catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    },
    // 3. Subscription Payment History (SQLite)
    getSubscriptionPaymentHistory: async (req, res) => {
        try {
            const patientId = req.query.patientId || req.user?.patientId || 'PAT10001';
            const payments = await sqlite_1.sqliteDb.getSubscriptionPayments(patientId);
            res.json({
                success: true,
                data: { payments }
            });
        }
        catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    },
    // 4. Healthcare Bill Payment History (SQLite)
    getBillPaymentHistory: async (req, res) => {
        try {
            const patientId = req.query.patientId || req.user?.patientId || 'PAT10001';
            const payments = await sqlite_1.sqliteDb.getBillPayments(patientId);
            res.json({
                success: true,
                data: { payments }
            });
        }
        catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    },
    // 5. Family Members Management (under Family Subscription)
    getFamilyMembers: async (req, res) => {
        try {
            const patientId = req.query.patientId || req.user?.patientId || 'PAT10001';
            const members = await sqlite_1.sqliteDb.getFamilyMembers(patientId);
            res.json({
                success: true,
                data: { members }
            });
        }
        catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    },
    addFamilyMember: async (req, res) => {
        try {
            const user = req.user;
            const patientId = user?.patientId || 'PAT10001';
            const { name, relationship, phone, email } = req.body;
            if (!name || !relationship) {
                res.status(400).json({ success: false, message: 'Member full name and relationship are required.' });
                return;
            }
            // Check primary patient's active subscription
            const sub = db_1.db.subscriptions.findOne(s => s.patientId === patientId && s.status === 'ACTIVE');
            if (!sub || (sub.familyMembersLimit || 0) <= 0) {
                res.status(403).json({
                    success: false,
                    message: 'An active Family Plan (such as Family Plus) is required to enroll family members.'
                });
                return;
            }
            const existingMembers = await sqlite_1.sqliteDb.getFamilyMembers(patientId);
            const limit = sub.familyMembersLimit || 5;
            if (existingMembers.length >= limit) {
                res.status(400).json({
                    success: false,
                    message: `Family member limit reached (${existingMembers.length}/${limit}). Upgrade plan for additional members.`
                });
                return;
            }
            const memberId = `FAM-${(0, uuid_1.v4)().substring(0, 8)}`;
            const newMember = {
                id: memberId,
                subscriptionId: sub.subscriptionId,
                primaryPatientId: patientId,
                name,
                relationship,
                phone: phone || '',
                email: email || '',
                addedAt: new Date().toISOString()
            };
            await sqlite_1.sqliteDb.addFamilyMember(newMember);
            // Update in-memory subscription record
            db_1.db.subscriptions.update(sub.id, {
                familyMembersCount: existingMembers.length + 1
            });
            // Notification
            db_1.db.notifications.insert({
                id: `notif-${(0, uuid_1.v4)().substring(0, 8)}`,
                patientId,
                recipientId: user?.id || 'usr-pat-1',
                recipientRole: 'PATIENT',
                type: 'PLATFORM_FEATURE',
                title: 'Family Member Added',
                message: `Family member ${name} (${relationship}) added under ${sub.planName}. Covered without additional fee.`,
                category: 'SYSTEM_DISPATCH',
                readStatus: false,
                deliveryStatus: 'DELIVERED',
                createdAt: new Date().toISOString()
            });
            res.status(201).json({
                success: true,
                message: `Family member ${name} added successfully under ${sub.planName}.`,
                data: { member: newMember }
            });
        }
        catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    },
    // 3. Official Razorpay Webhook Handler
    handleWebhook: async (req, res) => {
        try {
            const signature = (req.headers['x-razorpay-signature'] || '');
            const rawPayload = req.rawBody || JSON.stringify(req.body);
            // Verify HMAC-SHA256 Webhook Signature
            const isValid = razorpayService_1.razorpayService.verifyWebhookSignature(rawPayload, signature);
            if (!isValid) {
                res.status(400).json({ success: false, message: 'Invalid Razorpay webhook signature.' });
                return;
            }
            const event = req.body || {};
            const eventType = event.event || 'unknown';
            const eventId = event.event_id || event.payload?.payment?.entity?.id || (0, uuid_1.v4)();
            const now = new Date().toISOString();
            // Check webhook idempotency
            const alreadyProcessed = await sqlite_1.sqliteDb.hasWebhookEventBeenProcessed(eventId);
            if (alreadyProcessed) {
                res.json({ success: true, message: 'Webhook event already processed.' });
                return;
            }
            // Record webhook event in SQLite
            await sqlite_1.sqliteDb.recordWebhookEvent({
                id: `wh-${(0, uuid_1.v4)().substring(0, 8)}`,
                eventId,
                eventType,
                entityId: event.payload?.payment?.entity?.id || event.payload?.order?.entity?.id || 'unknown',
                payload: typeof req.body === 'string' ? req.body : JSON.stringify(req.body),
                status: 'PROCESSED',
                createdAt: now
            });
            // Handle specific webhook events
            if (eventType === 'payment.captured' || eventType === 'order.paid') {
                const paymentEntity = event.payload?.payment?.entity;
                const notes = paymentEntity?.notes || event.payload?.order?.entity?.notes || {};
                const pType = notes.type;
                const refId = notes.referenceId;
                const paymentId = paymentEntity?.id;
                const orderId = paymentEntity?.order_id;
                const amountInRupees = paymentEntity?.amount ? paymentEntity.amount / 100 : 0;
                if (pType === 'BILL' && refId) {
                    const bill = db_1.db.bills.findOne(b => b.billId === refId || b.id === refId);
                    if (bill && bill.status !== 'PAID') {
                        db_1.db.bills.update(bill.id, {
                            status: 'PAID',
                            paidAt: now,
                            paymentReference: paymentId
                        });
                        await sqlite_1.sqliteDb.insertBillPayment({
                            id: `bpay-${(0, uuid_1.v4)().substring(0, 8)}`,
                            billPaymentId: `BPAY-${Date.now().toString().slice(-6)}`,
                            billId: bill.billId || bill.id,
                            patientId: bill.patientId,
                            organizationId: bill.clinicId || bill.labId,
                            amount: amountInRupees || bill.totalAmount,
                            currency: 'INR',
                            razorpayOrderId: orderId || 'order_webhook',
                            razorpayPaymentId: paymentId || 'pay_webhook',
                            razorpaySignature: signature,
                            status: 'PAID',
                            paymentMethod: 'Razorpay',
                            createdAt: now,
                            paidAt: now
                        });
                    }
                }
                else if ((pType === 'SUBSCRIPTION' || pType === 'FAMILY_SUBSCRIPTION') && notes.patientId) {
                    const plan = db_1.db.subscriptionPlans.findOne(p => p.planId === notes.planId);
                    if (plan) {
                        const isFamily = plan.planId === 'PLAN_FAMILY_PLUS';
                        const renewalDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
                        const subRecord = {
                            id: `sub-${(0, uuid_1.v4)().substring(0, 8)}`,
                            subscriptionId: `SUB-${Date.now().toString().slice(-6)}`,
                            userId: notes.userId,
                            patientId: notes.patientId,
                            planId: plan.planId,
                            planName: plan.planName,
                            price: amountInRupees || plan.price,
                            billingCycle: (notes.billingCycle || 'MONTHLY'),
                            startDate: now,
                            endDate: renewalDate,
                            renewalDate,
                            status: 'ACTIVE',
                            autoRenew: true,
                            razorpayPaymentId: paymentId,
                            familyMembersLimit: isFamily ? 5 : 0,
                            familyMembersCount: 0,
                            createdAt: now,
                            updatedAt: now
                        };
                        const existing = db_1.db.subscriptions.findOne(s => s.patientId === notes.patientId);
                        if (existing) {
                            db_1.db.subscriptions.update(existing.id, subRecord);
                        }
                        else {
                            db_1.db.subscriptions.insert(subRecord);
                        }
                        await sqlite_1.sqliteDb.upsertSubscription(subRecord);
                        await sqlite_1.sqliteDb.insertSubscriptionPayment({
                            id: `spay-${(0, uuid_1.v4)().substring(0, 8)}`,
                            subscriptionPaymentId: `SPAY-${Date.now().toString().slice(-6)}`,
                            userId: notes.userId || 'usr-pat-1',
                            patientId: notes.patientId,
                            subscriptionId: subRecord.subscriptionId,
                            planId: plan.planId,
                            planName: plan.planName,
                            amount: amountInRupees || plan.price,
                            currency: 'INR',
                            razorpayOrderId: orderId || 'order_webhook',
                            razorpayPaymentId: paymentId || 'pay_webhook',
                            razorpaySignature: signature,
                            status: 'PAID',
                            paymentMethod: 'Razorpay',
                            createdAt: now,
                            paidAt: now
                        });
                    }
                }
            }
            else if (eventType === 'payment.failed') {
                const paymentEntity = event.payload?.payment?.entity;
                const notes = paymentEntity?.notes || {};
                const recipient = notes.patientId || 'usr-pat-1';
                db_1.db.notifications.insert({
                    id: `notif-${(0, uuid_1.v4)().substring(0, 8)}`,
                    patientId: notes.patientId || 'PAT10001',
                    recipientId: recipient,
                    recipientRole: 'PATIENT',
                    type: 'SYSTEM_ALERT',
                    title: 'Payment Authorization Failed',
                    message: `Razorpay payment authorization failed: ${paymentEntity?.error_description || 'Transaction declined by issuer.'}`,
                    category: 'SYSTEM_DISPATCH',
                    readStatus: false,
                    deliveryStatus: 'DELIVERED',
                    createdAt: now
                });
            }
            res.json({ success: true, message: `Webhook ${eventType} processed successfully.` });
        }
        catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    },
    // 4. Organization Payment History
    getOrganizationPaymentHistory: async (req, res) => {
        try {
            const { organizationId } = req.query;
            const payments = await sqlite_1.sqliteDb.getOrganizationPayments(organizationId);
            res.json({ success: true, data: { payments } });
        }
        catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    },
    // 5. Switch runtime mode for testing
    setRuntimeMode: async (req, res) => {
        try {
            const { mode, keyId, keySecret } = req.body;
            if (mode !== 'TEST' && mode !== 'LIVE') {
                res.status(400).json({ success: false, message: 'mode must be TEST or LIVE' });
                return;
            }
            razorpayService_1.razorpayService.setMode(mode, keyId, keySecret);
            res.json({
                success: true,
                message: `Razorpay mode switched to ${mode}`,
                mode: razorpayService_1.razorpayService.getMode(),
                keyId: razorpayService_1.razorpayService.getKeyId()
            });
        }
        catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    },
};
