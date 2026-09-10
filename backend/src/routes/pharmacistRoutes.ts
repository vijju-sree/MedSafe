import { Router } from 'express';
import { pharmacistController } from '../controllers/pharmacistController';
import { authMiddleware } from '../middleware/auth';
import { requireRoles } from '../middleware/rbac';
import { logAudit } from '../middleware/audit';

const router = Router();

router.use(authMiddleware);
router.use(requireRoles('PHARMACIST', 'ADMIN'));

router.get('/queue', pharmacistController.getRefillQueue);

router.post(
  '/refill',
  logAudit('PHARMACY_REFILL_RECORDED', 'Medication'),
  pharmacistController.recordRefill
);

router.post(
  '/notes',
  logAudit('PHARMACY_NOTE_ADDED', 'FollowUpAction'),
  pharmacistController.addReviewNotes
);

export default router;
