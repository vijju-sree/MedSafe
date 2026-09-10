import { Router } from 'express';
import { prescriptionController } from '../controllers/prescriptionController';
import { authMiddleware } from '../middleware/auth';
import { requireRoles } from '../middleware/rbac';
import { logAudit } from '../middleware/audit';

const router = Router();

router.use(authMiddleware);

router.get('/patient/:patientId', prescriptionController.getPrescriptions);

router.post(
  '/',
  requireRoles('DOCTOR', 'ADMIN'),
  logAudit('PRESCRIPTION_ISSUED', 'Prescription'),
  prescriptionController.createPrescription
);

router.put(
  '/:id/renew',
  requireRoles('DOCTOR', 'ADMIN'),
  logAudit('PRESCRIPTION_RENEWED', 'Prescription'),
  prescriptionController.renewPrescription
);

export default router;
