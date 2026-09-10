import fs from 'fs';
import path from 'path';
import { config } from '../config';
import {
  User,
  Patient,
  Doctor,
  Caregiver,
  Pharmacist,
  Organization,
  Clinic,
  Medication,
  MedicationPlanHistory,
  Prescription,
  MedicationSchedule,
  AdherenceRecord,
  Notification,
  FollowUpAction,
  SafetyAlert,
  MedicationReference,
  Consent,
  AuditLog,
  ConsultationRequest,
  Consultation,
  Lab,
  TestOrder,
  MedicalReport,
  Bill,
  Payment,
  MedicationSupply,
  RefillRequest,
  SubscriptionPlan,
  Subscription,
  OrganizationLicense,
  UsageRecord,
  Receptionist,
  PatientHospitalRelationship,
  DoctorPatientRelationship
} from '../models/types';

export class Collection<T extends { id: string }> {
  private items: T[] = [];
  private filePath: string;
  private tableName: string;

  constructor(tableName: string, dataDir: string) {
    this.tableName = tableName;
    this.filePath = path.join(dataDir, `${tableName}.json`);
    this.load();
  }

  private load(): void {
    try {
      if (!fs.existsSync(path.dirname(this.filePath))) {
        fs.mkdirSync(path.dirname(this.filePath), { recursive: true });
      }
      if (fs.existsSync(this.filePath)) {
        const raw = fs.readFileSync(this.filePath, 'utf-8');
        this.items = JSON.parse(raw);
      } else {
        this.items = [];
        this.save();
      }
    } catch (err) {
      console.error(`Error loading table ${this.tableName}:`, err);
      this.items = [];
    }
  }

  private save(): void {
    try {
      const dir = path.dirname(this.filePath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      const tmpPath = `${this.filePath}.tmp`;
      fs.writeFileSync(tmpPath, JSON.stringify(this.items, null, 2), 'utf-8');
      fs.renameSync(tmpPath, this.filePath);
    } catch (err) {
      console.error(`Error saving table ${this.tableName}:`, err);
    }
  }

  find(predicate?: (item: T) => boolean): T[] {
    if (!predicate) return [...this.items];
    return this.items.filter(predicate);
  }

  findOne(predicate: (item: T) => boolean): T | undefined {
    return this.items.find(predicate);
  }

  findById(id: string): T | undefined {
    return this.items.find(item => item.id === id);
  }

  insert(item: T): T {
    this.items.push(item);
    this.save();
    return item;
  }

  insertMany(newItems: T[]): T[] {
    this.items.push(...newItems);
    this.save();
    return newItems;
  }

  update(id: string, updates: Partial<T>): T | undefined {
    const index = this.items.findIndex(item => item.id === id);
    if (index === -1) return undefined;
    this.items[index] = { ...this.items[index], ...updates };
    this.save();
    return this.items[index];
  }

  delete(id: string): boolean {
    const initialLen = this.items.length;
    this.items = this.items.filter(item => item.id !== id);
    if (this.items.length !== initialLen) {
      this.save();
      return true;
    }
    return false;
  }

  clear(): void {
    this.items = [];
    this.save();
  }

  count(predicate?: (item: T) => boolean): number {
    if (!predicate) return this.items.length;
    return this.items.filter(predicate).length;
  }
}

export class Database {
  users: Collection<User>;
  patients: Collection<Patient>;
  doctors: Collection<Doctor>;
  caregivers: Collection<Caregiver>;
  pharmacists: Collection<Pharmacist>;
  organizations: Collection<Organization>;
  clinics: Collection<Clinic>;
  medications: Collection<Medication>;
  medicationPlanHistory: Collection<MedicationPlanHistory>;
  prescriptions: Collection<Prescription>;
  medicationSchedules: Collection<MedicationSchedule>;
  adherenceRecords: Collection<AdherenceRecord>;
  notifications: Collection<Notification>;
  followUpActions: Collection<FollowUpAction>;
  safetyAlerts: Collection<SafetyAlert>;
  medicationReferences: Collection<MedicationReference>;
  consents: Collection<Consent>;
  auditLogs: Collection<AuditLog>;
  consultationRequests: Collection<ConsultationRequest>;
  consultations: Collection<Consultation>;
  labs: Collection<Lab>;
  testOrders: Collection<TestOrder>;
  medicalReports: Collection<MedicalReport>;
  bills: Collection<Bill>;
  payments: Collection<Payment>;
  medicationSupplies: Collection<MedicationSupply>;
  refillRequests: Collection<RefillRequest>;
  subscriptionPlans: Collection<SubscriptionPlan>;
  subscriptions: Collection<Subscription>;
  organizationLicenses: Collection<OrganizationLicense>;
  usageRecords: Collection<UsageRecord>;
  receptionists: Collection<Receptionist>;
  patientHospitalRelationships: Collection<PatientHospitalRelationship>;
  doctorPatientRelationships: Collection<DoctorPatientRelationship>;

