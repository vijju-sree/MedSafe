import nodemailer from 'nodemailer';
import { config } from '../config';

interface EmailOptions {
  to: string;
  subject: string;
  text: string;
  html?: string;
}

class EmailService {
  private transporter: nodemailer.Transporter | null = null;
  private isConfigured: boolean = false;

  constructor() {
    if (config.email.host && config.email.user && config.email.pass) {
      this.transporter = nodemailer.createTransport({
        host: config.email.host,
        port: config.email.port,
        secure: config.email.port === 465,
        auth: {
          user: config.email.user,
          pass: config.email.pass,
        },
      });
      this.isConfigured = true;
      console.log('EmailService configured with external SMTP host:', config.email.host);
    } else {
      console.log('EmailService running in Development/Mock mode. Emails will be logged to console.');
    }
  }

  async sendEmail(options: EmailOptions): Promise<boolean> {
    const from = config.email.from;
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
      } catch (error) {
        console.error(`[Email Delivery Error] Failed to send email to ${options.to}:`, error);
        return false;
      }
    } else {
      console.log(`\n================= [MOCK EMAIL SERVICE] =================`);
      console.log(`To: ${options.to}`);
      console.log(`Subject: ${options.subject}`);
      console.log(`Body:\n${options.text}`);
      console.log(`=========================================================\n`);
      return true;
    }
  }

  async sendMedicationReminder(toEmail: string, patientName: string, medicationName: string, time: string, instructions: string): Promise<boolean> {
    return this.sendEmail({
      to: toEmail,
      subject: `MedSafe Reminder: Time for ${medicationName}`,
      text: `Hello ${patientName},\n\nIt is time for your scheduled medication:\n- Medicine: ${medicationName}\n- Scheduled Time: ${time}\n- Instructions: ${instructions}\n\nPlease mark the dose as Taken in your MedSafe portal once completed.`
    });
  }

  async sendMissedDoseAlert(toEmail: string, recipientName: string, patientName: string, medicationName: string, scheduledTime: string): Promise<boolean> {
    return this.sendEmail({
      to: toEmail,
      subject: `MedSafe Alert: Missed Dose Recorded for ${patientName}`,
      text: `Hello ${recipientName},\n\nA scheduled dose was not recorded within the grace window:\n- Patient: ${patientName}\n- Medication: ${medicationName}\n- Scheduled Time: ${scheduledTime}\n\nImportant: Do not take an extra dose unless explicitly instructed by your physician. Contact your healthcare professional if you are unsure how to proceed.`
    });
  }

  async sendPrescriptionRenewalReminder(toEmail: string, patientName: string, rxNumber: string, expiryDate: string, doctorName: string): Promise<boolean> {
    return this.sendEmail({
      to: toEmail,
      subject: `MedSafe Alert: Prescription ${rxNumber} Renewal Due Soon`,
      text: `Hello ${patientName},\n\nYour prescription ${rxNumber} issued by Dr. ${doctorName} is expiring on ${expiryDate}.\n\nPlease contact your healthcare provider or clinic to review your ongoing treatment plan and renew your prescription.`
    });
  }
}

export const emailService = new EmailService();
