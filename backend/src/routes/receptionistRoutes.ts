import { Router } from 'express';
import { receptionistController } from '../controllers/receptionistController';
import { authMiddleware } from '../middleware/auth';
import { requireRoles } from '../middleware/rbac';
import { logAudit } from '../middleware/audit';

const router = Router();

router.use(authMiddleware);

// Only Receptionists and Admins can access hospital reception endpoints
router.use(requireRoles('RECEPTIONIST', 'ADMIN'));

// Dashboard overview
router.get('/dashboard', receptionistController.getDashboard);

// Patient connection requests queue
router.get('/requests', receptionistController.getRequests);
router.put(
  '/requests/:id/respond',
  logAudit('RECEPTIONIST_REQUEST_RESPONDED', 'ConsultationRequest'),
  receptionistController.respondToRequest
);

// Hospital Patients Directory
router.get('/patients', receptionistController.getHospitalPatients);
router.get('/patients/search-global', receptionistController.searchGlobalPatient);
router.post(
  '/patients/link',
  logAudit('RECEPTIONIST_PATIENT_LINKED', 'PatientHospitalRelationship'),
  receptionistController.linkPatient
);
router.get('/patients/:patientId', receptionistController.getPatientDetail);

// Reports for Hospital Patients (Read-Only)
router.get('/reports', receptionistController.getHospitalReports);
router.get(
  '/reports/:id',
  logAudit('REPORT_VIEWED_RECEPTIONIST', 'MedicalReport'),
  receptionistController.getHospitalReportDetail
);

// Hospital Doctors
router.get('/doctors', receptionistController.getHospitalDoctors);

export default router;
