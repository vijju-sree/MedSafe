import { Router } from 'express';
import { reportController } from '../controllers/reportController';
import { authMiddleware } from '../middleware/auth';
import { logAudit } from '../middleware/audit';

const router = Router();

router.post('/upload', authMiddleware, logAudit('REPORT_UPLOADED', 'MedicalReport'), reportController.uploadReport);
router.get('/patient/:patientId', authMiddleware, reportController.getPatientReports);
router.get('/:id/download', authMiddleware, logAudit('REPORT_DOWNLOADED', 'MedicalReport'), reportController.downloadReport);
router.get('/:id', authMiddleware, reportController.getReportById);
router.get('/', authMiddleware, reportController.getAllReports);

export default router;
