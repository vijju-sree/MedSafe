import { Router } from 'express';
import { subscriptionController } from '../controllers/subscriptionController';
import { authMiddleware } from '../middleware/auth';
import { requireRoles } from '../middleware/rbac';

const router = Router();

router.get('/plans', subscriptionController.getPlans);
router.post('/plans', authMiddleware, requireRoles('ADMIN'), subscriptionController.createPlan);
router.put('/plans/:id', authMiddleware, requireRoles('ADMIN'), subscriptionController.updatePlan);

router.get('/my', authMiddleware, subscriptionController.getMySubscription);
router.get('/patient/:patientId', authMiddleware, subscriptionController.getMySubscription);
router.post('/subscribe', authMiddleware, subscriptionController.subscribe);

export default router;
