import { Router } from 'express';
import { consultationController } from '../controllers/consultationController';
import { authMiddleware } from '../middleware/auth';
import { requireRoles } from '../middleware/rbac';
import { logAudit } from '../middleware/audit';

const router = Router();

// Public doctor discovery search does not require auth
router.get('/search-doctors', consultationController.searchDoctors);

router.use(authMiddleware);

// Patient routes
router.post(
  '/request',
  requireRoles('PATIENT', 'ADMIN'),
  logAudit('CONSULTATION_REQUEST_SUBMITTED', 'ConsultationRequest'),
  consultationController.requestConsultation
);

router.get('/patient/:patientId', consultationController.getPatientConsultations);
router.get('/patient/:patientId/my-doctors', consultationController.getMyDoctors);
router.get('/patient/:patientId/my-clinics', consultationController.getMyClinics);

// Doctor routes
router.get(
  '/doctor/requests',
  requireRoles('DOCTOR', 'ADMIN'),
  consultationController.getDoctorRequests
);

router.put(
  '/:id/respond',
  requireRoles('DOCTOR', 'ADMIN'),
  logAudit('CONSULTATION_REQUEST_RESPONDED', 'ConsultationRequest'),
  consultationController.respondToRequest
);

export default router;
