import { Router } from 'express';
import { doctorController } from '../controllers/doctorController';
import { authMiddleware } from '../middleware/auth';
import { requireRoles } from '../middleware/rbac';
import { logAudit } from '../middleware/audit';

const router = Router();

router.use(authMiddleware);
router.use(requireRoles('DOCTOR', 'ADMIN'));

router.get('/patients', doctorController.getPatients);
router.get('/patients/search', doctorController.searchPatients);
router.get('/patients/:patientId', doctorController.getPatientDetail);

router.post(
  '/followups',
  logAudit('FOLLOW_UP_CREATED', 'FollowUpAction'),
  doctorController.addFollowUp
);

router.put(
  '/followups/:id/resolve',
  logAudit('FOLLOW_UP_RESOLVED', 'FollowUpAction'),
  doctorController.resolveFollowUp
);

export default router;
