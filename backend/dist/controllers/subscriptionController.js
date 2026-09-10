"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.subscriptionController = void 0;
const uuid_1 = require("uuid");
const db_1 = require("../database/db");
exports.subscriptionController = {
    getPlans: async (req, res) => {
        try {
            const { customerType } = req.query;
            let plans = db_1.db.subscriptionPlans.find();
            if (customerType) {
                plans = plans.filter((p) => p.customerType === customerType);
            }
            res.json({ success: true, data: { plans } });
        }
        catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    },
    createPlan: async (req, res) => {
        try {
            const { planId, planName, customerType, price, billingCycle, description, features, usageLimits, overagePricing } = req.body;
            if (!planName || price === undefined || !customerType) {
                res.status(400).json({ success: false, message: 'planName, customerType, and price are required.' });
                return;
            }
            const now = new Date().toISOString();
            const newPlan = {
                id: `plan-${(0, uuid_1.v4)().substring(0, 8)}`,
                planId: planId || `PLAN_${planName.toUpperCase().replace(/\s+/g, '_')}`,
                planName,
                customerType,
                price: parseFloat(String(price)),
                billingCycle: billingCycle || 'MONTHLY',
                description: description || '',
                features: Array.isArray(features) ? features : [],
                usageLimits: usageLimits || {},
                overagePricing: overagePricing || {},
                active: true,
                createdAt: now,
                updatedAt: now
            };
            db_1.db.subscriptionPlans.insert(newPlan);
            res.status(201).json({ success: true, data: { plan: newPlan, message: 'Subscription plan created.' } });
        }
        catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    },
    updatePlan: async (req, res) => {
        try {
            const { id } = req.params;
            const existing = db_1.db.subscriptionPlans.findById(id) || db_1.db.subscriptionPlans.findOne(p => p.planId === id);
            if (!existing) {
                res.status(404).json({ success: false, message: 'Subscription plan not found.' });
                return;
            }
            const updated = db_1.db.subscriptionPlans.update(existing.id, {
                ...req.body,
                updatedAt: new Date().toISOString()
            });
            res.json({ success: true, data: { plan: updated, message: 'Subscription plan updated.' } });
        }
        catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    },
    getMySubscription: async (req, res) => {
        try {
            const patientId = req.query.patientId || req.params.patientId;
            const organizationId = req.query.organizationId;
            const userId = req.user?.id;
            let sub = null;
            if (patientId) {
                sub = db_1.db.subscriptions.findOne(s => s.patientId === patientId && s.status === 'ACTIVE');
            }
            else if (organizationId) {
                sub = db_1.db.subscriptions.findOne(s => s.organizationId === organizationId && s.status === 'ACTIVE');
            }
            else if (userId) {
                sub = db_1.db.subscriptions.findOne(s => s.userId === userId && s.status === 'ACTIVE');
            }
            if (!sub) {
                const freePlan = db_1.db.subscriptionPlans.findOne(p => p.planId === 'PLAN_FREE') || {
                    planId: 'PLAN_FREE',
                    planName: 'Free Patient Plan',
                    price: 0,
                    billingCycle: 'MONTHLY',
                    description: 'Standard adherence tracking & reminders'
                };
                res.json({
                    success: true,
                    data: {
                        subscription: null,
                        activePlan: freePlan,
                        isFree: true
                    }
                });
                return;
            }
            const planDetails = db_1.db.subscriptionPlans.findOne(p => p.planId === sub?.planId);
            res.json({
                success: true,
                data: {
                    subscription: sub,
                    activePlan: planDetails,
                    isFree: sub.price === 0
                }
            });
        }
        catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    },
    subscribe: async (req, res) => {
        try {
            const { planId, patientId, organizationId, billingCycle } = req.body;
            const plan = db_1.db.subscriptionPlans.findOne(p => p.planId === planId || p.id === planId);
            if (!plan) {
                res.status(404).json({ success: false, message: 'Plan not found' });
                return;
            }
            const now = new Date();
            const todayStr = now.toISOString().split('T')[0];
            const endDate = new Date(now);
            endDate.setDate(endDate.getDate() + (billingCycle === 'YEARLY' ? 365 : 30));
            const subNum = Math.floor(10000 + Math.random() * 90000);
            const newSub = {
                id: `sub-${(0, uuid_1.v4)().substring(0, 8)}`,
                subscriptionId: `SUB${subNum}`,
                userId: req.user?.id,
                patientId,
                organizationId,
                planId: plan.planId,
                planName: plan.planName,
                price: plan.price,
                billingCycle: billingCycle || plan.billingCycle || 'MONTHLY',
                startDate: todayStr,
                endDate: endDate.toISOString().split('T')[0],
                status: 'ACTIVE',
                autoRenew: true,
                createdAt: now.toISOString(),
                updatedAt: now.toISOString()
            };
            const prevSubs = db_1.db.subscriptions.find(s => (patientId && s.patientId === patientId) || (organizationId && s.organizationId === organizationId));
            for (const prev of prevSubs) {
                if (prev.status === 'ACTIVE') {
                    db_1.db.subscriptions.update(prev.id, { status: 'CANCELLED', updatedAt: now.toISOString() });
                }
            }
            db_1.db.subscriptions.insert(newSub);
            if (req.user?.id) {
                const notif = {
                    id: `notif-sub-${(0, uuid_1.v4)().substring(0, 8)}`,
                    recipientId: req.user.id,
                    recipientRole: req.user.role || 'PATIENT',
                    patientId: patientId || '',
                    type: 'PAYMENT_RECEIVED',
                    title: `Subscription Activated: ${plan.planName}`,
                    message: `Your ${plan.planName} has been activated successfully until ${newSub.endDate}.`,
                    category: 'USER',
                    metadata: { subscriptionId: newSub.subscriptionId, planId: plan.planId },
                    readStatus: false,
                    isRead: false,
                    deliveryStatus: 'DELIVERED',
                    createdAt: now.toISOString()
                };
                db_1.db.notifications.insert(notif);
            }
            res.status(201).json({
                success: true,
                data: {
                    subscription: newSub,
                    plan,
                    message: `Subscribed to ${plan.planName} successfully.`
                }
            });
        }
        catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }
};
