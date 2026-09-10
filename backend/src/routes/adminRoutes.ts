import { Router } from 'express';
import { adminController } from '../controllers/adminController';
import { authMiddleware } from '../middleware/auth';
import { requireRoles } from '../middleware/rbac';
import { logAudit } from '../middleware/audit';

const router = Router();

router.use(authMiddleware);
router.use(requireRoles('ADMIN'));

router.get('/metrics', adminController.getSystemMetrics);
router.get('/users', adminController.getUsers);
router.get('/audit-logs', adminController.getAuditLogs);
router.get('/drug-references', adminController.getDrugReferences);

router.post(
  '/drug-references',
  logAudit('DRUG_REFERENCE_CREATED', 'MedicationReference'),
  adminController.addDrugReference
);

router.get('/organizations', adminController.getOrganizations);
router.get('/verifications', adminController.getVerifications);
router.put('/verifications', logAudit('VERIFICATION_STATUS_CHANGED', 'User'), adminController.updateVerification);
router.get('/diagnostic-orders', adminController.getDiagnosticOrders);
router.get('/billing-summary', adminController.getBillingSummary);

router.get('/licenses', adminController.getLicenses);
router.post('/licenses', adminController.assignLicense);
router.put('/licenses/:id', adminController.updateLicenseStatus);
router.get('/usage', adminController.getUsage);
router.post('/usage/record', adminController.recordUsage);

export default router;
