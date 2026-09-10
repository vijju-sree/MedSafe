import { Router } from 'express';
import { authController } from '../controllers/authController';
import { authMiddleware } from '../middleware/auth';
import { logAudit } from '../middleware/audit';

const router = Router();

router.post('/login', logAudit('USER_LOGIN', 'User'), authController.login);
router.post('/register-patient', logAudit('PATIENT_REGISTERED', 'Patient'), authController.registerPatient);
router.post('/register-professional', logAudit('PROFESSIONAL_REGISTERED', 'User'), authController.registerProfessional);
router.post('/demo-switch', logAudit('DEMO_ROLE_SWITCH', 'User'), authController.demoSwitch);
router.get('/me', authMiddleware, authController.getCurrentUser);

export default router;
