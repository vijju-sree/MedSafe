"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const demoController_1 = require("../controllers/demoController");
const router = (0, express_1.Router)();
// Test triggers do not require strict role barriers so evaluators can test from any screen
router.post('/trigger-reminder', demoController_1.demoController.triggerTestReminder);
router.post('/simulate-missed', demoController_1.demoController.simulateMissedDose);
router.post('/simulate-conflict', demoController_1.demoController.simulateSafetyConflict);
router.post('/reset-database', demoController_1.demoController.resetDatabase);
exports.default = router;
