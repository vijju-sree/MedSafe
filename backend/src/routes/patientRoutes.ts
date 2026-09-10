import { Router } from 'express';
import { patientController } from '../controllers/patientController';
import { authMiddleware } from '../middleware/auth';
import { authorizePatientAccess, requireRoles } from '../middleware/rbac';
import { logAudit } from '../middleware/audit';

const router = Router();

router.use(authMiddleware);

router.get(
  '/:patientId/dashboard',
  authorizePatientAccess('patientId'),
  patientController.getDashboard
);

router.get(
  '/:patientId/schedule',
  authorizePatientAccess('patientId'),
  patientController.getSchedule
);

router.get(
  '/:patientId/caregivers',
  authorizePatientAccess('patientId'),
  patientController.getCaregivers
);

router.post(
  '/:patientId/caregivers',
  authorizePatientAccess('patientId'),
  requireRoles('PATIENT', 'ADMIN'),
  logAudit('CAREGIVER_ACCESS_GRANTED', 'Consent'),
  patientController.addCaregiver
);

router.delete(
  '/:patientId/caregivers/:consentId',
  authorizePatientAccess('patientId'),
  requireRoles('PATIENT', 'ADMIN'),
  logAudit('CAREGIVER_ACCESS_REVOKED', 'Consent'),
  patientController.revokeCaregiver
);

router.get(
  '/:patientId/notifications',
  authorizePatientAccess('patientId'),
  patientController.getNotifications
);

router.put(
  '/:patientId/notifications/read-all',
  authorizePatientAccess('patientId'),
  patientController.markAllNotificationsRead
);

router.put(
  '/:patientId/notifications/:id/read',
  authorizePatientAccess('patientId'),
  patientController.markNotificationRead
);

router.delete(
  '/:patientId/notifications/clear-all',
  authorizePatientAccess('patientId'),
  patientController.clearAllNotifications
);

router.delete(
  '/:patientId/notifications/:id',
  authorizePatientAccess('patientId'),
  patientController.clearNotification
);

router.get(
  '/:patientId/follow-ups',
  authorizePatientAccess('patientId'),
  patientController.getFollowUps
);

router.put(
  '/:patientId/follow-ups/:id/status',
  authorizePatientAccess('patientId'),
  patientController.updateFollowUpStatus
);

router.post(
  '/:patientId/medications/:medicationId/refill',
  authorizePatientAccess('patientId'),
  (req, res) => {
    req.body = { ...req.body, medicationId: req.params.medicationId };
    return patientController.requestRefill(req, res);
  }
);

router.get(
  '/:patientId/supplies',
  authorizePatientAccess('patientId'),
  patientController.getSupplies
);

router.get(
  '/:patientId/refills',
  authorizePatientAccess('patientId'),
  patientController.getRefills
);

router.post(
  '/:patientId/refills',
  authorizePatientAccess('patientId'),
  patientController.requestRefill
);

export default router;

