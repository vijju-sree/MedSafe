export type UserRole = 'PATIENT' | 'DOCTOR' | 'CAREGIVER' | 'PHARMACIST' | 'ADMIN' | 'LAB' | 'CLINIC' | 'HOSPITAL' | 'RECEPTIONIST';

export type VerificationStatus = 'PENDING' | 'VERIFIED' | 'REJECTED' | 'SUSPENDED';

export interface User {
  id: string;
  email: string;
  role: UserRole;
  name: string;
  phone?: string;
  patientId?: string;
  doctorId?: string;
  receptionistId?: string;
  hospitalId?: string;
  hospitalName?: string;
  caregiverId?: string;
  pharmacistId?: string;
  labId?: string;
  organizationId?: string;
  clinicId?: string;
  verificationStatus?: VerificationStatus;
  licenseNumber?: string;
  councilRegistrationId?: string;
  rejectionReason?: string;
}

export interface Patient {
  id: string;
  patientId: string;
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

export type ReceptionistSidebarTab =
  | 'dashboard'
  | 'requests'
  | 'patients'
  | 'add-patient'
  | 'doctors'
  | 'reports'
  | 'test-orders'
  | 'hospital-profile'
  | 'notifications';

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
  acceptedByRole?: string;
  acceptedAt?: string;
}

export type PatientSidebarTab =
  | 'dashboard'
  | 'medications'
  | 'my-medications'
  | 'schedule'
  | 'reminders'
  | 'adherence'
  | 'prescriptions'
  | 'tests-investigations'
  | 'medical-reports'
  | 'bills-payments'
  | 'subscriptions'
  | 'my-doctors'
  | 'my-clinics'
  | 'safety-followup'
  | 'notifications'
  | 'caregivers'
  | 'access-consent'
  | 'history'
  | 'refills'
  | 'profile';

export type DoctorSidebarTab =
  | 'dashboard'
  | 'my-patients'
  | 'consultation-requests'
  | 'medication-plans'
  | 'prescriptions'
  | 'tests-investigations'
  | 'medical-reports'
  | 'adherence'
  | 'safety-alerts'
  | 'refill-renewal'
  | 'follow-up'
  | 'notifications'
  | 'access-consent'
  | 'profile';

export type LabSidebarTab =
  | 'dashboard'
  | 'incoming-orders'
  | 'sample-collection'
  | 'in-progress'
  | 'completed-reports'
  | 'upload-report'
  | 'test-catalogue'
  | 'notifications'
  | 'profile';

export type ClinicHospitalSidebarTab =
  | 'dashboard'
  | 'patients'
  | 'doctors'
  | 'consultations'
  | 'departments'
  | 'test-orders'
  | 'medical-reports'
  | 'billing-revenue'
  | 'safety-alerts'
  | 'staff-verifications'
  | 'notifications'
  | 'profile';

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
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED';
  requestedAt: string;
  respondedAt?: string;
  acceptedBy?: string;
  acceptedByRole?: string;
  notes?: string;
}

export interface DoctorDiscoveryItem {
  id: string;
  doctorId: string;
  name: string;
  specialty: string;
  councilRegistrationId?: string;
  hospitalId?: string;
  hospitalName?: string;
  clinicId: string;
  clinicName: string;
  organizationName: string;
  location: string;
  phone: string;
  email: string;
  status?: string;
  lastConsultationDate?: string;
}

