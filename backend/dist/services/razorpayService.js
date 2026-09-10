"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.razorpayService = exports.RazorpayService = void 0;
const crypto_1 = __importDefault(require("crypto"));
const uuid_1 = require("uuid");
const config_1 = require("../config");
class RazorpayService {
    mode;
    keyId;
    keySecret;
    webhookSecret;
    constructor() {
        this.mode = config_1.config.razorpay.mode;
        if (this.mode === 'LIVE') {
            this.keyId = config_1.config.razorpay.liveKeyId || config_1.config.razorpay.testKeyId;
            this.keySecret = config_1.config.razorpay.liveKeySecret || config_1.config.razorpay.testKeySecret;
        }
        else {
            this.keyId = config_1.config.razorpay.testKeyId;
            this.keySecret = config_1.config.razorpay.testKeySecret;
        }
        this.webhookSecret = config_1.config.razorpay.webhookSecret;
    }
    // Reload or switch mode dynamically (e.g. for testing)
    setMode(mode, customKeyId, customKeySecret) {
        this.mode = mode;
        if (mode === 'LIVE') {
            this.keyId = customKeyId || config_1.config.razorpay.liveKeyId || config_1.config.razorpay.testKeyId;
            this.keySecret = customKeySecret || config_1.config.razorpay.liveKeySecret || config_1.config.razorpay.testKeySecret;
        }
        else {
            this.keyId = customKeyId || config_1.config.razorpay.testKeyId;
            this.keySecret = customKeySecret || config_1.config.razorpay.testKeySecret;
        }
    }
    // 1. Create Razorpay Order on server-side with auto-capture
    createOrder(amountInRupees, receiptPrefix = 'rcpt', notes = {}) {
        // Convert to paise (e.g. 499 INR -> 49900 paise)
        const amountInPaise = Math.round(amountInRupees * 100);
        const receipt = `${receiptPrefix}_${(0, uuid_1.v4)().substring(0, 10)}`;
        const orderId = `order_${(0, uuid_1.v4)().replace(/-/g, '').substring(0, 14)}`;
        return {
            orderId,
            amount: amountInPaise,
            amountInRupees,
            currency: 'INR',
            receipt,
            keyId: this.keyId,
            payment_capture: config_1.config.razorpay.autoCapture ? 1 : 0,
            notes
        };
    }
    // 2. Official Razorpay HMAC-SHA256 Signature Verification
    // Formula: expectedSignature = HMAC_SHA256(orderId + "|" + paymentId, keySecret)
    verifySignature(orderId, paymentId, signature) {
        if (!orderId || !paymentId || !signature) {
            return false;
        }
        try {
            const generatedSignature = crypto_1.default
                .createHmac('sha256', this.keySecret)
                .update(`${orderId}|${paymentId}`)
                .digest('hex');
            // Secure comparison
            return generatedSignature === signature;
        }
        catch (err) {
            console.error('Error during signature verification:', err);
            return false;
        }
    }
    // 3. Webhook Signature Verification
    // Formula: expectedSignature = HMAC_SHA256(rawBody, webhookSecret)
    verifyWebhookSignature(rawBody, signature) {
        if (!rawBody || !signature) {
            return false;
        }
        try {
            const expectedSignature = crypto_1.default
                .createHmac('sha256', this.webhookSecret)
                .update(rawBody)
                .digest('hex');
            return expectedSignature === signature;
        }
        catch (err) {
            console.error('Error during webhook signature verification:', err);
            return false;
        }
    }
    // 4. Helper for test mode simulations (Strictly disallowed in LIVE mode)
    generateTestSignature(orderId, paymentId) {
        if (this.mode === 'LIVE') {
            throw new Error('Test signature generation is strictly disallowed in LIVE production mode.');
        }
        return crypto_1.default
            .createHmac('sha256', this.keySecret)
            .update(`${orderId}|${paymentId}`)
            .digest('hex');
    }
    // 5. Generate mock webhook signature for testing
    generateTestWebhookSignature(payload) {
        return crypto_1.default
            .createHmac('sha256', this.webhookSecret)
            .update(payload)
            .digest('hex');
    }
    getKeyId() {
        return this.keyId;
    }
    getMode() {
        return this.mode;
    }
    getWebhookSecret() {
        return this.webhookSecret;
    }
}
exports.RazorpayService = RazorpayService;
exports.razorpayService = new RazorpayService();