  constructor(dataDir: string = config.dataDir) {
    this.users = new Collection<User>('users', dataDir);
    this.patients = new Collection<Patient>('patients', dataDir);
    this.doctors = new Collection<Doctor>('doctors', dataDir);
    this.caregivers = new Collection<Caregiver>('caregivers', dataDir);
    this.pharmacists = new Collection<Pharmacist>('pharmacists', dataDir);
    this.organizations = new Collection<Organization>('organizations', dataDir);
    this.clinics = new Collection<Clinic>('clinics', dataDir);
    this.medications = new Collection<Medication>('medications', dataDir);
    this.medicationPlanHistory = new Collection<MedicationPlanHistory>('medication_plan_history', dataDir);
    this.prescriptions = new Collection<Prescription>('prescriptions', dataDir);
    this.medicationSchedules = new Collection<MedicationSchedule>('medication_schedules', dataDir);
    this.adherenceRecords = new Collection<AdherenceRecord>('adherence_records', dataDir);
    this.notifications = new Collection<Notification>('notifications', dataDir);
    this.followUpActions = new Collection<FollowUpAction>('follow_up_actions', dataDir);
    this.safetyAlerts = new Collection<SafetyAlert>('safety_alerts', dataDir);
    this.medicationReferences = new Collection<MedicationReference>('medication_references', dataDir);
    this.consents = new Collection<Consent>('consents', dataDir);
    this.auditLogs = new Collection<AuditLog>('audit_logs', dataDir);
    this.consultationRequests = new Collection<ConsultationRequest>('consultation_requests', dataDir);
    this.consultations = new Collection<Consultation>('consultations', dataDir);
    this.labs = new Collection<Lab>('labs', dataDir);
    this.testOrders = new Collection<TestOrder>('test_orders', dataDir);
    this.medicalReports = new Collection<MedicalReport>('medical_reports', dataDir);
    this.bills = new Collection<Bill>('bills', dataDir);
    this.payments = new Collection<Payment>('payments', dataDir);
    this.medicationSupplies = new Collection<MedicationSupply>('medication_supplies', dataDir);
    this.refillRequests = new Collection<RefillRequest>('refill_requests', dataDir);
    this.subscriptionPlans = new Collection<SubscriptionPlan>('subscription_plans', dataDir);
    this.subscriptions = new Collection<Subscription>('subscriptions', dataDir);
    this.organizationLicenses = new Collection<OrganizationLicense>('organization_licenses', dataDir);
    this.usageRecords = new Collection<UsageRecord>('usage_records', dataDir);
    this.receptionists = new Collection<Receptionist>('receptionists', dataDir);
    this.patientHospitalRelationships = new Collection<PatientHospitalRelationship>('patient_hospital_relationships', dataDir);
    this.doctorPatientRelationships = new Collection<DoctorPatientRelationship>('doctor_patient_relationships', dataDir);
  }

  clearAll(): void {
    this.users.clear();
    this.patients.clear();
    this.doctors.clear();
    this.caregivers.clear();
    this.pharmacists.clear();
    this.organizations.clear();
    this.clinics.clear();
    this.medications.clear();
    this.medicationPlanHistory.clear();
    this.prescriptions.clear();
    this.medicationSchedules.clear();
    this.adherenceRecords.clear();
    this.notifications.clear();
    this.followUpActions.clear();
    this.safetyAlerts.clear();
    this.medicationReferences.clear();
    this.consents.clear();
    this.auditLogs.clear();
    this.consultationRequests.clear();
    this.consultations.clear();
    this.labs.clear();
    this.testOrders.clear();
    this.medicalReports.clear();
    this.bills.clear();
    this.payments.clear();
    this.medicationSupplies.clear();
    this.refillRequests.clear();
    this.subscriptionPlans.clear();
    this.subscriptions.clear();
    this.organizationLicenses.clear();
    this.usageRecords.clear();
    this.receptionists.clear();
    this.patientHospitalRelationships.clear();
    this.doctorPatientRelationships.clear();
  }
}

export const db = new Database();
