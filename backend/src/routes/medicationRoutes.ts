import { Router } from 'express';
import { medicationController } from '../controllers/medicationController';
import { authMiddleware } from '../middleware/auth';
import { requireRoles } from '../middleware/rbac';
import { logAudit } from '../middleware/audit';

const router = Router();

router.use(authMiddleware);

router.get('/', medicationController.getMedications);
router.get('/patient/:patientId', medicationController.getMedications);
router.get('/:id', medicationController.getMedicationById);

// Doctors and Admins can add or modify medications
router.post(
  '/',
  requireRoles('DOCTOR', 'ADMIN'),
  logAudit('MEDICATION_CREATED', 'Medication'),
  medicationController.addMedication
);

router.put(
  '/:id',
  requireRoles('DOCTOR', 'ADMIN'),
  logAudit('MEDICATION_PLAN_UPDATED', 'Medication'),
  medicationController.updateMedicationPlan
);

router.post(
  '/:id/discontinue',
  requireRoles('DOCTOR', 'ADMIN'),
  logAudit('MEDICATION_DISCONTINUED', 'Medication'),
  medicationController.discontinueMedication
);

export default router;
