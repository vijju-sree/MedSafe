"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const paymentController_1 = require("../controllers/paymentController");
const auth_1 = require("../middleware/auth");
const audit_1 = require("../middleware/audit");
const router = (0, express_1.Router)();
// Public / Auth config endpoint to fetch public Razorpay key ID
router.get('/razorpay/config', paymentController_1.paymentController.getConfig);
// Razorpay Webhook Endpoint (No JWT required; authenticates via x-razorpay-signature)
router.post('/razorpay/webhook', paymentController_1.paymentController.handleWebhook);
// All subsequent routes require authentication
router.use(auth_1.authMiddleware);
// Order creation & payment verification
router.post('/razorpay/create-order', (0, audit_1.logAudit)('RAZORPAY_ORDER_CREATED', 'Payment'), paymentController_1.paymentController.createOrder);
router.post('/razorpay/verify-payment', (0, audit_1.logAudit)('RAZORPAY_PAYMENT_VERIFIED', 'Payment'), paymentController_1.paymentController.verifyPayment);
router.post('/razorpay/test-signature', paymentController_1.paymentController.getTestSignature);
// Payment histories (SQLite)
router.get('/history/subscriptions', paymentController_1.paymentController.getSubscriptionPaymentHistory);
router.get('/history/bills', paymentController_1.paymentController.getBillPaymentHistory);
router.get('/history/organization', paymentController_1.paymentController.getOrganizationPaymentHistory);
router.post('/razorpay/set-mode', paymentController_1.paymentController.setRuntimeMode);
// Family Members (under active Family Subscription)
router.get('/family-members', paymentController_1.paymentController.getFamilyMembers);
router.post('/family-members', (0, audit_1.logAudit)('FAMILY_MEMBER_ADDED', 'FamilyMember'), paymentController_1.paymentController.addFamilyMember);
exports.default = router;
