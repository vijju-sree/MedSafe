import { Router } from 'express';
import { paymentController } from '../controllers/paymentController';
import { authMiddleware } from '../middleware/auth';
import { logAudit } from '../middleware/audit';

const router = Router();

// Public / Auth config endpoint to fetch public Razorpay key ID
router.get('/razorpay/config', paymentController.getConfig);

// Razorpay Webhook Endpoint (No JWT required; authenticates via x-razorpay-signature)
router.post('/razorpay/webhook', paymentController.handleWebhook);

// All subsequent routes require authentication
router.use(authMiddleware);

// Order creation & payment verification
router.post(
  '/razorpay/create-order',
  logAudit('RAZORPAY_ORDER_CREATED', 'Payment'),
  paymentController.createOrder
);

router.post(
  '/razorpay/verify-payment',
  logAudit('RAZORPAY_PAYMENT_VERIFIED', 'Payment'),
  paymentController.verifyPayment
);

router.post('/razorpay/test-signature', paymentController.getTestSignature);

// Payment histories (SQLite)
router.get('/history/subscriptions', paymentController.getSubscriptionPaymentHistory);
router.get('/history/bills', paymentController.getBillPaymentHistory);
router.get('/history/organization', paymentController.getOrganizationPaymentHistory);
router.post('/razorpay/set-mode', paymentController.setRuntimeMode);

// Family Members (under active Family Subscription)
router.get('/family-members', paymentController.getFamilyMembers);
router.post(
  '/family-members',
  logAudit('FAMILY_MEMBER_ADDED', 'FamilyMember'),
  paymentController.addFamilyMember
);

export default router;
