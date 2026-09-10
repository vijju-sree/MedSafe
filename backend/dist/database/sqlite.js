"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sqliteDb = exports.SQLiteDatabase = void 0;
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const sqlite3_1 = __importDefault(require("sqlite3"));
const config_1 = require("../config");
// Ensure data directory exists
if (!fs_1.default.existsSync(config_1.config.dataDir)) {
    fs_1.default.mkdirSync(config_1.config.dataDir, { recursive: true });
}
const dbPath = path_1.default.join(config_1.config.dataDir, 'medsafe.db');
class SQLiteDatabase {
    db;
    constructor() {
        this.db = new sqlite3_1.default.Database(dbPath, (err) => {
            if (err) {
                console.error('Failed to open SQLite database:', err.message);
            }
            else {
                console.log(`Connected to SQLite database at ${dbPath}`);
                this.initializeTables();
            }
        });
    }
    initializeTables() {
        this.db.serialize(() => {
            // 1. Subscription Payments Table
            this.db.run(`
        CREATE TABLE IF NOT EXISTS subscription_payments (
          id TEXT PRIMARY KEY,
          subscriptionPaymentId TEXT UNIQUE NOT NULL,
          userId TEXT NOT NULL,
          patientId TEXT,
          subscriptionId TEXT NOT NULL,
          planId TEXT NOT NULL,
          planName TEXT,
          amount REAL NOT NULL,
          currency TEXT NOT NULL DEFAULT 'INR',
          razorpayOrderId TEXT UNIQUE NOT NULL,
          razorpayPaymentId TEXT UNIQUE NOT NULL,
          razorpaySignature TEXT,
          status TEXT NOT NULL,
          paymentMethod TEXT DEFAULT 'Razorpay',
          createdAt TEXT NOT NULL,
          paidAt TEXT
        )
      `);
            // 2. Healthcare Bill Payments Table
            this.db.run(`
        CREATE TABLE IF NOT EXISTS bill_payments (
          id TEXT PRIMARY KEY,
          billPaymentId TEXT UNIQUE NOT NULL,
          billId TEXT NOT NULL,
          patientId TEXT NOT NULL,
          organizationId TEXT,
          amount REAL NOT NULL,
          currency TEXT NOT NULL DEFAULT 'INR',
          razorpayOrderId TEXT UNIQUE NOT NULL,
          razorpayPaymentId TEXT UNIQUE NOT NULL,
          razorpaySignature TEXT,
          status TEXT NOT NULL,
          paymentMethod TEXT DEFAULT 'Razorpay',
          createdAt TEXT NOT NULL,
          paidAt TEXT
        )
      `);
            // 3. Subscriptions Table
            this.db.run(`
        CREATE TABLE IF NOT EXISTS subscriptions (
          id TEXT PRIMARY KEY,
          subscriptionId TEXT UNIQUE NOT NULL,
          userId TEXT,
          patientId TEXT,
          organizationId TEXT,
          planId TEXT NOT NULL,
          planName TEXT NOT NULL,
          price REAL NOT NULL,
          billingCycle TEXT NOT NULL,
          startDate TEXT NOT NULL,
          endDate TEXT NOT NULL,
          renewalDate TEXT,
          status TEXT NOT NULL,
          autoRenew INTEGER DEFAULT 1,
          razorpayPaymentId TEXT,
          familyMembersLimit INTEGER DEFAULT 0,
          familyMembersCount INTEGER DEFAULT 0,
          createdAt TEXT NOT NULL,
          updatedAt TEXT NOT NULL
        )
      `);
            // 4. Family Members Table
            this.db.run(`
        CREATE TABLE IF NOT EXISTS family_members (
          id TEXT PRIMARY KEY,
          subscriptionId TEXT NOT NULL,
          primaryPatientId TEXT NOT NULL,
          name TEXT NOT NULL,
          relationship TEXT NOT NULL,
          phone TEXT,
          email TEXT,
          addedAt TEXT NOT NULL
        )
      `);
            // 5. Bills Table
            this.db.run(`
        CREATE TABLE IF NOT EXISTS bills (
          id TEXT PRIMARY KEY,
          billId TEXT UNIQUE NOT NULL,
          patientId TEXT NOT NULL,
          patientName TEXT,
          clinicId TEXT,
          clinicName TEXT,
          labId TEXT,
          labName TEXT,
          doctorId TEXT,
          doctorName TEXT,
          testName TEXT,
          amount REAL NOT NULL,
          status TEXT NOT NULL,
          billDate TEXT NOT NULL,
          dueDate TEXT NOT NULL,
          paidAt TEXT,
          paymentReference TEXT
        )
      `);
            // 6. Organization Licensing & Usage Payments Table
            this.db.run(`
        CREATE TABLE IF NOT EXISTS organization_payments (
          id TEXT PRIMARY KEY,
          organizationPaymentId TEXT UNIQUE NOT NULL,
          organizationId TEXT NOT NULL,
          organizationName TEXT,
          paymentType TEXT NOT NULL,
          referenceId TEXT NOT NULL,
          amount REAL NOT NULL,
          currency TEXT NOT NULL DEFAULT 'INR',
          razorpayOrderId TEXT UNIQUE NOT NULL,
          razorpayPaymentId TEXT UNIQUE NOT NULL,
          razorpaySignature TEXT,
          status TEXT NOT NULL,
          paymentMethod TEXT DEFAULT 'Razorpay',
          createdAt TEXT NOT NULL,
          paidAt TEXT
        )
      `);
            // 7. Razorpay Webhook Events Audit Table
            this.db.run(`
        CREATE TABLE IF NOT EXISTS webhook_events (
          id TEXT PRIMARY KEY,
          eventId TEXT UNIQUE,
          eventType TEXT NOT NULL,
          entityId TEXT NOT NULL,
          payload TEXT NOT NULL,
          status TEXT NOT NULL,
          createdAt TEXT NOT NULL
        )
      `);
        });
    }
    // --- Subscription Payments ---
    insertSubscriptionPayment(payment) {
        return new Promise((resolve, reject) => {
            const sql = `
        INSERT INTO subscription_payments (
          id, subscriptionPaymentId, userId, patientId, subscriptionId, planId,
          planName, amount, currency, razorpayOrderId, razorpayPaymentId,
          razorpaySignature, status, paymentMethod, createdAt, paidAt
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;
            this.db.run(sql, [
                payment.id,
                payment.subscriptionPaymentId,
                payment.userId,
                payment.patientId || null,
                payment.subscriptionId,
                payment.planId,
                payment.planName || '',
                payment.amount,
                payment.currency || 'INR',
                payment.razorpayOrderId,
                payment.razorpayPaymentId,
                payment.razorpaySignature || '',
                payment.status,
                payment.paymentMethod || 'Razorpay',
                payment.createdAt,
                payment.paidAt || null
            ], (err) => {
                if (err)
                    reject(err);
                else
                    resolve();
            });
        });
    }
    getSubscriptionPaymentByOrderId(orderId) {
        return new Promise((resolve, reject) => {
            this.db.get(`SELECT * FROM subscription_payments WHERE razorpayOrderId = ?`, [orderId], (err, row) => {
                if (err)
                    reject(err);
                else
                    resolve(row || null);
            });
        });
    }
    getSubscriptionPaymentByPaymentId(paymentId) {
        return new Promise((resolve, reject) => {
            this.db.get(`SELECT * FROM subscription_payments WHERE razorpayPaymentId = ?`, [paymentId], (err, row) => {
                if (err)
                    reject(err);
                else
                    resolve(row || null);
            });
        });
    }
    getSubscriptionPayments(patientId) {
        return new Promise((resolve, reject) => {
            const sql = patientId
                ? `SELECT * FROM subscription_payments WHERE patientId = ? OR userId = ? ORDER BY createdAt DESC`
                : `SELECT * FROM subscription_payments ORDER BY createdAt DESC`;
            const params = patientId ? [patientId, patientId] : [];
            this.db.all(sql, params, (err, rows) => {
                if (err)
                    reject(err);
                else
                    resolve(rows || []);
            });
        });
    }
    // --- Healthcare Bill Payments ---
    insertBillPayment(payment) {
        return new Promise((resolve, reject) => {
            const sql = `
        INSERT INTO bill_payments (
          id, billPaymentId, billId, patientId, organizationId, amount,
          currency, razorpayOrderId, razorpayPaymentId, razorpaySignature,
          status, paymentMethod, createdAt, paidAt
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;
            this.db.run(sql, [
                payment.id,
                payment.billPaymentId,
                payment.billId,
                payment.patientId,
                payment.organizationId || null,
                payment.amount,
                payment.currency || 'INR',
                payment.razorpayOrderId,
                payment.razorpayPaymentId,
                payment.razorpaySignature || '',
                payment.status,
                payment.paymentMethod || 'Razorpay',
                payment.createdAt,
                payment.paidAt || null
            ], (err) => {
                if (err)
                    reject(err);
                else
                    resolve();
            });
        });
    }
    getBillPaymentByOrderId(orderId) {
        return new Promise((resolve, reject) => {
            this.db.get(`SELECT * FROM bill_payments WHERE razorpayOrderId = ?`, [orderId], (err, row) => {
                if (err)
                    reject(err);
                else
                    resolve(row || null);
            });
        });
    }
    getBillPaymentByPaymentId(paymentId) {
        return new Promise((resolve, reject) => {
            this.db.get(`SELECT * FROM bill_payments WHERE razorpayPaymentId = ?`, [paymentId], (err, row) => {
                if (err)
                    reject(err);
                else
                    resolve(row || null);
            });
        });
    }
    getBillPayments(patientId) {
        return new Promise((resolve, reject) => {
            const sql = patientId
                ? `SELECT * FROM bill_payments WHERE patientId = ? ORDER BY createdAt DESC`
                : `SELECT * FROM bill_payments ORDER BY createdAt DESC`;
            const params = patientId ? [patientId] : [];
            this.db.all(sql, params, (err, rows) => {
                if (err)
                    reject(err);
                else
                    resolve(rows || []);
            });
        });
    }
    // --- Subscriptions in SQLite ---
    upsertSubscription(sub) {
        return new Promise((resolve, reject) => {
            const sql = `
        INSERT INTO subscriptions (
          id, subscriptionId, userId, patientId, organizationId, planId,
          planName, price, billingCycle, startDate, endDate, renewalDate,
          status, autoRenew, razorpayPaymentId, familyMembersLimit, familyMembersCount,
          createdAt, updatedAt
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(subscriptionId) DO UPDATE SET
          planId=excluded.planId,
          planName=excluded.planName,
          price=excluded.price,
          billingCycle=excluded.billingCycle,
          startDate=excluded.startDate,
          endDate=excluded.endDate,
          renewalDate=excluded.renewalDate,
          status=excluded.status,
          autoRenew=excluded.autoRenew,
          razorpayPaymentId=excluded.razorpayPaymentId,
          familyMembersLimit=excluded.familyMembersLimit,
          familyMembersCount=excluded.familyMembersCount,
          updatedAt=excluded.updatedAt
      `;
            this.db.run(sql, [
                sub.id,
                sub.subscriptionId,
                sub.userId || null,
                sub.patientId || null,
                sub.organizationId || null,
                sub.planId,
                sub.planName,
                sub.price,
                sub.billingCycle,
                sub.startDate,
                sub.endDate,
                sub.renewalDate || null,
                sub.status,
                sub.autoRenew ? 1 : 0,
                sub.razorpayPaymentId || null,
                sub.familyMembersLimit || 0,
                sub.familyMembersCount || 0,
                sub.createdAt,
                sub.updatedAt
            ], (err) => {
                if (err)
                    reject(err);
                else
                    resolve();
            });
        });
    }
    getSubscription(patientId) {
        return new Promise((resolve, reject) => {
            this.db.get(`SELECT * FROM subscriptions WHERE patientId = ? OR userId = ? ORDER BY updatedAt DESC LIMIT 1`, [patientId, patientId], (err, row) => {
                if (err)
                    reject(err);
                else
                    resolve(row || null);
            });
        });
    }
    // --- Family Members in SQLite ---
    addFamilyMember(member) {
        return new Promise((resolve, reject) => {
            const sql = `
        INSERT INTO family_members (id, subscriptionId, primaryPatientId, name, relationship, phone, email, addedAt)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `;
            this.db.run(sql, [
                member.id,
                member.subscriptionId,
                member.primaryPatientId,
                member.name,
                member.relationship,
                member.phone || null,
                member.email || null,
                member.addedAt
            ], (err) => {
                if (err)
                    reject(err);
                else {
                    // Increment familyMembersCount on subscription
                    this.db.run(`UPDATE subscriptions SET familyMembersCount = familyMembersCount + 1 WHERE subscriptionId = ?`, [member.subscriptionId], () => resolve());
                }
            });
        });
    }
    getFamilyMembers(subscriptionIdOrPatientId) {
        return new Promise((resolve, reject) => {
            this.db.all(`SELECT * FROM family_members WHERE subscriptionId = ? OR primaryPatientId = ? ORDER BY addedAt ASC`, [subscriptionIdOrPatientId, subscriptionIdOrPatientId], (err, rows) => {
                if (err)
                    reject(err);
                else
                    resolve(rows || []);
            });
        });
    }
    // --- Organization Payments ---
    insertOrganizationPayment(payment) {
        return new Promise((resolve, reject) => {
            const sql = `
        INSERT INTO organization_payments (
          id, organizationPaymentId, organizationId, organizationName, paymentType,
          referenceId, amount, currency, razorpayOrderId, razorpayPaymentId,
          razorpaySignature, status, paymentMethod, createdAt, paidAt
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;
            this.db.run(sql, [
                payment.id,
                payment.organizationPaymentId,
                payment.organizationId,
                payment.organizationName || null,
                payment.paymentType,
                payment.referenceId,
                payment.amount,
                payment.currency || 'INR',
                payment.razorpayOrderId,
                payment.razorpayPaymentId,
                payment.razorpaySignature,
                payment.status,
                payment.paymentMethod || 'Razorpay',
                payment.createdAt,
                payment.paidAt || null
            ], (err) => {
                if (err)
                    reject(err);
                else
                    resolve();
            });
        });
    }
    getOrganizationPaymentByPaymentId(paymentId) {
        return new Promise((resolve, reject) => {
            this.db.get(`SELECT * FROM organization_payments WHERE razorpayPaymentId = ?`, [paymentId], (err, row) => {
                if (err)
                    reject(err);
                else
                    resolve(row || null);
            });
        });
    }
    getOrganizationPayments(organizationId) {
        return new Promise((resolve, reject) => {
            let query = `SELECT * FROM organization_payments`;
            const params = [];
            if (organizationId) {
                query += ` WHERE organizationId = ?`;
                params.push(organizationId);
            }
            query += ` ORDER BY createdAt DESC`;
            this.db.all(query, params, (err, rows) => {
                if (err)
                    reject(err);
                else
                    resolve(rows || []);
            });
        });
    }
    // --- Webhook Events ---
    recordWebhookEvent(event) {
        return new Promise((resolve, reject) => {
            const sql = `
        INSERT INTO webhook_events (id, eventId, eventType, entityId, payload, status, createdAt)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `;
            this.db.run(sql, [
                event.id,
                event.eventId,
                event.eventType,
                event.entityId,
                event.payload,
                event.status,
                event.createdAt
            ], (err) => {
                if (err)
                    reject(err);
                else
                    resolve();
            });
        });
    }
    hasWebhookEventBeenProcessed(eventId) {
        return new Promise((resolve, reject) => {
            this.db.get(`SELECT id FROM webhook_events WHERE eventId = ?`, [eventId], (err, row) => {
                if (err)
                    reject(err);
                else
                    resolve(!!row);
            });
        });
    }
    // Close connection
    close() {
        this.db.close();
    }
}
exports.SQLiteDatabase = SQLiteDatabase;
exports.sqliteDb = new SQLiteDatabase();
