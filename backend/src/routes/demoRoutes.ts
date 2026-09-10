import { Router } from 'express';
import { demoController } from '../controllers/demoController';

const router = Router();

// Test triggers do not require strict role barriers so evaluators can test from any screen
router.post('/trigger-reminder', demoController.triggerTestReminder);
router.post('/simulate-missed', demoController.simulateMissedDose);
router.post('/simulate-conflict', demoController.simulateSafetyConflict);
router.post('/reset-database', demoController.resetDatabase);

export default router;
