import { Router } from 'express';
import { refillController } from '../controllers/refillController';
import { authMiddleware } from '../middleware/auth';
import { requireRoles } from '../middleware/rbac';

const router = Router();

router.get('/', authMiddleware, refillController.getAllRefills);
router.get('/:id', authMiddleware, refillController.getRefillById);
router.put('/:id/status', authMiddleware, requireRoles('DOCTOR', 'PHARMACIST', 'ADMIN', 'CLINIC'), refillController.updateRefillStatus);

export default router;
