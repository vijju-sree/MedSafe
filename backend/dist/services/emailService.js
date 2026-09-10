"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.emailService = void 0;
const nodemailer_1 = __importDefault(require("nodemailer"));
const config_1 = require("../config");
class EmailService {
    transporter = null;
    isConfigured = false;
    constructor() {
        if (config_1.config.email.host && config_1.config.email.user && config_1.config.email.pass) {
            this.transporter = nodemailer_1.default.createTransport({
                host: config_1.config.email.host,
                port: config_1.config.email.port,
                secure: config_1.config.email.port === 465,
                auth: {
                    user: config_1.config.email.user,
                    pass: config_1.config.email.pass,
                },
            });
            this.isConfigured = true;
            console.log('EmailService configured with external SMTP host:', config_1.config.email.host);
        }
        else {
            console.log('EmailService running in Development/Mock mode. Emails will be logged to console.');
        }
    }
    async sendEmail(options) {
        const from = config_1.config.email.from;
        const formattedHtml = options.html || `
      <div style="font-family: Arial, sans-serif; padding: 20px; color: #1e293b;">
        <div style="background-color: #0284c7; color: white; padding: 15px; border-radius: 8px 8px 0 0;">
          <h2 style="margin: 0;">MedSafe Health Notification</h2>
        </div>
        <div style="border: 1px solid #e2e8f0; border-top: none; padding: 20px; border-radius: 0 0 8px 8px;">
          <p style="font-size: 16px; line-height: 1.5;">${options.text.replace(/\n/g, '<br/>')}</p>
          <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
          <p style="font-size: 12px; color: #64748b;">
            <strong>Safety Disclaimer:</strong> This communication is an automated adherence support notification, not a medical diagnosis or treatment directive. Never alter medication doses without consulting your prescribing physician or licensed pharmacist.
          </p>
        </div>
      </div>
    `;
        if (this.isConfigured && this.transporter) {
            try {
                await this.transporter.sendMail({
                    from,
                    to: options.to,
                    subject: options.subject,
                    text: options.text,
                    html: formattedHtml,
                });
                console.log(`[Email Sent] To: ${options.to} | Subject: ${options.subject}`);
                return true;
            }
            catch (error) {
                console.error(`[Email Delivery Error] Failed to send email to ${options.to}:`, error);
                return false;
            }
        }
        else {
            console.log(`\n================= [MOCK EMAIL SERVICE] =================`);
            console.log(`To: ${options.to}`);
            console.log(`Subject: ${options.subject}`);
            console.log(`Body:\n${options.text}`);
            console.log(`=========================================================\n`);
            return true;
        }
    }
    async sendMedicationReminder(toEmail, patientName, medicationName, time, instructions) {
        return this.sendEmail({
            to: toEmail,
            subject: `MedSafe Reminder: Time for ${medicationName}`,
            text: `Hello ${patientName},\n\nIt is time for your scheduled medication:\n- Medicine: ${medicationName}\n- Scheduled Time: ${time}\n- Instructions: ${instructions}\n\nPlease mark the dose as Taken in your MedSafe portal once completed.`
        });
    }
    async sendMissedDoseAlert(toEmail, recipientName, patientName, medicationName, scheduledTime) {
        return this.sendEmail({
            to: toEmail,
            subject: `MedSafe Alert: Missed Dose Recorded for ${patientName}`,
            text: `Hello ${recipientName},\n\nA scheduled dose was not recorded within the grace window:\n- Patient: ${patientName}\n- Medication: ${medicationName}\n- Scheduled Time: ${scheduledTime}\n\nImportant: Do not take an extra dose unless explicitly instructed by your physician. Contact your healthcare professional if you are unsure how to proceed.`
        });
    }
    async sendPrescriptionRenewalReminder(toEmail, patientName, rxNumber, expiryDate, doctorName) {
        return this.sendEmail({
            to: toEmail,
            subject: `MedSafe Alert: Prescription ${rxNumber} Renewal Due Soon`,
            text: `Hello ${patientName},\n\nYour prescription ${rxNumber} issued by Dr. ${doctorName} is expiring on ${expiryDate}.\n\nPlease contact your healthcare provider or clinic to review your ongoing treatment plan and renew your prescription.`
        });
    }
}
exports.emailService = new EmailService();