export interface Medication {
  id: string;
  patientId: string;
  prescriptionId: string;
  doctorId: string;
  doctorName?: string;
  name: string;
  genericName: string;
  strength: string;
  dosageAmount: string;
  dosageUnit: string;
  form: string;
  route: string;
  frequency: string;
  scheduleTimes: string[];
  startDate: string;
  endDate: string;
  instructions: string;
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

export type ScheduleStatus = 'UPCOMING' | 'ON_TIME' | 'LATE' | 'MISSED' | 'SKIPPED';
export type TimeOfDay = 'MORNING' | 'AFTERNOON' | 'EVENING' | 'NIGHT';

export interface MedicationSchedule {
  id: string;
  patientId: string;
  medicationId: string;
  prescriptionId: string;
  medicationName: string;
  dosage: string;
  instructions: string;
  foodInstruction: string;
  scheduledDate: string;
  scheduledTime: string;
  timeOfDay: TimeOfDay;
  status: ScheduleStatus;
  actualTakenTime?: string;
  graceMinutes: number;
  reminderSent: boolean;
  notes?: string;
}

export interface Prescription {
  id: string;
  prescriptionId: string;
  patientId: string;
  doctorId: string;
  doctorName: string;
  clinicName: string;
  prescriptionDate: string;
  validFrom: string;
  validUntil: string;
  status: 'ACTIVE' | 'EXPIRING' | 'EXPIRED';
  notes: string;
  medicationIds: string[];
}

export interface SafetyAlert {
  id: string;
  patientId: string;
  alertType: 'DUPLICATE_MEDICATION' | 'MISSING_INFO' | 'EXPIRED_PRESCRIPTION' | 'DRUG_CONFLICT' | 'REPEATED_MISSED_DOSES';
  severity: 'INFO' | 'WARNING' | 'CRITICAL';
  title: string;
  description: string;
  recommendation: string;
  disclaimer: string;
  medicationIds?: string[];
  acknowledged: boolean;
  createdAt: string;
}

export interface FollowUpAction {
  id: string;
  patientId: string;
  medicationId?: string;
  medicationName?: string;
  type?: 'SKIPPED_MEDICATION' | 'MISSED_DOSES' | 'PRESCRIPTION_EXPIRY' | 'REFILL_REQUIRED' | 'DOCTOR_FOLLOWUP' | 'SAFETY_ALERT' | string;
  scheduledDateTime?: string;
  doctorId?: string;
  doctorName?: string;
  reason: string;
  actionRequired: string;
  status: 'PENDING' | 'IN_REVIEW' | 'IN_PROGRESS' | 'RESOLVED' | 'COMPLETED' | 'DISMISSED';
  recommendedForRole: 'DOCTOR' | 'PHARMACIST' | 'PATIENT' | 'CAREGIVER';
  notes?: string;
  createdAt: string;
  resolvedAt?: string;
  resolvedBy?: string;
}

export interface Consent {
  id: string;
  patientId: string;
  granteeId: string;
  granteeName: string;
  granteeEmail: string;
  granteeRole: UserRole;
  accessScope: string;
  status: 'ACTIVE' | 'REVOKED';
  grantedAt: string;
  revokedAt?: string;
}

export interface NotificationItem {
  id: string;
  recipientId: string;
  recipientRole: UserRole;
  patientId: string;
  type: string;
  title: string;
  message: string;
  category?: 'USER' | 'SYSTEM_DISPATCH';
  metadata?: Record<string, any>;
  readStatus: boolean;
  isRead?: boolean;
  readAt?: string;
  isCleared?: boolean;
  clearedAt?: string;
  scheduledAt?: string;
  deliveryStatus: string;
  createdAt: string;
}

export interface AdherenceAnalytics {
  patientId: string;
  totalScheduled: number;
  takenOnTime: number;
  takenLate: number;
  missed: number;
  skipped?: number;
  adherencePercentage: number;
  daily: { date: string; scheduled: number; taken: number; missed: number; skipped?: number }[];
  weekly: { week: string; adherence: number; skipped?: number }[];
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

// Phase 2 Diagnostics & Imaging
export type TestOrderStatus = 'ORDERED' | 'SAMPLE_COLLECTED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';

export interface TestOrder {
  id: string;
  testOrderId: string;
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
  reportId: string;
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
  fileName?: string;
  fileType?: string;
  uploadedAt: string;
  disclaimer: string;
}

// Phase 2 Billing & Payments
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
  billId: string;
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
  paymentMethod?: 'UPI' | 'CARD' | 'NET_BANKING' | 'CASH';
}

export interface Payment {
  id: string;
  paymentId: string;
  billId: string;
  patientId: string;
  patientName: string;
  amount: number;
  currency: string;
  paymentMethod: 'UPI' | 'CARD' | 'NET_BANKING' | 'CASH';
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

export interface Lab {
  id: string;
  labId: string;
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

export interface VerificationItem {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: UserRole;
  licenseNumber?: string;
  verificationStatus: VerificationStatus;
  rejectionReason?: string;
  details?: Record<string, any>;
  createdAt: string;
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
  dailyUsage: number;
  dispensedDate?: string;
  expectedDepletionDate?: string;
  refillThresholdDays: number;
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
  refillRequestId: string;
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
  planId: string;
  planName: string;
  name?: string;
  customerType: CustomerType;
  price: number;
  priceMonthly?: number;
  priceYearly?: number;
  billingCycle: BillingCycle;
  description: string;
  tier?: string;
  features: string[];
  usageLimits?: {
    maxPatients?: number;
    maxStaff?: number;
    maxPrescriptionsPerMonth?: number;
    maxTestOrdersPerMonth?: number;
    maxReportsPerMonth?: number;
    maxNotificationsPerMonth?: number;
  };
  maxPatients?: number;
  maxDoctors?: number;
  overagePricing?: {
    extraPatientPrice?: number;
    extraTestOrderPrice?: number;
    extraNotificationPrice?: number;
  };
  active?: boolean;
  isActive?: boolean;
  createdAt: string;
  updatedAt?: string;
}

export interface Subscription {
  id: string;
  subscriptionId: string;
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
  updatedAt?: string;
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
  licenseId: string;
  licenseKey?: string;
  organizationId: string;
  organizationName: string;
  organizationType: 'CLINIC' | 'HOSPITAL' | 'PHARMACY' | 'LAB';
  planId?: string;
  planName?: string;
  tier?: string;
  licenseStartDate?: string;
  licenseEndDate?: string;
  issuedAt?: string;
  expiresAt?: string;
  status: LicenseStatus;
  userLimit?: number;
  patientLimit?: number;
  maxDoctors?: number;
  maxPatients?: number;
  featuresEnabled?: string[];
  assignedByAdminId?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface UsageRecord {
  id: string;
  organizationId: string;
  organizationName: string;
  usageType?: 'ACTIVE_PATIENTS' | 'STAFF_ACCOUNTS' | 'PRESCRIPTIONS' | 'TEST_ORDERS' | 'REPORTS' | 'NOTIFICATIONS';
  quantity?: number;
  includedQuantity?: number;
  billableQuantity?: number;
  billingPeriod?: string;
  periodMonth?: string;
  unitPrice?: number;
  totalAmount?: number;
  totalOverageFee?: number;
  prescriptionsGenerated?: number;
  testOrdersCreated?: number;
  reportsUploaded?: number;
  notificationsSent?: number;
  activePatientsCount?: number;
  allowedPatientsQuota?: number;
  createdAt: string;
}

export interface RazorpayOrder {
  orderId: string;
  amount: number;
  amountInRupees: number;
  currency: string;
  keyId: string;
}

export interface OrganizationPayment {
  id: string;
  organizationPaymentId: string;
  organizationId: string;
  organizationName?: string;
  paymentType: 'LICENSE' | 'USAGE';
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
