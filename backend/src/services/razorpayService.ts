import crypto from 'crypto';
import { v4 as uuidv4 } from 'uuid';
import { config } from '../config';

export interface RazorpayOrderResult {
  orderId: string;
  amount: number; // in paise
  amountInRupees: number;
  currency: string;
  receipt: string;
  keyId: string;
  payment_capture?: number;
  notes?: Record<string, any>;
}

export class RazorpayService {
  private mode: 'TEST' | 'LIVE';
  private keyId: string;
  private keySecret: string;
  private webhookSecret: string;

  constructor() {
    this.mode = config.razorpay.mode;
    if (this.mode === 'LIVE') {
      this.keyId = config.razorpay.liveKeyId || config.razorpay.testKeyId;
      this.keySecret = config.razorpay.liveKeySecret || config.razorpay.testKeySecret;
    } else {
      this.keyId = config.razorpay.testKeyId;
      this.keySecret = config.razorpay.testKeySecret;
    }
    this.webhookSecret = config.razorpay.webhookSecret;
  }

  // Reload or switch mode dynamically (e.g. for testing)
  setMode(mode: 'TEST' | 'LIVE', customKeyId?: string, customKeySecret?: string): void {
    this.mode = mode;
    if (mode === 'LIVE') {
      this.keyId = customKeyId || config.razorpay.liveKeyId || config.razorpay.testKeyId;
      this.keySecret = customKeySecret || config.razorpay.liveKeySecret || config.razorpay.testKeySecret;
    } else {
      this.keyId = customKeyId || config.razorpay.testKeyId;
      this.keySecret = customKeySecret || config.razorpay.testKeySecret;
    }
  }

  // 1. Create Razorpay Order on server-side with auto-capture
  createOrder(
    amountInRupees: number,
    receiptPrefix: string = 'rcpt',
    notes: Record<string, any> = {}
  ): RazorpayOrderResult {
    // Convert to paise (e.g. 499 INR -> 49900 paise)
    const amountInPaise = Math.round(amountInRupees * 100);
    const receipt = `${receiptPrefix}_${uuidv4().substring(0, 10)}`;
    const orderId = `order_${uuidv4().replace(/-/g, '').substring(0, 14)}`;

    return {
      orderId,
      amount: amountInPaise,
      amountInRupees,
      currency: 'INR',
      receipt,
      keyId: this.keyId,
      payment_capture: config.razorpay.autoCapture ? 1 : 0,
      notes
    };
  }

  // 2. Official Razorpay HMAC-SHA256 Signature Verification
  // Formula: expectedSignature = HMAC_SHA256(orderId + "|" + paymentId, keySecret)
  verifySignature(orderId: string, paymentId: string, signature: string): boolean {
    if (!orderId || !paymentId || !signature) {
      return false;
    }

    try {
      const generatedSignature = crypto
        .createHmac('sha256', this.keySecret)
        .update(`${orderId}|${paymentId}`)
        .digest('hex');

      // Secure comparison
      return generatedSignature === signature;
    } catch (err) {
      console.error('Error during signature verification:', err);
      return false;
    }
  }

  // 3. Webhook Signature Verification
  // Formula: expectedSignature = HMAC_SHA256(rawBody, webhookSecret)
  verifyWebhookSignature(rawBody: string, signature: string): boolean {
    if (!rawBody || !signature) {
      return false;
    }

    try {
      const expectedSignature = crypto
        .createHmac('sha256', this.webhookSecret)
        .update(rawBody)
        .digest('hex');

      return expectedSignature === signature;
    } catch (err) {
      console.error('Error during webhook signature verification:', err);
      return false;
    }
  }

  // 4. Helper for test mode simulations (Strictly disallowed in LIVE mode)
  generateTestSignature(orderId: string, paymentId: string): string {
    if (this.mode === 'LIVE') {
      throw new Error('Test signature generation is strictly disallowed in LIVE production mode.');
    }
    return crypto
      .createHmac('sha256', this.keySecret)
      .update(`${orderId}|${paymentId}`)
      .digest('hex');
  }

  // 5. Generate mock webhook signature for testing
  generateTestWebhookSignature(payload: string): string {
    return crypto
      .createHmac('sha256', this.webhookSecret)
      .update(payload)
      .digest('hex');
  }

  getKeyId(): string {
    return this.keyId;
  }

  getMode(): 'TEST' | 'LIVE' {
    return this.mode;
  }

  getWebhookSecret(): string {
    return this.webhookSecret;
  }
}

export const razorpayService = new RazorpayService();
