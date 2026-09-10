import { Router } from 'express';
import { adherenceController } from '../controllers/adherenceController';
import { authMiddleware } from '../middleware/auth';
import { logAudit } from '../middleware/audit';

const router = Router();

router.use(authMiddleware);

router.post(
  '/taken',
  logAudit('DOSE_TAKEN_RECORDED', 'MedicationSchedule'),
  adherenceController.recordTaken
);

router.post(
  '/missed',
  logAudit('DOSE_MISSED_RECORDED', 'MedicationSchedule'),
  adherenceController.recordMissed
);

router.post(
  '/skipped',
  logAudit('DOSE_SKIPPED_RECORDED', 'MedicationSchedule'),
  adherenceController.recordSkipped
);

router.post(
  '/record-skipped',
  logAudit('DOSE_SKIPPED_RECORDED', 'MedicationSchedule'),
  adherenceController.recordSkipped
);

router.get(
  '/:patientId',
  adherenceController.getAnalytics
);

export default router;
