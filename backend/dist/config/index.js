"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.config = void 0;
const path_1 = __importDefault(require("path"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
exports.config = {
    port: parseInt(process.env.PORT || '5000', 10),
    jwtSecret: process.env.JWT_SECRET || 'medsafe-super-secret-jwt-key-2026',
    jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
    gracePeriodMinutes: parseInt(process.env.GRACE_PERIOD_MINUTES || '30', 10),
    reminderCheckIntervalSeconds: parseInt(process.env.REMINDER_INTERVAL_SECONDS || '15', 10),
    dataDir: process.env.DATA_DIR || path_1.default.resolve(__dirname, '../../data'),
    email: {
        host: process.env.EMAIL_HOST || '',
        port: parseInt(process.env.EMAIL_PORT || '587', 10),
        user: process.env.EMAIL_USER || '',
        pass: process.env.EMAIL_PASSWORD || '',
        from: process.env.EMAIL_FROM || 'MedSafe Alerts <alerts@medsafe.local>',
    },
    razorpay: {
        mode: (process.env.RAZORPAY_MODE || 'TEST').toUpperCase(),
        testKeyId: process.env.RAZORPAY_TEST_KEY_ID || process.env.RAZORPAY_KEY_ID || 'rzp_test_MedSafeDemoKey123',
        testKeySecret: process.env.RAZORPAY_TEST_KEY_SECRET || process.env.RAZORPAY_KEY_SECRET || 'MedSafeSecretKey2026TestMode',
        liveKeyId: process.env.RAZORPAY_LIVE_KEY_ID || '',
        liveKeySecret: process.env.RAZORPAY_LIVE_KEY_SECRET || '',
        webhookSecret: process.env.RAZORPAY_WEBHOOK_SECRET || 'MedSafeWebhookSecret2026',
        autoCapture: process.env.RAZORPAY_AUTO_CAPTURE !== 'false'
    }
};
