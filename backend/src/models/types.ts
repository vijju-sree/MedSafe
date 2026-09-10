export type UserRole = 'PATIENT' | 'DOCTOR' | 'CAREGIVER' | 'PHARMACIST' | 'ADMIN' | 'LAB' | 'CLINIC' | 'HOSPITAL' | 'RECEPTIONIST';

export type VerificationStatus = 'PENDING' | 'VERIFIED' | 'REJECTED' | 'SUSPENDED';

export interface User {
  id: string;
  email: string;
  passwordHash: string;
  role: UserRole;
  name: string;
  phone?: string;
  avatar?: string;
  patientId?: string; // Linked patient identifier for PATIENT role
  doctorId?: string;  // Linked doctor identifier for DOCTOR role
  receptionistId?: string; // Linked receptionist identifier for RECEPTIONIST role
  hospitalId?: string; // Linked hospital / organization ID (e.g. HOSP-00125)
  hospitalName?: string; // e.g. ABC Hospital
  caregiverId?: string;
  pharmacistId?: string;
  labId?: string;
  organizationId?: string;
  clinicId?: string;
  verificationStatus?: VerificationStatus;
  licenseNumber?: string;
  registrationNumber?: string;
  councilRegistrationId?: string; // Unique council/registration ID for doctors
  documentUrl?: string;
  rejectionReason?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Patient {
  id: string;
  patientId: string; // e.g. PAT10001
  userId: string;
  name: string;
  dob: string;
  gender: 'MALE' | 'FEMALE' | 'OTHER';
  email: string;
  phone: string;
  address: string;
  emergencyContact: {
    name: string;
    relationship: string;
    phone: string;
  };
  organizationId?: string;
  clinicId?: string;
  registeredDate: string;
  caregiverIds: string[];
  doctorIds: string[];
  clinicIds?: string[];
}

export type ConsultationStatus = 'PENDING' | 'ACCEPTED' | 'REJECTED';

export interface ConsultationRequest {
  id: string;
  requestId?: string; // e.g. REQ-10025
  patientId: string;
  patientName: string;
  patientEmail: string;
  patientPhone: string;
  doctorId: string;
  doctorName: string;
  specialty: string;
  hospitalId?: string; // e.g. HOSP-00125
  hospitalName?: string; // e.g. ABC Hospital
  clinicId: string;
  clinicName: string;
  reason: string;
  status: ConsultationStatus;
  requestedAt: string;
  respondedAt?: string;
  acceptedBy?: string; // e.g. REC-0018 or DOC10001
  acceptedByRole?: string; // e.g. RECEPTIONIST or DOCTOR
  notes?: string;
}

export interface Consultation {
  id: string;
  consultationRequestId: string;
  patientId: string;
  doctorId: string;
  clinicId: string;
  consultationDate: string;
  diagnosisNotes?: string;
  status: 'COMPLETED' | 'SCHEDULED';
  createdAt: string;
}

export interface Doctor {
  id: string;
  doctorId: string; // e.g. DOC10001
  userId: string;
  name: string;
  specialty: string;
  councilRegistrationId?: string; // Unique Council Registration ID (e.g. DOC-AP-123456)
  hospitalId?: string; // e.g. HOSP-00125
  hospitalName?: string; // e.g. ABC Hospital
  clinicId: string;
  organizationId: string;
  phone: string;
  email: string;
  licenseNumber: string;
  verificationStatus?: VerificationStatus;
  authorizedPatientIds: string[];
}

export interface Receptionist {
  id: string;
  receptionistId: string; // e.g. REC-0018
  userId: string;
  hospitalId: string; // e.g. HOSP-00125
  hospitalName: string; // e.g. ABC Hospital
  name: string;
  email: string;
  phone?: string;
  status: 'ACTIVE' | 'INACTIVE';
  createdAt: string;
  updatedAt?: string;
}

export interface PatientHospitalRelationship {
  id: string;
  relationshipId: string;
  patientId: string;
  hospitalId: string;
  hospitalName?: string;
  receptionistId?: string;
  status: 'ACTIVE' | 'INACTIVE';
  createdAt: string;
  endedAt?: string;
}

export interface DoctorPatientRelationship {
  id: string;
  relationshipId: string;
  patientId: string;
  doctorId: string;
  doctorName?: string;
  hospitalId: string;
  hospitalName?: string;
  status: 'ACTIVE' | 'INACTIVE';
  createdAt: string;
  acceptedBy?: string; // receptionistId or doctorId
  acceptedByRole?: string; // 'RECEPTIONIST' | 'DOCTOR'
  acceptedAt?: string;
}

export interface Caregiver {
  id: string;
  caregiverId: string; // e.g. CAR10001
  userId: string;
  name: string;
  email: string;
  phone: string;
  relationship: string;
  authorizedPatientIds: string[];
}

export interface Pharmacist {
  id: string;
  pharmacistId: string; // e.g. PHA10001
  userId: string;
  name: string;
  email: string;
  phone: string;
  pharmacyName: string;
  organizationId: string;
  licenseNumber: string;
  verificationStatus?: VerificationStatus;
  authorizedPatientIds: string[];
}

export interface Lab {
  id: string;
  labId: string; // e.g. LAB10001
  userId: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  licenseNumber: string;
  testCapabilities: string[];
  verificationStatus: VerificationStatus;
  organizationId?: string;
}

export interface Organization {
  id: string;
  hospitalId?: string; // Unique Hospital/Org ID e.g. HOSP-00125
  name: string;
  type: 'HOSPITAL' | 'CLINIC' | 'PHARMACY';
  address: string;
  phone: string;
  createdAt: string;
}

export interface Clinic {
  id: string;
  organizationId: string;
  name: string;
  location: string;
  phone: string;
}

export type MedicationFrequency = 
  | 'DAILY' 
  | 'TWICE_DAILY' 
  | 'THREE_TIMES_DAILY' 
  | 'WEEKLY' 
  | 'CUSTOM';

export type TimeOfDay = 'MORNING' | 'AFTERNOON' | 'EVENING' | 'NIGHT';

export interface Medication {
  id: string;
  patientId: string; // PAT10001
  prescriptionId: string;
  doctorId: string;
  doctorName?: string;
  name: string;
  genericName: string;
  strength: string; // e.g. 500 mg
  dosageAmount: string; // e.g. 1
  dosageUnit: string; // e.g. tablet, capsule, ml
  form: string; // tablet, syrup, injection
  route: string; // Oral, Topical, etc.
  frequency: MedicationFrequency;
  scheduleTimes: string[]; // e.g. ["09:00", "21:00"] (24-hour format)
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  instructions: string; // "Take with plenty of water"
  foodInstruction: 'BEFORE_FOOD' | 'AFTER_FOOD' | 'WITH_FOOD' | 'NO_RESTRICTION';
  prescriptionStatus: 'ACTIVE' | 'EXPIRING' | 'EXPIRED' | 'DISCONTINUED';
  refillDate?: string;
  refillRemaining: number;
  totalQuantity: number;
  notes?: string;
  version: number;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface MedicationPlanHistory {
  id: string;
  patientId: string;
  medicationId: string;
  version: number;
  changeType: 'CREATED' | 'UPDATED' | 'DISCONTINUED';
  previousValue?: Partial<Medication>;
  newValue: Partial<Medication>;
  changedBy: string; // User ID
  changedByName: string;
  changedByRole: UserRole;
  reason: string;
  timestamp: string;
}

export type PrescriptionStatus = 'ACTIVE' | 'EXPIRING' | 'EXPIRED';

export interface Prescription {
  id: string;
  prescriptionId: string; // e.g. RX10001
  patientId: string;
  doctorId: string;
  doctorName: string;
  clinicName: string;
  prescriptionDate: string;
  validFrom: string;
  validUntil: string;
  status: PrescriptionStatus;
  notes: string;
  medicationIds: string[];
  createdAt: string;
}

export type ScheduleStatus = 'UPCOMING' | 'ON_TIME' | 'LATE' | 'MISSED' | 'SKIPPED';

export interface MedicationSchedule {
  id: string;
  patientId: string;
  medicationId: string;
  prescriptionId: string;
  medicationName: string;
  dosage: string;
  instructions: string;
  foodInstruction: string;
  scheduledDate: string; // YYYY-MM-DD
  scheduledTime: string; // HH:mm
  timeOfDay: TimeOfDay;
  status: ScheduleStatus;
  actualTakenTime?: string; // ISO string
  graceMinutes: number; // e.g. 30
  reminderSent: boolean;
  notes?: string;
  createdAt: string;
}

export interface AdherenceRecord {
  id: string;
  patientId: string;
  medicationId: string;
  scheduleId: string;
  medicationName: string;
  scheduledTime: string;
  actualTakenTime?: string;
  status: 'ON_TIME' | 'LATE' | 'MISSED' | 'SKIPPED';
  timeDifferenceMinutes?: number;
  notes?: string;
  recordedAt: string;
}

export type NotificationType =
  | 'MEDICATION_REMINDER'
  | 'DOSE_TAKEN'
  | 'DOSE_MISSED'
  | 'DOSE_SKIPPED'
  | 'LATE_DOSE'
  | 'REFILL_REMINDER'
  | 'REFILL_DUE'
  | 'REFILL_REQUESTED'
  | 'REFILL_STATUS_CHANGED'
  | 'NEW_PRESCRIPTION'
  | 'SUBSCRIPTION_EXPIRING'
  | 'LICENSE_EXPIRING'
  | 'USAGE_LIMIT_REACHED'
  | 'PRESCRIPTION_EXPIRING'
  | 'PRESCRIPTION_EXPIRED'
  | 'SAFETY_ALERT'
  | 'MEDICATION_PLAN_CHANGED'
  | 'CAREGIVER_ALERT'
  | 'FOLLOW_UP'
  | 'TEST_ORDERED'
  | 'SAMPLE_COLLECTED'
  | 'REPORT_READY'
  | 'BILL_GENERATED'
  | 'PAYMENT_RECEIVED'
  | 'VERIFICATION_STATUS';

export type NotificationCategory = 'USER' | 'SYSTEM_DISPATCH';

export interface Notification {
  id: string;
  recipientId: string; // User ID
  recipientRole: UserRole;
  patientId: string;
  type: NotificationType | string;
  title: string;
  message: string;
  category?: NotificationCategory;
  metadata?: Record<string, any>;
  readStatus: boolean;
  isRead?: boolean;
  readAt?: string;
  isCleared?: boolean;
  clearedAt?: string;
  scheduledAt?: string;
  deliveryStatus: 'DELIVERED' | 'FAILED' | 'PENDING';
  createdAt: string;
}

export interface FollowUpAction {
  id: string;
  patientId: string;
  medicationId?: string;
  medicationName?: string;
  type?: 'SKIPPED_MEDICATION' | 'MISSED_MEDICATION' | 'PRESCRIPTION_EXPIRY' | 'REFILL_REQUIRED' | 'DOCTOR_FOLLOW_UP' | 'SAFETY_ALERT' | 'CLINICAL_REVIEW';
  scheduledDateTime?: string;
  doctorId?: string;
  doctorName?: string;
  reason: string; // e.g. "3 doses missed in last 7 days"
  actionRequired: string; // e.g. "Review with healthcare professional"
  status: 'PENDING' | 'IN_REVIEW' | 'RESOLVED' | 'COMPLETED' | 'IN_PROGRESS';
  recommendedForRole: 'DOCTOR' | 'PHARMACIST' | 'PATIENT' | 'CAREGIVER';
  notes?: string;
  createdAt: string;
  resolvedAt?: string;
  resolvedBy?: string;
}

export interface SafetyAlert {
  id: string;
  patientId: string;
  alertType: 'DUPLICATE_MEDICATION' | 'MISSING_INFO' | 'EXPIRED_PRESCRIPTION' | 'DRUG_CONFLICT' | 'REPEATED_MISSED_DOSES';
  severity: 'INFO' | 'WARNING' | 'CRITICAL';
  title: string;
  description: string;
  recommendation: string; // Strictly recommendation for professional review
  disclaimer: string;
  medicationIds?: string[];
  acknowledged: boolean;
  createdAt: string;
}

export interface MedicationReference {
  id: string;
  drugName: string;
  genericName: string;
  category: string;
  standardDosageRange: string;
  commonInstructions: string;
  conflictingDrugs: string[]; // List of conflicting generic or brand names
  contraindications: string;
}

export interface Consent {
  id: string;
  patientId: string;
  granteeId: string; // Caregiver or Doctor user ID
  granteeName: string;
  granteeEmail: string;
  granteeRole: UserRole;
  accessScope: 'ALL' | 'SCHEDULE_ADHERENCE' | 'PRESCRIPTIONS' | 'MEDICATIONS';
  status: 'ACTIVE' | 'REVOKED';
  grantedAt: string;
  revokedAt?: string;
}

export interface AuditLog {
  id: string;
  userId: string;
  userName: string;
  userRole: UserRole;
  action: string;
  resource: string;
  resourceId?: string;
  patientId?: string;
  timestamp: string;
  ipAddress?: string;
  userAgent?: string;
  details: Record<string, any>;
  result: 'SUCCESS' | 'FAILURE';
}

export interface AdherenceAnalytics {
  patientId: string;
  totalScheduled: number;
  takenOnTime: number;
  takenLate: number;
  missed: number;
  skipped: number;
  adherencePercentage: number;
  daily: { date: string; scheduled: number; taken: number; missed: number; skipped?: number }[];
  weekly: { week: string; adherence: number; taken?: number; late?: number; missed?: number; skipped?: number }[];
  monthly: { month: string; adherence: number }[];
  medicationBreakdown: {
    medicationName: string;
    scheduled: number;
    taken: number;
    late: number;
    missed: number;
    skipped?: number;
    adherence: number;
  }[];
  riskScore: 'LOW' | 'MEDIUM' | 'HIGH';
  riskRationale: string;
}

export type TestOrderStatus = 'ORDERED' | 'SAMPLE_COLLECTED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';

export interface TestOrder {
  id: string;
  testOrderId: string; // e.g. TST10001
  patientId: string;
  patientName: string;
  doctorId: string;
  doctorName: string;
  clinicId?: string;
  clinicName?: string;
  labId?: string;
  labName?: string;
  testName: string;
  testCategory: 'BLOOD' | 'RADIOLOGY' | 'CARDIOLOGY' | 'PATHOLOGY' | 'OTHER';
  reason: string;
  priority: 'ROUTINE' | 'URGENT' | 'STAT';
  status: TestOrderStatus;
  orderedAt: string;
  sampleCollectedAt?: string;
  completedAt?: string;
  reportId?: string;
  billId?: string;
  cost: number;
  notes?: string;
}

export interface MedicalReport {
  id: string;
  reportId: string; // e.g. RPT10001
  testOrderId: string;
  patientId: string;
  patientName: string;
  doctorId: string;
  doctorName: string;
  labId: string;
  labName: string;
  testName: string;
  testDate: string;
  resultSummary: string;
  detailedFindings: string;
  referenceRange?: string;
  status: 'FINAL' | 'PRELIMINARY' | 'AMENDED';
  performedBy: string;
  verifiedBy?: string;
  fileData?: string;
  fileName?: string;
  fileType?: string;
  uploadedAt: string;
  disclaimer: string;
}

export type BillStatus = 'PENDING' | 'PAID' | 'CANCELLED' | 'REFUNDED';

export interface BillItem {
  description: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  itemType: 'CONSULTATION' | 'TEST' | 'MEDICATION' | 'PROCEDURE' | 'OTHER';
  referenceId?: string;
}

export interface Bill {
  id: string;
  billId: string; // e.g. BIL10001
  patientId: string;
  patientName: string;
  clinicId?: string;
  clinicName?: string;
  labId?: string;
  labName?: string;
  doctorId?: string;
  doctorName?: string;
  items: BillItem[];
  subtotal: number;
  tax: number;
  discount: number;
  totalAmount: number;
  status: BillStatus;
  billDate: string;
  dueDate: string;
  paidAt?: string;
  paymentId?: string;
  paymentReference?: string;
  paymentMethod?: 'UPI' | 'CARD' | 'NET_BANKING' | 'CASH' | 'Razorpay' | 'RAZORPAY';
}

export interface Payment {
  id: string;
  paymentId: string; // e.g. PAY10001
  billId?: string;
  patientId?: string;
  organizationId?: string;
  patientName: string;
  amount: number;
  currency: string;
  paymentMethod: 'UPI' | 'CARD' | 'NET_BANKING' | 'CASH' | 'Razorpay' | 'RAZORPAY';
  transactionRef: string;
  paymentStatus: 'SUCCESS' | 'FAILED' | 'PENDING';
  gatewayMode: 'SANDBOX' | 'LIVE';
  paidAt: string;
  receiptNumber: string;
  payerDetails: {
    name: string;
    email: string;
    phone: string;
    last4?: string;
    upiId?: string;
  };
}

export type RefillStatus = 'NOT_DUE' | 'DUE_SOON' | 'REFILL_DUE' | 'REFILL_REQUESTED' | 'REFILLED' | 'EXPIRED';

export type RefillRequestStatus = 'REQUESTED' | 'APPROVED' | 'PROCESSING' | 'READY' | 'DISPATCHED' | 'COMPLETED' | 'CANCELLED';

export interface MedicationSupply {
  id: string;
  patientId: string;
  patientName?: string;
  medicationId: string;
  medicationName: string;
  prescriptionId?: string;
  prescribingDoctorId?: string;
  prescribingDoctorName?: string;
  initialQuantity?: number;
  quantityDispensed?: number;
  quantityRemaining: number;
  dailyUsage: number; // units per day
  dispensedDate?: string;
  expectedDepletionDate?: string;
  refillThresholdDays: number; // default 7 days
  refillDate?: string;
  refillStatus: RefillStatus;
  lastRefillRequestId?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface RefillRequestHistory {
  status: RefillRequestStatus;
  changedBy: string;
  changedByRole: string;
  timestamp: string;
  notes?: string;
}

export interface RefillRequest {
  id: string;
  refillRequestId: string; // e.g. RFL10001
  patientId: string;
  patientName: string;
  medicationId: string;
  medicationName: string;
  prescriptionId?: string;
  doctorId?: string;
  doctorName?: string;
  pharmacyId?: string;
  pharmacyName?: string;
  quantityRequested: number;
  status: RefillRequestStatus;
  notes?: string;
  statusHistory: RefillRequestHistory[];
  requestedDate: string;
  updatedAt: string;
}

export type CustomerType = 'PATIENT' | 'ORGANIZATION';
export type BillingCycle = 'MONTHLY' | 'YEARLY';

export interface SubscriptionPlan {
  id: string;
  planId: string; // e.g. PLAN_FREE, PLAN_PATIENT_PREMIUM, PLAN_CLINIC_ORG
  planName: string;
  customerType: CustomerType;
  price: number; // in INR e.g. 0, 499, 4999
  billingCycle: BillingCycle;
  description: string;
  features: string[];
  usageLimits: {
    maxPatients?: number;
    maxStaff?: number;
    maxPrescriptionsPerMonth?: number;
    maxTestOrdersPerMonth?: number;
    maxReportsPerMonth?: number;
    maxNotificationsPerMonth?: number;
  };
  overagePricing?: {
    extraPatientPrice?: number;
    extraTestOrderPrice?: number;
    extraNotificationPrice?: number;
  };
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Subscription {
  id: string;
  subscriptionId: string; // e.g. SUB10001
  userId?: string;
  patientId?: string;
  organizationId?: string;
  planId: string;
  planName: string;
  price: number;
  billingCycle: BillingCycle;
  startDate: string;
  endDate: string;
  renewalDate?: string;
  status: 'ACTIVE' | 'EXPIRED' | 'CANCELLED';
  autoRenew: boolean;
  paymentId?: string;
  razorpayPaymentId?: string;
  familyMembersLimit?: number;
  familyMembersCount?: number;
  createdAt: string;
  updatedAt: string;
}

export interface SubscriptionPayment {
  id: string;
  subscriptionPaymentId: string;
  userId: string;
  patientId?: string;
  subscriptionId: string;
  planId: string;
  planName?: string;
  amount: number;
  currency: string;
  razorpayOrderId: string;
  razorpayPaymentId: string;
  razorpaySignature?: string;
  status: 'PENDING' | 'PAID' | 'FAILED';
  paymentMethod?: string;
  createdAt: string;
  paidAt?: string;
}

export interface BillPayment {
  id: string;
  billPaymentId: string;
  billId: string;
  patientId: string;
  organizationId?: string;
  amount: number;
  currency: string;
  razorpayOrderId: string;
  razorpayPaymentId: string;
  razorpaySignature?: string;
  status: 'PENDING' | 'PAID' | 'FAILED';
  paymentMethod?: string;
  createdAt: string;
  paidAt?: string;
}

export interface FamilyMember {
  id: string;
  subscriptionId: string;
  primaryPatientId: string;
  name: string;
  relationship: string;
  phone?: string;
  email?: string;
  addedAt: string;
}

export type LicenseStatus = 'ACTIVE' | 'EXPIRING_SOON' | 'EXPIRED' | 'SUSPENDED';

export interface OrganizationLicense {
  id: string;
  licenseId: string; // e.g. LIC10001
  organizationId: string;
  organizationName: string;
  organizationType: 'CLINIC' | 'HOSPITAL' | 'PHARMACY' | 'LAB';
  planId: string;
  planName: string;
  licenseStartDate: string;
  licenseEndDate: string;
  status: LicenseStatus;
  userLimit: number;
  patientLimit: number;
  featuresEnabled: string[];
  assignedByAdminId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface UsageRecord {
  id: string;
  organizationId: string;
  organizationName: string;
  usageType: 'ACTIVE_PATIENTS' | 'STAFF_ACCOUNTS' | 'PRESCRIPTIONS' | 'TEST_ORDERS' | 'REPORTS' | 'NOTIFICATIONS';
  quantity: number;
  includedQuantity: number;
  billableQuantity: number;
  billingPeriod: string; // e.g. '2026-09'
  unitPrice: number;
  totalAmount: number;
  createdAt: string;
}

export interface OrganizationPayment {
  id: string;
  organizationPaymentId: string;
  organizationId: string;
  organizationName?: string;
  paymentType: 'LICENSE' | 'USAGE' | 'USAGE_OVERAGE';
  referenceId: string;
  amount: number;
  currency: string;
  razorpayOrderId: string;
  razorpayPaymentId: string;
  razorpaySignature: string;
  status: 'PAID' | 'AUTHORIZED' | 'FAILED';
  paymentMethod: string;
  createdAt: string;
  paidAt: string;
}

export interface WebhookEvent {
  id: string;
  eventId: string;
  eventType: string;
  entityId: string;
  payload: string;
  status: 'PROCESSED' | 'IGNORED' | 'FAILED';
  createdAt: string;
}

