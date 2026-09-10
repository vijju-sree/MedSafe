import { Router } from 'express';
import { caregiverController } from '../controllers/caregiverController';
import { authMiddleware } from '../middleware/auth';
import { requireRoles } from '../middleware/rbac';

const router = Router();

router.use(authMiddleware);
router.use(requireRoles('CAREGIVER', 'ADMIN'));

router.get('/patients', caregiverController.getAuthorizedPatients);
router.get('/patients/:patientId', caregiverController.getPatientOverview);

export default router;
