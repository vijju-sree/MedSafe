import bcrypt from 'bcryptjs';
import { db } from './db';
import {
  User,
  Patient,
  Doctor,
  Caregiver,
  Pharmacist,
  Organization,
  Clinic,
  Prescription,
  Medication,
  MedicationSchedule,
  AdherenceRecord,
  SafetyAlert,
  FollowUpAction,
  Consent,
  MedicationReference,
  AuditLog,
  Notification,
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
  DoctorPatientRelationship,
  ConsultationRequest
} from '../models/types';

export async function seedDatabase(force: boolean = false): Promise<void> {
  const now = new Date();
  const todayStr = now.toISOString().split('T')[0];
  const addDays = (d: Date, days: number): string => {
    const copy = new Date(d);
    copy.setDate(copy.getDate() + days);
    return copy.toISOString().split('T')[0];
  };

  if (!force && db.users.count() > 0) {
    // Ensure system dispatches exist even if database was seeded earlier
    const existingDispatches = db.notifications.find(n => n.category === 'SYSTEM_DISPATCH');
    if (existingDispatches.length === 0) {
      console.log('Ensuring default MedSafe platform system dispatches are populated...');
      db.notifications.insertMany([
        {
          id: 'sys-disp-1',
          recipientId: 'usr-pat-1',
          recipientRole: 'PATIENT',
          patientId: 'PAT10001',
          type: 'SYSTEM_MAINTENANCE',
          title: 'Scheduled Platform Maintenance Notice',
          message: 'Routine cloud database maintenance is scheduled for Sunday 02:00 AM – 03:30 AM IST. All emergency contact lines and offline medication logs remain active.',
          category: 'SYSTEM_DISPATCH',
          readStatus: false,
          isRead: false,
          deliveryStatus: 'DELIVERED',
          createdAt: `${todayStr}T06:00:00Z`
        },
        {
          id: 'sys-disp-2',
          recipientId: 'usr-pat-1',
          recipientRole: 'PATIENT',
          patientId: 'PAT10001',
          type: 'SYSTEM_ALERT',
          title: 'Advisory: Clinical Safety & Refill Policy Update',
          message: 'MedSafe Phase 2 clinical safety validation has activated automated duplicate-ingredient checks and ABDM-compliant consent governance.',
          category: 'SYSTEM_DISPATCH',
          readStatus: false,
          isRead: false,
          deliveryStatus: 'DELIVERED',
          createdAt: addDays(now, -1) + 'T10:00:00Z'
        },
        {
          id: 'sys-disp-3',
          recipientId: 'usr-pat-1',
          recipientRole: 'PATIENT',
          patientId: 'PAT10001',
          type: 'PLATFORM_FEATURE',
          title: 'Platform Feature: Sandbox Digital Checkout Live',
          message: 'Instant UPI and simulated card payments for investigation lab fees are now active in sandbox mode on your Patient Portal.',
          category: 'SYSTEM_DISPATCH',
          readStatus: true,
          isRead: true,
          readAt: addDays(now, -3) + 'T11:00:00Z',
          deliveryStatus: 'DELIVERED',
          createdAt: addDays(now, -3) + 'T09:00:00Z'
        }
      ]);
    }
    seedMissingCollections(now, todayStr, addDays);
    console.log('Database already contains records. Enhanced with missing collections if any.');
    return;
  }

  console.log('Clearing existing data and seeding fresh MedSafe demo records...');
  db.clearAll();

  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash('password123', salt);

  // 1. Organizations & Clinics
  const orgHospital: Organization = {
    id: 'org-1',
    hospitalId: 'HOSP-00125',
    name: 'ABC Hospital',
    type: 'HOSPITAL',
    address: 'Jubilee Hills, Road No. 36, Hyderabad',
    phone: '+91 40 2360 7777',
    createdAt: now.toISOString()
  };

  const orgClinic: Organization = {
    id: 'org-2',
    hospitalId: 'HOSP-00482',
    name: 'XYZ Hospital',
    type: 'HOSPITAL',
    address: 'East City Hub, Gachibowli, Hyderabad',
    phone: '+91 40 4455 6677',
    createdAt: now.toISOString()
  };

  const orgPharmacy: Organization = {
    id: 'org-3',
    name: 'Apollo Med Pharmacy #4',
    type: 'PHARMACY',
    address: 'Commercial Block B, Madhapur, Hyderabad',
    phone: '+91 40 8899 0011',
    createdAt: now.toISOString()
  };

  db.organizations.insertMany([orgHospital, orgClinic, orgPharmacy]);

  const clinicMain: Clinic = {
    id: 'clin-1',
    organizationId: 'org-1',
    name: 'Apollo Internal Medicine Wing',
    location: 'Floor 2, Block A',
    phone: '+91 40 2360 7710'
  };

  const clinicEast: Clinic = {
    id: 'clin-2',
    organizationId: 'org-2',
    name: 'Care Clinic Neurology & Family Medicine',
    location: 'Main Tower, Floor 1',
    phone: '+91 40 4455 6680'
  };
  db.clinics.insertMany([clinicMain, clinicEast]);

  // 2. Users & Role Profiles
  // Patient Anjali
  const userPatient: User = {
    id: 'usr-pat-1',
    email: 'anjali@medsafe.local',
    passwordHash,
    role: 'PATIENT',
    name: 'Anjali Sharma',
    phone: '+91 98765 43210',
    patientId: 'PAT10001',
    organizationId: 'org-1',
    clinicId: 'clin-1',
    createdAt: now.toISOString(),
    updatedAt: now.toISOString()
  };

  const patientProfile: Patient = {
    id: 'pat-1',
    patientId: 'PAT10001',
    userId: 'usr-pat-1',
    name: 'Anjali Sharma',
    dob: '1988-06-15',
    gender: 'FEMALE',
    email: 'anjali@medsafe.local',
    phone: '+91 98765 43210',
    address: 'Flat 402, Green Meadows Apt, Madhapur, Hyderabad',
    emergencyContact: {
      name: 'Vikram Sharma',
      relationship: 'Spouse',
      phone: '+91 98765 43219'
    },
    organizationId: 'org-1',
    clinicId: 'clin-1',
    registeredDate: addDays(now, -60),
    caregiverIds: ['car-1'],
    doctorIds: ['DOC10001'],
    clinicIds: ['clin-1']
  };

  // Patient Vikram Singh (Unlinked MedSafe Patient for Global Search/Intake Demo)
  const userPatient2: User = {
    id: 'usr-pat-2',
    email: 'vikram@medsafe.local',
    passwordHash,
    role: 'PATIENT',
    name: 'Vikram Singh',
    phone: '+91 98765 43212',
    patientId: 'PAT10002',
    createdAt: now.toISOString(),
    updatedAt: now.toISOString()
  };

  const patientProfile2: Patient = {
    id: 'pat-2',
    patientId: 'PAT10002',
    userId: 'usr-pat-2',
    name: 'Vikram Singh',
    dob: '1975-03-20',
    gender: 'MALE',
    email: 'vikram@medsafe.local',
    phone: '+91 98765 43212',
    address: 'Banjara Hills, Road 12, Hyderabad',
    emergencyContact: {
      name: 'Sunita Singh',
      relationship: 'Spouse',
      phone: '+91 98765 43213'
    },
    registeredDate: addDays(now, -10),
    caregiverIds: [],
    doctorIds: [],
    clinicIds: []
  };

  // Patient Kavita Reddy
  const userPatient3: User = {
    id: 'usr-pat-3',
    email: 'kavita@medsafe.local',
    passwordHash,
    role: 'PATIENT',
    name: 'Kavita Reddy',
    phone: '+91 98765 88990',
    patientId: 'PAT10005',
    createdAt: now.toISOString(),
    updatedAt: now.toISOString()
  };

  const patientProfile3: Patient = {
    id: 'pat-3',
    patientId: 'PAT10005',
    userId: 'usr-pat-3',
    name: 'Kavita Reddy',
    dob: '1992-11-04',
    gender: 'FEMALE',
    email: 'kavita@medsafe.local',
    phone: '+91 98765 88990',
    address: 'Kondapur, Silicon Valley, Hyderabad',
    emergencyContact: {
      name: 'Rajesh Reddy',
      relationship: 'Brother',
      phone: '+91 98765 88991'
    },
    registeredDate: addDays(now, -5),
    caregiverIds: [],
    doctorIds: [],
    clinicIds: []
  };

  // Doctor Dr. Ravi Kumar
  const userDoctor: User = {
    id: 'usr-doc-1',
    email: 'dr.ravi@medsafe.local',
    passwordHash,
    role: 'DOCTOR',
    name: 'Dr. Ravi Kumar',
    phone: '+91 91234 56780',
    doctorId: 'DOC10001',
    organizationId: 'org-1',
    hospitalId: 'HOSP-00125',
    hospitalName: 'ABC Hospital',
    councilRegistrationId: 'DOC-AP-123456',
    verificationStatus: 'VERIFIED',
    clinicId: 'clin-1',
    createdAt: now.toISOString(),
    updatedAt: now.toISOString()
  };

  const doctorProfile: Doctor = {
    id: 'doc-1',
    doctorId: 'DOC10001',
    userId: 'usr-doc-1',
    name: 'Dr. Ravi Kumar, MD',
    specialty: 'Internal Medicine & Cardiology',
    clinicId: 'clin-1',
    organizationId: 'org-1',
    hospitalId: 'HOSP-00125',
    hospitalName: 'ABC Hospital',
    councilRegistrationId: 'DOC-AP-123456',
    phone: '+91 91234 56780',
    email: 'dr.ravi@medsafe.local',
    licenseNumber: 'DOC-AP-123456',
    verificationStatus: 'VERIFIED',
    authorizedPatientIds: ['PAT10001']
  };

  // Additional Discovery Doctors
  const userDoctor2: User = {
    id: 'usr-doc-2',
    email: 'dr.sneha@medsafe.local',
    passwordHash,
    role: 'DOCTOR',
    name: 'Dr. Sneha Roy',
    phone: '+91 92345 67891',
    doctorId: 'DOC10002',
    organizationId: 'org-2',
    hospitalId: 'HOSP-00482',
    hospitalName: 'XYZ Hospital',
    councilRegistrationId: 'DOC-TS-789012',
    verificationStatus: 'VERIFIED',
    clinicId: 'clin-2',
    createdAt: now.toISOString(),
    updatedAt: now.toISOString()
  };

  const doctorProfile2: Doctor = {
    id: 'doc-2',
    doctorId: 'DOC10002',
    userId: 'usr-doc-2',
    name: 'Dr. Sneha Roy, DM',
    specialty: 'Neurology & Headache Medicine',
    clinicId: 'clin-2',
    organizationId: 'org-2',
    hospitalId: 'HOSP-00482',
    hospitalName: 'XYZ Hospital',
    councilRegistrationId: 'DOC-TS-789012',
    phone: '+91 92345 67891',
    email: 'dr.sneha@medsafe.local',
    licenseNumber: 'DOC-TS-789012',
    verificationStatus: 'VERIFIED',
    authorizedPatientIds: []
  };

  const userDoctor3: User = {
    id: 'usr-doc-3',
    email: 'dr.amit@medsafe.local',
    passwordHash,
    role: 'DOCTOR',
    name: 'Dr. Amit Patel',
    phone: '+91 93456 78902',
    doctorId: 'DOC10003',
    organizationId: 'org-1',
    hospitalId: 'HOSP-00125',
    hospitalName: 'ABC Hospital',
    councilRegistrationId: 'DOC-MH-345678',
    verificationStatus: 'VERIFIED',
    clinicId: 'clin-1',
    createdAt: now.toISOString(),
    updatedAt: now.toISOString()
  };

  const doctorProfile3: Doctor = {
    id: 'doc-3',
    doctorId: 'DOC10003',
    userId: 'usr-doc-3',
    name: 'Dr. Amit Patel, MBBS',
    specialty: 'Family Medicine & General Practice',
    clinicId: 'clin-1',
    organizationId: 'org-1',
    hospitalId: 'HOSP-00125',
    hospitalName: 'ABC Hospital',
    councilRegistrationId: 'DOC-MH-345678',
    phone: '+91 93456 78902',
    email: 'dr.amit@medsafe.local',
    licenseNumber: 'DOC-MH-345678',
    verificationStatus: 'VERIFIED',
    authorizedPatientIds: []
  };

  // Caregiver Priya
  const userCaregiver: User = {
    id: 'usr-car-1',
    email: 'priya@medsafe.local',
    passwordHash,
    role: 'CAREGIVER',
    name: 'Priya Sharma',
    phone: '+91 98765 11223',
    caregiverId: 'CAR10001',
    createdAt: now.toISOString(),
    updatedAt: now.toISOString()
  };

  const caregiverProfile: Caregiver = {
    id: 'car-1',
    caregiverId: 'CAR10001',
    userId: 'usr-car-1',
    name: 'Priya Sharma',
    email: 'priya@medsafe.local',
    phone: '+91 98765 11223',
    relationship: 'Daughter / Family Caregiver',
    authorizedPatientIds: ['PAT10001']
  };

  // Pharmacist Suresh
  const userPharmacist: User = {
    id: 'usr-pha-1',
    email: 'suresh@medsafe.local',
    passwordHash,
    role: 'PHARMACIST',
    name: 'Suresh Reddy',
    phone: '+91 99887 76655',
    pharmacistId: 'PHA10001',
    organizationId: 'org-3',
    createdAt: now.toISOString(),
    updatedAt: now.toISOString()
  };

  const pharmacistProfile: Pharmacist = {
    id: 'pha-1',
    pharmacistId: 'PHA10001',
    userId: 'usr-pha-1',
    name: 'Suresh Reddy, RPh',
    email: 'suresh@medsafe.local',
    phone: '+91 99887 76655',
    pharmacyName: 'Apollo Med Pharmacy #4',
    organizationId: 'org-3',
    licenseNumber: 'PHARM-TS-9921',
    authorizedPatientIds: ['PAT10001']
  };

  // Admin Rajesh
  const userAdmin: User = {
    id: 'usr-adm-1',
    email: 'admin@medsafe.local',
    passwordHash,
    role: 'ADMIN',
    name: 'Rajesh Varma (Admin)',
    phone: '+91 90000 11111',
    verificationStatus: 'VERIFIED',
    createdAt: now.toISOString(),
    updatedAt: now.toISOString()
  };

  // Lab Apex Diagnostics
  const userLab: User = {
    id: 'usr-lab-1',
    email: 'lab@medsafe.local',
    passwordHash,
    role: 'LAB',
    name: 'Apex Diagnostic Center',
    phone: '+91 94567 89012',
    labId: 'LAB10001',
    verificationStatus: 'VERIFIED',
    createdAt: now.toISOString(),
    updatedAt: now.toISOString()
  };

  const labProfile: Lab = {
    id: 'lab-1',
    labId: 'LAB10001',
    userId: 'usr-lab-1',
    name: 'Apex Diagnostic Center & Imaging',
    email: 'lab@medsafe.local',
    phone: '+91 94567 89012',
    address: 'Diagnostic Tower, Block C, Jubilee Hills, Hyderabad',
    licenseNumber: 'NABL-MED-9941',
    testCapabilities: [
      'CBC Blood Test (Complete Blood Count)',
      'Chest X-Ray (PA View)',
      'Lipid Profile (Cholesterol & Triglycerides)',
      '12-Lead Electrocardiogram (ECG)',
      'HbA1c (Glycated Hemoglobin)',
      'Liver Function Test (LFT)',
      'Kidney Function Test (KFT/RFT)',
      'Thyroid Stimulating Hormone (TSH)',
      'Ultrasound Abdomen & Pelvis',
      'Urine Routine & Microscopic'
    ],
    verificationStatus: 'VERIFIED',
    organizationId: 'org-1'
  };

  // Clinic Care Clinic
  const userClinic: User = {
    id: 'usr-cln-1',
    email: 'clinic@medsafe.local',
    passwordHash,
    role: 'CLINIC',
    name: 'Care Clinic Administrator',
    phone: '+91 95678 90123',
    clinicId: 'clin-2',
    organizationId: 'org-2',
    verificationStatus: 'VERIFIED',
    createdAt: now.toISOString(),
    updatedAt: now.toISOString()
  };

  // Pending Doctor for Verification Queue
  const userPendingDoc: User = {
    id: 'usr-pdoc-1',
    email: 'pending.doc@medsafe.local',
    passwordHash,
    role: 'DOCTOR',
    name: 'Dr. Vivek Verma',
    phone: '+91 97890 12345',
    doctorId: 'DOC10004',
    licenseNumber: 'MCI-PEND-9011',
    verificationStatus: 'PENDING',
    createdAt: now.toISOString(),
    updatedAt: now.toISOString()
  };

  const pendingDocProfile: Doctor = {
    id: 'doc-4',
    doctorId: 'DOC10004',
    userId: 'usr-pdoc-1',
    name: 'Dr. Vivek Verma, MS',
    specialty: 'Orthopedic Surgery',
    clinicId: 'clin-1',
    organizationId: 'org-1',
    phone: '+91 97890 12345',
    email: 'pending.doc@medsafe.local',
    licenseNumber: 'MCI-PEND-9011',
    verificationStatus: 'PENDING',
    authorizedPatientIds: []
  };

  // Pending Pharmacist for Verification Queue
  const userPendingPharm: User = {
    id: 'usr-ppharm-1',
    email: 'pending.pharm@medsafe.local',
    passwordHash,
    role: 'PHARMACIST',
    name: 'Sunita Rao (Rao MedStore)',
    phone: '+91 98901 23456',
    pharmacistId: 'PHA10002',
    licenseNumber: 'PHARM-PEND-4412',
    verificationStatus: 'PENDING',
    createdAt: now.toISOString(),
    updatedAt: now.toISOString()
  };

  const pendingPharmProfile: Pharmacist = {
    id: 'pha-2',
    pharmacistId: 'PHA10002',
    userId: 'usr-ppharm-1',
    name: 'Sunita Rao, BPharm',
    email: 'pending.pharm@medsafe.local',
    phone: '+91 98901 23456',
    pharmacyName: 'Rao Community Healthcare Pharmacy',
    organizationId: 'org-2',
    licenseNumber: 'PHARM-PEND-4412',
    verificationStatus: 'PENDING',
    authorizedPatientIds: []
  };

  const recPasswordHash = await bcrypt.hash('DemoPass123!', salt);

  // Receptionist Priya Sharma (ABC Hospital)
  const userReceptionistABC: User = {
    id: 'usr-rec-1',
    email: 'receptionist.abc@medsafe.local',
    passwordHash: recPasswordHash,
    role: 'RECEPTIONIST',
    name: 'Priya Sharma',
    phone: '+91 98765 11111',
    receptionistId: 'REC-0018',
    organizationId: 'org-1',
    hospitalId: 'HOSP-00125',
    hospitalName: 'ABC Hospital',
    verificationStatus: 'VERIFIED',
    createdAt: now.toISOString(),
    updatedAt: now.toISOString()
  };

  const receptionistProfileABC: Receptionist = {
    id: 'rec-1',
    receptionistId: 'REC-0018',
    userId: 'usr-rec-1',
    name: 'Priya Sharma',
    email: 'receptionist.abc@medsafe.local',
    phone: '+91 98765 11111',
    hospitalId: 'HOSP-00125',
    hospitalName: 'ABC Hospital',
    status: 'ACTIVE',
    createdAt: now.toISOString()
  };

  // Receptionist Anil Verma (XYZ Hospital)
  const userReceptionistXYZ: User = {
    id: 'usr-rec-2',
    email: 'receptionist.xyz@medsafe.local',
    passwordHash: recPasswordHash,
    role: 'RECEPTIONIST',
    name: 'Anil Verma',
    phone: '+91 98765 22222',
    receptionistId: 'REC-0091',
    organizationId: 'org-2',
    hospitalId: 'HOSP-00482',
    hospitalName: 'XYZ Hospital',
    verificationStatus: 'VERIFIED',
    createdAt: now.toISOString(),
    updatedAt: now.toISOString()
  };

  const receptionistProfileXYZ: Receptionist = {
    id: 'rec-2',
    receptionistId: 'REC-0091',
    userId: 'usr-rec-2',
    name: 'Anil Verma',
    email: 'receptionist.xyz@medsafe.local',
    phone: '+91 98765 22222',
    hospitalId: 'HOSP-00482',
    hospitalName: 'XYZ Hospital',
    status: 'ACTIVE',
    createdAt: now.toISOString()
  };

  db.users.insertMany([
    userPatient,
    userPatient2,
    userPatient3,
    userDoctor,
    userDoctor2,
    userDoctor3,
    userCaregiver,
    userPharmacist,
    userAdmin,
    userLab,
    userClinic,
    userPendingDoc,
    userPendingPharm,
    userReceptionistABC,
    userReceptionistXYZ
  ]);
  db.patients.insertMany([patientProfile, patientProfile2, patientProfile3]);
  db.doctors.insertMany([doctorProfile, doctorProfile2, doctorProfile3, pendingDocProfile]);
  db.caregivers.insert(caregiverProfile);
  db.pharmacists.insertMany([pharmacistProfile, pendingPharmProfile]);
  db.labs.insert(labProfile);
  db.receptionists.insertMany([receptionistProfileABC, receptionistProfileXYZ]);

  // Seed Initial Patient-Hospital and Doctor-Patient Relationships
  const phr1: PatientHospitalRelationship = {
    id: 'phr-1',
    relationshipId: 'REL-HOSP-10001',
    patientId: 'PAT10001',
    hospitalId: 'HOSP-00125',
    hospitalName: 'ABC Hospital',
    receptionistId: 'REC-0018',
    status: 'ACTIVE',
    createdAt: addDays(now, -60)
  };
  db.patientHospitalRelationships.insert(phr1);

  const dpr1: DoctorPatientRelationship = {
    id: 'dpr-1',
    relationshipId: 'REL-DOC-10001',
    patientId: 'PAT10001',
    doctorId: 'DOC10001',
    doctorName: 'Dr. Ravi Kumar, MD',
    hospitalId: 'HOSP-00125',
    hospitalName: 'ABC Hospital',
    status: 'ACTIVE',
    createdAt: addDays(now, -60),
    acceptedBy: 'REC-0018',
    acceptedByRole: 'RECEPTIONIST',
    acceptedAt: addDays(now, -60)
  };
  db.doctorPatientRelationships.insert(dpr1);

  // Seed Initial Consultation Requests
  const pendingReq: ConsultationRequest = {
    id: 'cr-demo-1',
    requestId: 'cr-demo-1',
    patientId: 'PAT10001',
    patientName: 'Anjali Sharma',
    patientEmail: 'anjali@medsafe.local',
    patientPhone: '+91 98765 43210',
    doctorId: 'DOC10001',
    doctorName: 'Dr. Ravi Kumar, MD',
    hospitalId: 'HOSP-00125',
    hospitalName: 'ABC Hospital',
    specialty: 'Internal Medicine & Cardiology',
    clinicId: 'clin-1',
    clinicName: 'Apollo Internal Medicine Wing',
    reason: 'Follow-up consultation regarding cardiovascular regimen & late afternoon doses',
    status: 'ACCEPTED' as const,
    requestedAt: addDays(now, -30),
    respondedAt: addDays(now, -30),
    notes: 'Consultation completed and prescription RX10001 issued.'
  };

  const incomingPendingReq: ConsultationRequest = {
    id: 'cr-demo-2',
    requestId: 'cr-demo-2',
    patientId: 'PAT10005',
    patientName: 'Kavita Reddy',
    patientEmail: 'kavita@medsafe.local',
    patientPhone: '+91 98765 88990',
    doctorId: 'DOC10001',
    doctorName: 'Dr. Ravi Kumar, MD',
    hospitalId: 'HOSP-00125',
    hospitalName: 'ABC Hospital',
    specialty: 'Internal Medicine & Cardiology',
    clinicId: 'clin-1',
    clinicName: 'Apollo Internal Medicine Wing',
    reason: 'New patient seeking cardiology review for hypertension and routine medication plan setup',
    status: 'PENDING' as const,
    requestedAt: now.toISOString()
  };

  db.consultationRequests.insertMany([pendingReq, incomingPendingReq]);

  // 3. Prescriptions
  const prescription1: Prescription = {
    id: 'rx-1',
    prescriptionId: 'RX10001',
    patientId: 'PAT10001',
    doctorId: 'DOC10001',
    doctorName: 'Dr. Ravi Kumar, MD',
    clinicName: 'Apollo Internal Medicine Wing',
    prescriptionDate: addDays(now, -30),
    validFrom: addDays(now, -30),
    validUntil: addDays(now, 60),
    status: 'ACTIVE',
    notes: 'Regular maintenance regimen. Follow food instructions carefully.',
    medicationIds: ['med-1', 'med-2', 'med-3'],
    createdAt: addDays(now, -30)
  };

  const prescription2: Prescription = {
    id: 'rx-2',
    prescriptionId: 'RX10002',
    patientId: 'PAT10001',
    doctorId: 'DOC10001',
    doctorName: 'Dr. Ravi Kumar, MD',
    clinicName: 'Apollo Internal Medicine Wing',
    prescriptionDate: addDays(now, -25),
    validFrom: addDays(now, -25),
    validUntil: addDays(now, 5), // Nearing expiry (5 days remaining)
    status: 'EXPIRING',
    notes: 'Short course cardiovascular support. Needs review prior to refill.',
    medicationIds: ['med-4'],
    createdAt: addDays(now, -25)
  };

  const prescriptionOld: Prescription = {
    id: 'rx-old',
    prescriptionId: 'RX10000',
    patientId: 'PAT10001',
    doctorId: 'DOC10001',
    doctorName: 'Dr. Ravi Kumar, MD',
    clinicName: 'Apollo Internal Medicine Wing',
    prescriptionDate: addDays(now, -120),
    validFrom: addDays(now, -120),
    validUntil: addDays(now, -30), // Expired 30 days ago
    status: 'EXPIRED',
    notes: 'Prior antibiotic therapy. Completed.',
    medicationIds: [],
    createdAt: addDays(now, -120)
  };

  db.prescriptions.insertMany([prescription1, prescription2, prescriptionOld]);

  // 4. Medications
  const medParacetamol: Medication = {
    id: 'med-1',
    patientId: 'PAT10001',
    prescriptionId: 'RX10001',
    doctorId: 'DOC10001',
    doctorName: 'Dr. Ravi Kumar, MD',
    name: 'Paracetamol',
    genericName: 'Paracetamol / Acetaminophen',
    strength: '500 mg',
    dosageAmount: '1',
    dosageUnit: 'tablet',
    form: 'Tablet',
    route: 'Oral',
    frequency: 'TWICE_DAILY',
    scheduleTimes: ['09:00', '21:00'],
    startDate: addDays(now, -30),
    endDate: addDays(now, 60),
    instructions: 'Take with a full glass of water. Do not exceed prescribed dose.',
    foodInstruction: 'AFTER_FOOD',
    prescriptionStatus: 'ACTIVE',
    refillDate: addDays(now, 20),
    refillRemaining: 2,
    totalQuantity: 60,
    version: 1,
    active: true,
    createdAt: addDays(now, -30),
    updatedAt: addDays(now, -30)
  };

  const medVitaminD: Medication = {
    id: 'med-2',
    patientId: 'PAT10001',
    prescriptionId: 'RX10001',
    doctorId: 'DOC10001',
    doctorName: 'Dr. Ravi Kumar, MD',
    name: 'Vitamin D3',
    genericName: 'Cholecalciferol',
    strength: '60000 IU',
    dosageAmount: '1',
    dosageUnit: 'capsule',
    form: 'Softgel Capsule',
    route: 'Oral',
    frequency: 'WEEKLY',
    scheduleTimes: ['08:00'],
    startDate: addDays(now, -30),
    endDate: addDays(now, 60),
    instructions: 'Take once weekly in the morning with a fatty meal or milk.',
    foodInstruction: 'WITH_FOOD',
    prescriptionStatus: 'ACTIVE',
    refillDate: addDays(now, 30),
    refillRemaining: 3,
    totalQuantity: 12,
    version: 1,
    active: true,
    createdAt: addDays(now, -30),
    updatedAt: addDays(now, -30)
  };

  const medMetformin: Medication = {
    id: 'med-3',
    patientId: 'PAT10001',
    prescriptionId: 'RX10001',
    doctorId: 'DOC10001',
    doctorName: 'Dr. Ravi Kumar, MD',
    name: 'Metformin',
    genericName: 'Metformin Hydrochloride',
    strength: '500 mg',
    dosageAmount: '1',
    dosageUnit: 'tablet',
    form: 'Extended Release Tablet',
    route: 'Oral',
    frequency: 'DAILY',
    scheduleTimes: ['13:00'],
    startDate: addDays(now, -30),
    endDate: addDays(now, 60),
    instructions: 'Swallow whole with midday meal. Do not crush or chew.',
    foodInstruction: 'WITH_FOOD',
    prescriptionStatus: 'ACTIVE',
    refillDate: addDays(now, 15),
    refillRemaining: 1,
    totalQuantity: 30,
    version: 1,
    active: true,
    createdAt: addDays(now, -30),
    updatedAt: addDays(now, -30)
  };

  // Med 4: Atorvastatin (from RX10002)
  const medAtorvastatin: Medication = {
    id: 'med-4',
    patientId: 'PAT10001',
    prescriptionId: 'RX10002',
    doctorId: 'DOC10001',
    doctorName: 'Dr. Ravi Kumar, MD',
    name: 'Atorvastatin',
    genericName: 'Atorvastatin Calcium',
    strength: '20 mg',
    dosageAmount: '1',
    dosageUnit: 'tablet',
    form: 'Film-coated Tablet',
    route: 'Oral',
    frequency: 'DAILY',
    scheduleTimes: ['22:00'],
    startDate: addDays(now, -25),
    endDate: addDays(now, 5),
    instructions: 'Take at night before bed.',
    foodInstruction: 'NO_RESTRICTION',
    prescriptionStatus: 'EXPIRING',
    refillDate: addDays(now, 4),
    refillRemaining: 0,
    totalQuantity: 30,
    version: 1,
    active: true,
    createdAt: addDays(now, -25),
    updatedAt: addDays(now, -25)
  };

  // Med 5 (Demo duplicate to trigger safety signal)
  const medCrocinDuplicate: Medication = {
    id: 'med-5',
    patientId: 'PAT10001',
    prescriptionId: 'RX10001',
    doctorId: 'DOC10001',
    doctorName: 'Dr. Ravi Kumar, MD',
    name: 'Crocin Pain Relief',
    genericName: 'Paracetamol / Acetaminophen',
    strength: '500 mg',
    dosageAmount: '1',
    dosageUnit: 'tablet',
    form: 'Tablet',
    route: 'Oral',
    frequency: 'DAILY',
    scheduleTimes: ['15:00'],
    startDate: addDays(now, -5),
    endDate: addDays(now, 25),
    instructions: 'For headache relief.',
    foodInstruction: 'AFTER_FOOD',
    prescriptionStatus: 'ACTIVE',
    refillDate: addDays(now, 20),
    refillRemaining: 1,
    totalQuantity: 15,
    version: 1,
    active: true,
    createdAt: addDays(now, -5),
    updatedAt: addDays(now, -5)
  };

  db.medications.insertMany([medParacetamol, medVitaminD, medMetformin, medAtorvastatin, medCrocinDuplicate]);

  // 5. Today's Schedules & Recent History
  const scheduleTodayMorning: MedicationSchedule = {
    id: 'sch-today-1',
    patientId: 'PAT10001',
    medicationId: 'med-1',
    prescriptionId: 'RX10001',
    medicationName: 'Paracetamol 500 mg',
    dosage: '1 tablet (500 mg)',
    instructions: 'Take after breakfast',
    foodInstruction: 'AFTER_FOOD',
    scheduledDate: todayStr,
    scheduledTime: '09:00',
    timeOfDay: 'MORNING',
    status: 'ON_TIME',
    actualTakenTime: `${todayStr}T09:06:12Z`,
    graceMinutes: 30,
    reminderSent: true,
    createdAt: todayStr
  };

  const scheduleTodayAfternoon: MedicationSchedule = {
    id: 'sch-today-2',
    patientId: 'PAT10001',
    medicationId: 'med-3',
    prescriptionId: 'RX10001',
    medicationName: 'Metformin 500 mg',
    dosage: '1 tablet (500 mg)',
    instructions: 'Take with midday lunch',
    foodInstruction: 'WITH_FOOD',
    scheduledDate: todayStr,
    scheduledTime: '13:00',
    timeOfDay: 'AFTERNOON',
    status: 'LATE',
    actualTakenTime: `${todayStr}T13:26:40Z`,
    graceMinutes: 30,
    reminderSent: true,
    createdAt: todayStr
  };

  const scheduleTodayEvening: MedicationSchedule = {
    id: 'sch-today-3',
    patientId: 'PAT10001',
    medicationId: 'med-1',
    prescriptionId: 'RX10001',
    medicationName: 'Paracetamol 500 mg',
    dosage: '1 tablet (500 mg)',
    instructions: 'Take after dinner',
    foodInstruction: 'AFTER_FOOD',
    scheduledDate: todayStr,
    scheduledTime: '21:00',
    timeOfDay: 'NIGHT',
    status: 'UPCOMING',
    graceMinutes: 30,
    reminderSent: false,
    createdAt: todayStr
  };

  const scheduleTodayNight: MedicationSchedule = {
    id: 'sch-today-4',
    patientId: 'PAT10001',
    medicationId: 'med-4',
    prescriptionId: 'RX10002',
    medicationName: 'Atorvastatin 20 mg',
    dosage: '1 tablet (20 mg)',
    instructions: 'Take before bed',
    foodInstruction: 'NO_RESTRICTION',
    scheduledDate: todayStr,
    scheduledTime: '22:00',
    timeOfDay: 'NIGHT',
    status: 'UPCOMING',
    graceMinutes: 30,
    reminderSent: false,
    createdAt: todayStr
  };

  // Past 6 days of schedules to generate realistic adherence history
  const pastSchedules: MedicationSchedule[] = [];
  const adherenceRecords: AdherenceRecord[] = [];

  // Today's adherence records
  adherenceRecords.push({
    id: 'adh-today-1',
    patientId: 'PAT10001',
    medicationId: 'med-1',
    scheduleId: 'sch-today-1',
    medicationName: 'Paracetamol 500 mg',
    scheduledTime: '09:00',
    actualTakenTime: `${todayStr}T09:06:12Z`,
    status: 'ON_TIME',
    timeDifferenceMinutes: 6,
    recordedAt: `${todayStr}T09:06:12Z`
  });

  adherenceRecords.push({
    id: 'adh-today-2',
    patientId: 'PAT10001',
    medicationId: 'med-3',
    scheduleId: 'sch-today-2',
    medicationName: 'Metformin 500 mg',
    scheduledTime: '13:00',
    actualTakenTime: `${todayStr}T13:26:40Z`,
    status: 'LATE',
    timeDifferenceMinutes: 26,
    recordedAt: `${todayStr}T13:26:40Z`
  });

  for (let i = 1; i <= 6; i++) {
    const dStr = addDays(now, -i);
    // Morning dose (usually on time)
    pastSchedules.push({
      id: `sch-past-${i}-1`,
      patientId: 'PAT10001',
      medicationId: 'med-1',
      prescriptionId: 'RX10001',
      medicationName: 'Paracetamol 500 mg',
      dosage: '1 tablet (500 mg)',
      instructions: 'Take after breakfast',
      foodInstruction: 'AFTER_FOOD',
      scheduledDate: dStr,
      scheduledTime: '09:00',
      timeOfDay: 'MORNING',
      status: 'ON_TIME',
      actualTakenTime: `${dStr}T09:05:00Z`,
      graceMinutes: 30,
      reminderSent: true,
      createdAt: dStr
    });
    adherenceRecords.push({
      id: `adh-past-${i}-1`,
      patientId: 'PAT10001',
      medicationId: 'med-1',
      scheduleId: `sch-past-${i}-1`,
      medicationName: 'Paracetamol 500 mg',
      scheduledTime: '09:00',
      actualTakenTime: `${dStr}T09:05:00Z`,
      status: 'ON_TIME',
      timeDifferenceMinutes: 5,
      recordedAt: `${dStr}T09:05:00Z`
    });

    // Afternoon dose (one late, one missed)
    const statusAfternoon = i === 2 ? 'MISSED' : i === 4 ? 'LATE' : 'ON_TIME';
    const takenTime = statusAfternoon === 'MISSED' ? undefined : statusAfternoon === 'LATE' ? `${dStr}T13:25:00Z` : `${dStr}T13:02:00Z`;
    pastSchedules.push({
      id: `sch-past-${i}-2`,
      patientId: 'PAT10001',
      medicationId: 'med-3',
      prescriptionId: 'RX10001',
      medicationName: 'Metformin 500 mg',
      dosage: '1 tablet (500 mg)',
      instructions: 'Take with midday lunch',
      foodInstruction: 'WITH_FOOD',
      scheduledDate: dStr,
      scheduledTime: '13:00',
      timeOfDay: 'AFTERNOON',
      status: statusAfternoon,
      actualTakenTime: takenTime,
      graceMinutes: 30,
      reminderSent: true,
      createdAt: dStr
    });
    adherenceRecords.push({
      id: `adh-past-${i}-2`,
      patientId: 'PAT10001',
      medicationId: 'med-3',
      scheduleId: `sch-past-${i}-2`,
      medicationName: 'Metformin 500 mg',
      scheduledTime: '13:00',
      actualTakenTime: takenTime,
      status: statusAfternoon,
      timeDifferenceMinutes: statusAfternoon === 'LATE' ? 25 : statusAfternoon === 'ON_TIME' ? 2 : undefined,
      recordedAt: takenTime || `${dStr}T13:35:00Z`
    });

    // Night dose (one missed at day 5)
    const statusNight = i === 5 ? 'MISSED' : 'ON_TIME';
    const takenNightTime = statusNight === 'MISSED' ? undefined : `${dStr}T21:10:00Z`;
    pastSchedules.push({
      id: `sch-past-${i}-3`,
      patientId: 'PAT10001',
      medicationId: 'med-1',
      prescriptionId: 'RX10001',
      medicationName: 'Paracetamol 500 mg',
      dosage: '1 tablet (500 mg)',
      instructions: 'Take after dinner',
      foodInstruction: 'AFTER_FOOD',
      scheduledDate: dStr,
      scheduledTime: '21:00',
      timeOfDay: 'NIGHT',
      status: statusNight,
      actualTakenTime: takenNightTime,
      graceMinutes: 30,
      reminderSent: true,
      createdAt: dStr
    });
    adherenceRecords.push({
      id: `adh-past-${i}-3`,
      patientId: 'PAT10001',
      medicationId: 'med-1',
      scheduleId: `sch-past-${i}-3`,
      medicationName: 'Paracetamol 500 mg',
      scheduledTime: '21:00',
      actualTakenTime: takenNightTime,
      status: statusNight,
      timeDifferenceMinutes: statusNight === 'MISSED' ? undefined : 10,
      recordedAt: takenNightTime || `${dStr}T21:35:00Z`
    });
  }

  db.medicationSchedules.insertMany([
    scheduleTodayMorning,
    scheduleTodayAfternoon,
    scheduleTodayEvening,
    scheduleTodayNight,
    ...pastSchedules
  ]);

  db.adherenceRecords.insertMany(adherenceRecords);

  // 6. Safety Alerts (with strict non-diagnostic disclaimers)
  const alertDuplicate: SafetyAlert = {
    id: 'alert-1',
    patientId: 'PAT10001',
    alertType: 'DUPLICATE_MEDICATION',
    severity: 'WARNING',
    title: 'Possible Duplicate Medication Record',
    description: 'Patient has active records for "Paracetamol 500 mg" and "Crocin Pain Relief 500 mg", which share the identical active ingredient Paracetamol / Acetaminophen.',
    recommendation: 'Possible concern detected — professional review recommended. Please verify with Dr. Ravi Kumar or the dispensing pharmacist whether both formulations were intended.',
    disclaimer: 'This is a safety-support signal, not a medical diagnosis. Please consult your doctor/pharmacist before making medication changes.',
    medicationIds: ['med-1', 'med-5'],
    acknowledged: false,
    createdAt: addDays(now, -1)
  };

  const alertExpiringRx: SafetyAlert = {
    id: 'alert-2',
    patientId: 'PAT10001',
    alertType: 'EXPIRED_PRESCRIPTION',
    severity: 'INFO',
    title: 'Prescription Renewal Approaching',
    description: 'Prescription RX10002 for Atorvastatin 20 mg will expire in 5 days on ' + addDays(now, 5) + '.',
    recommendation: 'Schedule a follow-up consultation with your prescribing clinician to review continuation or renewal.',
    disclaimer: 'This is a safety-support signal, not a medical diagnosis. Please consult your doctor/pharmacist before making medication changes.',
    medicationIds: ['med-4'],
    acknowledged: false,
    createdAt: todayStr
  };

  db.safetyAlerts.insertMany([alertDuplicate, alertExpiringRx]);

  // 7. Follow-Up Actions
  const followUpMissedDoses: FollowUpAction = {
    id: 'flw-1',
    patientId: 'PAT10001',
    medicationId: 'med-3',
    medicationName: 'Metformin 500 mg',
    reason: '2 missed doses and 1 late dose recorded during the past 7 days.',
    actionRequired: 'Review medication timing with healthcare provider during next checkup.',
    status: 'PENDING',
    recommendedForRole: 'DOCTOR',
    notes: 'Patient reports mild afternoon gastrointestinal discomfort when taking with lunch.',
    createdAt: addDays(now, -1)
  };

  const followUpRefill: FollowUpAction = {
    id: 'flw-2',
    patientId: 'PAT10001',
    medicationId: 'med-4',
    medicationName: 'Atorvastatin 20 mg',
    reason: 'Prescription nearing end of 30-day course with zero refills remaining.',
    actionRequired: 'Submit renewal request to Dr. Ravi Kumar.',
    status: 'IN_REVIEW',
    recommendedForRole: 'PHARMACIST',
    createdAt: todayStr
  };

  db.followUpActions.insertMany([followUpMissedDoses, followUpRefill]);

  // 8. Consents
  const consentCaregiver: Consent = {
    id: 'con-1',
    patientId: 'PAT10001',
    granteeId: 'usr-car-1',
    granteeName: 'Priya Sharma (Daughter)',
    granteeEmail: 'priya@medsafe.local',
    granteeRole: 'CAREGIVER',
    accessScope: 'SCHEDULE_ADHERENCE',
    status: 'ACTIVE',
    grantedAt: addDays(now, -45)
  };

  const consentDoctor: Consent = {
    id: 'con-2',
    patientId: 'PAT10001',
    granteeId: 'usr-doc-1',
    granteeName: 'Dr. Ravi Kumar, MD',
    granteeEmail: 'dr.ravi@medsafe.local',
    granteeRole: 'DOCTOR',
    accessScope: 'ALL',
    status: 'ACTIVE',
    grantedAt: addDays(now, -60)
  };

  db.consents.insertMany([consentCaregiver, consentDoctor]);

  // 9. Medication Reference Catalog (for drug conflict engine)
  const drugReferences: MedicationReference[] = [
    {
      id: 'ref-1',
      drugName: 'Paracetamol',
      genericName: 'Acetaminophen',
      category: 'Analgesic / Antipyretic',
      standardDosageRange: '500 mg - 1000 mg every 4-6 hours (max 4000 mg/day)',
      commonInstructions: 'Take with plenty of water after food.',
      conflictingDrugs: ['Warfarin', 'Isoniazid', 'Alcohol'],
      contraindications: 'Severe hepatic impairment, acute active liver disease.'
    },
    {
      id: 'ref-2',
      drugName: 'Atorvastatin',
      genericName: 'Atorvastatin Calcium',
      category: 'HMG-CoA Reductase Inhibitor (Statin)',
      standardDosageRange: '10 mg - 80 mg once daily',
      commonInstructions: 'Take at evening or bedtime.',
      conflictingDrugs: ['Clarithromycin', 'Erythromycin', 'Cyclosporine', 'Grapefruit Juice'],
      contraindications: 'Active liver disease, unexplained persistent elevations of hepatic transaminases.'
    },
    {
      id: 'ref-3',
      drugName: 'Metformin',
      genericName: 'Metformin Hydrochloride',
      category: 'Biguanide Antidiabetic',
      standardDosageRange: '500 mg - 2000 mg daily in divided doses',
      commonInstructions: 'Take with or immediately after meals to reduce GI adverse effects.',
      conflictingDrugs: ['Iodinated Contrast Media', 'Furosemide', 'Cimetidine'],
      contraindications: 'Severe renal impairment (eGFR < 30 mL/min), metabolic acidosis.'
    },
    {
      id: 'ref-4',
      drugName: 'Vitamin D3',
      genericName: 'Cholecalciferol',
      category: 'Vitamin Supplement',
      standardDosageRange: '1000 IU daily or 60000 IU weekly',
      commonInstructions: 'Take with milk or fatty meal for optimal absorption.',
      conflictingDrugs: ['Thiazide Diuretics', 'Digoxin', 'Orlistat'],
      contraindications: 'Hypercalcemia, hypervitaminosis D.'
    },
    {
      id: 'ref-5',
      drugName: 'Clarithromycin',
      genericName: 'Clarithromycin',
      category: 'Macrolide Antibiotic',
      standardDosageRange: '250 mg - 500 mg twice daily',
      commonInstructions: 'Complete full course of antibiotics.',
      conflictingDrugs: ['Atorvastatin', 'Simvastatin', 'Colchicine', 'Pimozide'],
      contraindications: 'History of QT prolongation, concurrent statin therapy.'
    },
    {
      id: 'ref-6',
      drugName: 'Warfarin',
      genericName: 'Warfarin Sodium',
      category: 'Anticoagulant',
      standardDosageRange: '2 mg - 10 mg once daily as per INR',
      commonInstructions: 'Take at the same time each evening. Avoid sudden dietary vitamin K changes.',
      conflictingDrugs: ['Paracetamol (high dose)', 'Aspirin', 'Ibuprofen', 'Metronidazole'],
      contraindications: 'Active bleeding, pregnancy, severe uncontrolled hypertension.'
    }
  ];

  db.medicationReferences.insertMany(drugReferences);

  // 10. In-App Notifications
  const notifReminder: Notification = {
    id: 'notif-1',
    recipientId: 'usr-pat-1',
    recipientRole: 'PATIENT',
    patientId: 'PAT10001',
    type: 'MEDICATION_REMINDER',
    title: 'Medication Time Approaching',
    message: 'Your evening dose of Paracetamol 500 mg is scheduled at 21:00.',
    category: 'USER',
    readStatus: false,
    isRead: false,
    deliveryStatus: 'DELIVERED',
    createdAt: `${todayStr}T15:00:00Z`
  };

  const notifCaregiver: Notification = {
    id: 'notif-2',
    recipientId: 'usr-car-1',
    recipientRole: 'CAREGIVER',
    patientId: 'PAT10001',
    type: 'CAREGIVER_ALERT',
    title: 'Caregiver Update: Late Dose Logged',
    message: 'Anjali took Metformin 500 mg 26 minutes past scheduled time today.',
    category: 'USER',
    readStatus: false,
    isRead: false,
    deliveryStatus: 'DELIVERED',
    createdAt: `${todayStr}T13:30:00Z`
  };

  const notifSafety: Notification = {
    id: 'notif-3',
    recipientId: 'usr-doc-1',
    recipientRole: 'DOCTOR',
    patientId: 'PAT10001',
    type: 'SAFETY_ALERT',
    title: 'Safety Signal: Possible Duplicate Formulation',
    message: 'Potential duplicate active ingredient detected for patient PAT10001 (Paracetamol + Crocin). Professional review recommended.',
    category: 'USER',
    readStatus: false,
    isRead: false,
    deliveryStatus: 'DELIVERED',
    createdAt: addDays(now, -1)
  };

  const notifRxOrder: Notification = {
    id: 'notif-4',
    recipientId: 'usr-pat-1',
    recipientRole: 'PATIENT',
    patientId: 'PAT10001',
    type: 'PRESCRIPTION_CREATED',
    title: 'New Prescription Issued: RX10001',
    message: 'Dr. Ravi Kumar has issued an active prescription covering Metformin and Paracetamol.',
    category: 'USER',
    readStatus: true,
    isRead: true,
    readAt: addDays(now, -2),
    deliveryStatus: 'DELIVERED',
    createdAt: addDays(now, -2)
  };

  const dispatchMaintenance: Notification = {
    id: 'sys-disp-1',
    recipientId: 'usr-pat-1',
    recipientRole: 'PATIENT',
    patientId: 'PAT10001',
    type: 'SYSTEM_MAINTENANCE',
    title: 'Scheduled Platform Maintenance Notice',
    message: 'Routine cloud database maintenance is scheduled for Sunday 02:00 AM – 03:30 AM IST. All emergency contact lines and offline medication logs remain active.',
    category: 'SYSTEM_DISPATCH',
    readStatus: false,
    isRead: false,
    deliveryStatus: 'DELIVERED',
    createdAt: `${todayStr}T06:00:00Z`
  };

  const dispatchSafety: Notification = {
    id: 'sys-disp-2',
    recipientId: 'usr-pat-1',
    recipientRole: 'PATIENT',
    patientId: 'PAT10001',
    type: 'SYSTEM_ALERT',
    title: 'Advisory: Clinical Safety & Refill Policy Update',
    message: 'MedSafe Phase 2 clinical safety validation has activated automated duplicate-ingredient checks and ABDM-compliant consent governance.',
    category: 'SYSTEM_DISPATCH',
    readStatus: false,
    isRead: false,
    deliveryStatus: 'DELIVERED',
    createdAt: addDays(now, -1)
  };

  const dispatchTelehealth: Notification = {
    id: 'sys-disp-3',
    recipientId: 'usr-pat-1',
    recipientRole: 'PATIENT',
    patientId: 'PAT10001',
    type: 'PLATFORM_FEATURE',
    title: 'Platform Feature: Sandbox Digital Checkout Live',
    message: 'Instant UPI and simulated card payments for investigation lab fees are now active in sandbox mode on your Patient Portal.',
    category: 'SYSTEM_DISPATCH',
    readStatus: true,
    isRead: true,
    readAt: addDays(now, -3),
    deliveryStatus: 'DELIVERED',
    createdAt: addDays(now, -3)
  };

  db.notifications.insertMany([
    notifReminder,
    notifCaregiver,
    notifSafety,
    notifRxOrder,
    dispatchMaintenance,
    dispatchSafety,
    dispatchTelehealth
  ]);

  // 11. Initial Audit Logs
  const auditLogs: AuditLog[] = [
    {
      id: 'aud-1',
      userId: 'usr-doc-1',
      userName: 'Dr. Ravi Kumar',
      userRole: 'DOCTOR',
      action: 'PRESCRIPTION_CREATED',
      resource: 'Prescription',
      resourceId: 'RX10001',
      patientId: 'PAT10001',
      timestamp: addDays(now, -30) + 'T10:15:00Z',
      details: { doctorId: 'DOC10001', medications: ['med-1', 'med-2', 'med-3'] },
      result: 'SUCCESS'
    },
    {
      id: 'aud-2',
      userId: 'usr-pat-1',
      userName: 'Anjali Sharma',
      userRole: 'PATIENT',
      action: 'CAREGIVER_AUTHORIZED',
      resource: 'Consent',
      resourceId: 'con-1',
      patientId: 'PAT10001',
      timestamp: addDays(now, -45) + 'T14:20:00Z',
      details: { granteeId: 'usr-car-1', scope: 'SCHEDULE_ADHERENCE' },
      result: 'SUCCESS'
    },
    {
      id: 'aud-3',
      userId: 'usr-pat-1',
      userName: 'Anjali Sharma',
      userRole: 'PATIENT',
      action: 'DOSE_MARKED_TAKEN',
      resource: 'MedicationSchedule',
      resourceId: 'sch-today-1',
      patientId: 'PAT10001',
      timestamp: `${todayStr}T09:06:12Z`,
      details: { scheduledTime: '09:00', status: 'ON_TIME' },
      result: 'SUCCESS'
    }
  ];

  db.auditLogs.insertMany(auditLogs);

  // 12. Test Orders & Diagnostic Reports
  const order1: TestOrder = {
    id: 'tst-1',
    testOrderId: 'TST10001',
    patientId: 'PAT10001',
    patientName: 'Anjali Sharma',
    doctorId: 'DOC10001',
    doctorName: 'Dr. Ravi Kumar, MD',
    clinicId: 'clin-1',
    clinicName: 'Apollo Internal Medicine Wing',
    labId: 'LAB10001',
    labName: 'Apex Diagnostic Center & Imaging',
    testName: 'CBC Blood Test (Complete Blood Count)',
    testCategory: 'BLOOD',
    reason: 'Investigate mild lethargy and routine cardiovascular baseline',
    priority: 'ROUTINE',
    status: 'COMPLETED',
    orderedAt: addDays(now, -10) + 'T09:30:00Z',
    sampleCollectedAt: addDays(now, -9) + 'T08:00:00Z',
    completedAt: addDays(now, -8) + 'T16:45:00Z',
    reportId: 'rpt-1',
    billId: 'BIL10001',
    cost: 450,
    notes: 'Sample processed in duplicate.'
  };

  const order2: TestOrder = {
    id: 'tst-2',
    testOrderId: 'TST10002',
    patientId: 'PAT10001',
    patientName: 'Anjali Sharma',
    doctorId: 'DOC10001',
    doctorName: 'Dr. Ravi Kumar, MD',
    clinicId: 'clin-1',
    clinicName: 'Apollo Internal Medicine Wing',
    labId: 'LAB10001',
    labName: 'Apex Diagnostic Center & Imaging',
    testName: 'Chest X-Ray (PA View)',
    testCategory: 'RADIOLOGY',
    reason: 'Cardiopulmonary evaluation follow-up',
    priority: 'ROUTINE',
    status: 'ORDERED',
    orderedAt: addDays(now, -2) + 'T11:15:00Z',
    billId: 'BIL10002',
    cost: 750,
    notes: 'Please fast for 4 hours prior if possible.'
  };

  const order3: TestOrder = {
    id: 'tst-3',
    testOrderId: 'TST10003',
    patientId: 'PAT10001',
    patientName: 'Anjali Sharma',
    doctorId: 'DOC10001',
    doctorName: 'Dr. Ravi Kumar, MD',
    clinicId: 'clin-1',
    clinicName: 'Apollo Internal Medicine Wing',
    labId: 'LAB10001',
    labName: 'Apex Diagnostic Center & Imaging',
    testName: 'Lipid Profile (Cholesterol & Triglycerides)',
    testCategory: 'BLOOD',
    reason: 'Quarterly lipid and statin efficacy assessment',
    priority: 'ROUTINE',
    status: 'SAMPLE_COLLECTED',
    orderedAt: addDays(now, -1) + 'T10:00:00Z',
    sampleCollectedAt: `${todayStr}T07:30:00Z`,
    billId: 'BIL10003',
    cost: 650,
    notes: 'Fasting specimen collected.'
  };

  db.testOrders.insertMany([order1, order2, order3]);

  // Medical Report
  const report1: MedicalReport = {
    id: 'rpt-1',
    reportId: 'RPT10001',
    testOrderId: 'TST10001',
    patientId: 'PAT10001',
    patientName: 'Anjali Sharma',
    doctorId: 'DOC10001',
    doctorName: 'Dr. Ravi Kumar, MD',
    labId: 'LAB10001',
    labName: 'Apex Diagnostic Center & Imaging',
    testName: 'CBC Blood Test (Complete Blood Count)',
    testDate: addDays(now, -8),
    resultSummary: 'Hemoglobin slightly low (11.2 g/dL), WBC and Platelet counts within normal physiological reference range.',
    detailedFindings: 'Hemoglobin: 11.2 g/dL (Ref: 12.0 - 15.5 g/dL)\nRBC Count: 4.1 mil/uL (Ref: 4.0 - 5.2 mil/uL)\nTotal Leucocyte Count (TLC): 6,800 /uL (Ref: 4,000 - 11,000 /uL)\nPlatelet Count: 245,000 /uL (Ref: 150,000 - 450,000 /uL)\nPCV: 35.2%\nMCV: 82 fL\nMCH: 27 pg\nMCHC: 32%\nPeripheral Smear: Normocytic normochromic with mild microcytosis. No abnormal blast cells seen.',
    referenceRange: 'Female Standard Reference Ranges (NABL Protocol)',
    status: 'FINAL',
    performedBy: 'K. Sunand, Senior Medical Lab Technologist',
    verifiedBy: 'Dr. R. K. Sharma, MD (Pathology)',
    fileName: 'CBC_Report_PAT10001.pdf',
    fileType: 'application/pdf',
    uploadedAt: addDays(now, -8) + 'T16:45:00Z',
    disclaimer: 'CLINICAL NOTICE: This diagnostic report is strictly for licensed medical review and clinical interpretation. MedSafe does not provide automated diagnosis.'
  };

  db.medicalReports.insert(report1);

  // 13. Bills & Payments
  const bill1: Bill = {
    id: 'bil-1',
    billId: 'BIL10001',
    patientId: 'PAT10001',
    patientName: 'Anjali Sharma',
    clinicId: 'clin-1',
    clinicName: 'Apollo Internal Medicine Wing',
    labId: 'LAB10001',
    labName: 'Apex Diagnostic Center & Imaging',
    doctorId: 'DOC10001',
    doctorName: 'Dr. Ravi Kumar, MD',
    items: [
      {
        description: 'CBC Blood Test (Complete Blood Count) - Routine Investigation',
        quantity: 1,
        unitPrice: 450,
        totalPrice: 450,
        itemType: 'TEST',
        referenceId: 'TST10001'
      }
    ],
    subtotal: 450,
    tax: 23,
    discount: 0,
    totalAmount: 473,
    status: 'PAID',
    billDate: addDays(now, -10),
    dueDate: addDays(now, -3),
    paidAt: addDays(now, -9) + 'T14:30:00Z',
    paymentId: 'pay-1',
    paymentMethod: 'UPI'
  };

  const bill2: Bill = {
    id: 'bil-2',
    billId: 'BIL10002',
    patientId: 'PAT10001',
    patientName: 'Anjali Sharma',
    clinicId: 'clin-1',
    clinicName: 'Apollo Internal Medicine Wing',
    labId: 'LAB10001',
    labName: 'Apex Diagnostic Center & Imaging',
    doctorId: 'DOC10001',
    doctorName: 'Dr. Ravi Kumar, MD',
    items: [
      {
        description: 'Chest X-Ray (PA View) - Diagnostic Radiology',
        quantity: 1,
        unitPrice: 750,
        totalPrice: 750,
        itemType: 'TEST',
        referenceId: 'TST10002'
      }
    ],
    subtotal: 750,
    tax: 38,
    discount: 0,
    totalAmount: 788,
    status: 'PENDING',
    billDate: addDays(now, -2),
    dueDate: addDays(now, 5)
  };

  const bill3: Bill = {
    id: 'bil-3',
    billId: 'BIL10003',
    patientId: 'PAT10001',
    patientName: 'Anjali Sharma',
    clinicId: 'clin-1',
    clinicName: 'Apollo Internal Medicine Wing',
    labId: 'LAB10001',
    labName: 'Apex Diagnostic Center & Imaging',
    doctorId: 'DOC10001',
    doctorName: 'Dr. Ravi Kumar, MD',
    items: [
      {
        description: 'Lipid Profile (Cholesterol & Triglycerides) - Blood Pathology',
        quantity: 1,
        unitPrice: 650,
        totalPrice: 650,
        itemType: 'TEST',
        referenceId: 'TST10003'
      }
    ],
    subtotal: 650,
    tax: 33,
    discount: 0,
    totalAmount: 683,
    status: 'PENDING',
    billDate: addDays(now, -1),
    dueDate: addDays(now, 6)
  };

  db.bills.insertMany([bill1, bill2, bill3]);

  const payment1: Payment = {
    id: 'pay-1',
    paymentId: 'PAY10001',
    billId: 'BIL10001',
    patientId: 'PAT10001',
    patientName: 'Anjali Sharma',
    amount: 473,
    currency: 'INR',
    paymentMethod: 'UPI',
    transactionRef: 'TXN-MEDSAFE-98A1B2C-7741',
    paymentStatus: 'SUCCESS',
    gatewayMode: 'SANDBOX',
    paidAt: addDays(now, -9) + 'T14:30:00Z',
    receiptNumber: 'RCP10001',
    payerDetails: {
      name: 'Anjali Sharma',
      email: 'anjali@medsafe.local',
      phone: '+91 98765 43210',
      upiId: 'anjali@okaxis'
    }
  };

  db.payments.insert(payment1);

  seedMissingCollections(now, todayStr, addDays);

  console.log('MedSafe demo database successfully seeded!');
}

function seedMissingCollections(now: Date, todayStr: string, addDays: (d: Date, days: number) => string): void {
  // A. Subscription Plans
  if (db.subscriptionPlans.count() === 0) {
    const plans: SubscriptionPlan[] = [
      {
        id: 'plan-free',
        planId: 'PLAN_FREE',
        planName: 'Free Patient Plan',
        customerType: 'PATIENT',
        price: 0,
        billingCycle: 'MONTHLY',
        description: 'Essential medication adherence tracking and daily reminder alerts.',
        features: [
          'Daily Medication Reminders',
          'Intake Schedule Tracking & Logging',
          'Adherence Compliance Scoring',
          'Single Connected Physician'
        ],
        usageLimits: {
          maxPrescriptionsPerMonth: 5,
          maxReportsPerMonth: 5,
          maxNotificationsPerMonth: 50
        },
        active: true,
        createdAt: now.toISOString(),
        updatedAt: now.toISOString()
      },
      {
        id: 'plan-patient-premium',
        planId: 'PLAN_PATIENT_PREMIUM',
        planName: 'Premium Patient Care',
        customerType: 'PATIENT',
        price: 299,
        billingCycle: 'MONTHLY',
        description: 'Comprehensive patient healthcare coordination with caretaker sharing, automated refill requests, and diagnostic reports.',
        features: [
          'All Free Plan Features',
          'Delegated Caretaker Access & Monitoring',
          'Instant Pharmacy Refill Requests',
          'Unlimited Diagnostic Lab Reports',
          'Comprehensive Medical History Timeline',
          'Priority Safety Intelligence Advisories'
        ],
        usageLimits: {
          maxPrescriptionsPerMonth: 50,
          maxReportsPerMonth: 100,
          maxNotificationsPerMonth: 500
        },
        active: true,
        createdAt: now.toISOString(),
        updatedAt: now.toISOString()
      },
      {
        id: 'plan-family-plus',
        planId: 'PLAN_FAMILY_PLUS',
        planName: 'Family Plus',
        customerType: 'PATIENT',
        price: 499,
        billingCycle: 'MONTHLY',
        description: 'Comprehensive healthcare coverage for up to 5 family members under a single primary subscription.',
        features: [
          'Up to 5 Family Members Included',
          'All Premium Patient Care Features',
          'Shared Caretaker & Emergency Directives',
          'Instant Pharmacy Refill Requests',
          'Unlimited Diagnostic Lab Reports',
          'Comprehensive Medical History Timelines'
        ],
        usageLimits: {
          maxPatients: 5,
          maxPrescriptionsPerMonth: 100,
          maxReportsPerMonth: 200,
          maxNotificationsPerMonth: 1000
        },
        active: true,
        createdAt: now.toISOString(),
        updatedAt: now.toISOString()
      },
      {
        id: 'plan-clinic-org',
        planId: 'PLAN_CLINIC_ORG',
        planName: 'Clinic / Organization Enterprise Plan',
        customerType: 'ORGANIZATION',
        price: 4999,
        billingCycle: 'MONTHLY',
        description: 'Institutional license for clinics, hospitals, and diagnostic centers with multi-clinician coordination and licensing governance.',
        features: [
          'Up to 50 Staff / Clinician Accounts',
          'Up to 1000 Active Patients',
          'Diagnostic Test & Report Pipeline',
          'Itemized Service Billing & Sandbox Payments',
          'ABDM-Compliant Consent & Audit Logs',
          'Automated Low-Supply Refill Alerts'
        ],
        usageLimits: {
          maxPatients: 1000,
          maxStaff: 50,
          maxPrescriptionsPerMonth: 2000,
          maxTestOrdersPerMonth: 1000,
          maxReportsPerMonth: 1000,
          maxNotificationsPerMonth: 10000
        },
        overagePricing: {
          extraPatientPrice: 10,
          extraTestOrderPrice: 15,
          extraNotificationPrice: 1
        },
        active: true,
        createdAt: now.toISOString(),
        updatedAt: now.toISOString()
      }
    ];
    db.subscriptionPlans.insertMany(plans);
  }

  // B. Subscriptions
  if (db.subscriptions.count() === 0) {
    const subscriptions: Subscription[] = [
      {
        id: 'sub-pat-1',
        subscriptionId: 'SUB10001',
        patientId: 'PAT10001',
        userId: 'usr-pat-1',
        planId: 'PLAN_PATIENT_PREMIUM',
        planName: 'Premium Patient Care',
        price: 299,
        billingCycle: 'MONTHLY',
        startDate: addDays(now, -30),
        endDate: addDays(now, 335),
        status: 'ACTIVE',
        autoRenew: true,
        paymentId: 'PAY10001',
        createdAt: addDays(now, -30),
        updatedAt: addDays(now, -30)
      },
      {
        id: 'sub-org-1',
        subscriptionId: 'SUB10002',
        organizationId: 'org-1',
        planId: 'PLAN_CLINIC_ORG',
        planName: 'Clinic / Organization Enterprise Plan',
        price: 4999,
        billingCycle: 'MONTHLY',
        startDate: addDays(now, -60),
        endDate: addDays(now, 305),
        status: 'ACTIVE',
        autoRenew: true,
        createdAt: addDays(now, -60),
        updatedAt: addDays(now, -60)
      }
    ];
    db.subscriptions.insertMany(subscriptions);
  }

  // C. Organization Licenses
  if (db.organizationLicenses.count() === 0) {
    const licenses: OrganizationLicense[] = [
      {
        id: 'lic-1',
        licenseId: 'LIC10001',
        organizationId: 'org-1',
        organizationName: 'Apollo Health Center',
        organizationType: 'HOSPITAL',
        planId: 'PLAN_CLINIC_ORG',
        planName: 'Clinic / Organization Enterprise Plan',
        licenseStartDate: addDays(now, -60),
        licenseEndDate: addDays(now, 305),
        status: 'ACTIVE',
        userLimit: 50,
        patientLimit: 1000,
        featuresEnabled: [
          'CLINICAL_PORTAL',
          'DIAGNOSTIC_ORDERS',
          'PRESCRIPTION_MANAGEMENT',
          'ITEMIZED_BILLING',
          'AUDIT_LOGGING'
        ],
        createdAt: addDays(now, -60),
        updatedAt: addDays(now, -60)
      },
      {
        id: 'lic-2',
        licenseId: 'LIC10002',
        organizationId: 'org-2',
        organizationName: 'Care Clinic East',
        organizationType: 'CLINIC',
        planId: 'PLAN_CLINIC_ORG',
        planName: 'Clinic / Organization Enterprise Plan',
        licenseStartDate: addDays(now, -350),
        licenseEndDate: addDays(now, 15),
        status: 'EXPIRING_SOON',
        userLimit: 15,
        patientLimit: 300,
        featuresEnabled: [
          'CLINICAL_PORTAL',
          'PRESCRIPTION_MANAGEMENT',
          'ITEMIZED_BILLING'
        ],
        createdAt: addDays(now, -350),
        updatedAt: addDays(now, -350)
      },
      {
        id: 'lic-3',
        licenseId: 'LIC10003',
        organizationId: 'LAB10001',
        organizationName: 'Apex Diagnostic Center & Imaging',
        organizationType: 'LAB',
        planId: 'PLAN_CLINIC_ORG',
        planName: 'Diagnostic Partner License',
        licenseStartDate: addDays(now, -120),
        licenseEndDate: addDays(now, 245),
        status: 'ACTIVE',
        userLimit: 20,
        patientLimit: 500,
        featuresEnabled: [
          'DIAGNOSTIC_ORDERS',
          'REPORT_PUBLISHING',
          'LAB_BILLING'
        ],
        createdAt: addDays(now, -120),
        updatedAt: now.toISOString()
      }
    ];
    db.organizationLicenses.insertMany(licenses);
  }

  // D. Usage Records
  if (db.usageRecords.count() === 0) {
    const usageRecords: UsageRecord[] = [
      {
        id: 'usg-1',
        organizationId: 'org-1',
        organizationName: 'Apollo Health Center',
        usageType: 'ACTIVE_PATIENTS',
        quantity: 240,
        includedQuantity: 1000,
        billableQuantity: 0,
        billingPeriod: '2026-09',
        unitPrice: 10,
        totalAmount: 0,
        createdAt: now.toISOString()
      },
      {
        id: 'usg-2',
        organizationId: 'org-1',
        organizationName: 'Apollo Health Center',
        usageType: 'STAFF_ACCOUNTS',
        quantity: 18,
        includedQuantity: 50,
        billableQuantity: 0,
        billingPeriod: '2026-09',
        unitPrice: 50,
        totalAmount: 0,
        createdAt: now.toISOString()
      },
      {
        id: 'usg-3',
        organizationId: 'org-1',
        organizationName: 'Apollo Health Center',
        usageType: 'PRESCRIPTIONS',
        quantity: 480,
        includedQuantity: 2000,
        billableQuantity: 0,
        billingPeriod: '2026-09',
        unitPrice: 5,
        totalAmount: 0,
        createdAt: now.toISOString()
      },
      {
        id: 'usg-4',
        organizationId: 'org-1',
        organizationName: 'Apollo Health Center',
        usageType: 'TEST_ORDERS',
        quantity: 120,
        includedQuantity: 1000,
        billableQuantity: 0,
        billingPeriod: '2026-09',
        unitPrice: 15,
        totalAmount: 0,
        createdAt: now.toISOString()
      },
      {
        id: 'usg-5',
        organizationId: 'org-1',
        organizationName: 'Apollo Health Center',
        usageType: 'REPORTS',
        quantity: 115,
        includedQuantity: 1000,
        billableQuantity: 0,
        billingPeriod: '2026-09',
        unitPrice: 10,
        totalAmount: 0,
        createdAt: now.toISOString()
      },
      {
        id: 'usg-6',
        organizationId: 'org-1',
        organizationName: 'Apollo Health Center',
        usageType: 'NOTIFICATIONS',
        quantity: 1240,
        includedQuantity: 10000,
        billableQuantity: 0,
        billingPeriod: '2026-09',
        unitPrice: 1,
        totalAmount: 0,
        createdAt: now.toISOString()
      }
    ];
    db.usageRecords.insertMany(usageRecords);
  }

  // E. Medication Supplies
  if (db.medicationSupplies.count() === 0) {
    const supplies: MedicationSupply[] = [
      {
        id: 'sup-1',
        patientId: 'PAT10001',
        patientName: 'Anjali Sharma',
        medicationId: 'med-1',
        medicationName: 'Paracetamol 500 mg',
        prescriptionId: 'RX10001',
        prescribingDoctorId: 'DOC10001',
        prescribingDoctorName: 'Dr. Ravi Kumar, MD',
        initialQuantity: 30,
        quantityDispensed: 30,
        quantityRemaining: 18,
        dailyUsage: 2,
        dispensedDate: addDays(now, -6),
        expectedDepletionDate: addDays(now, 9),
        refillThresholdDays: 7,
        refillDate: addDays(now, 9),
        refillStatus: 'NOT_DUE',
        notes: 'Adequate supply remaining (9 days left)',
        createdAt: addDays(now, -6),
        updatedAt: now.toISOString()
      },
      {
        id: 'sup-2',
        patientId: 'PAT10001',
        patientName: 'Anjali Sharma',
        medicationId: 'med-2',
        medicationName: 'Metformin 500 mg',
        prescriptionId: 'RX10001',
        prescribingDoctorId: 'DOC10001',
        prescribingDoctorName: 'Dr. Ravi Kumar, MD',
        initialQuantity: 60,
        quantityDispensed: 60,
        quantityRemaining: 10,
        dailyUsage: 2,
        dispensedDate: addDays(now, -25),
        expectedDepletionDate: addDays(now, 5),
        refillThresholdDays: 7,
        refillDate: addDays(now, 5),
        refillStatus: 'DUE_SOON',
        notes: 'Refill window approaching. 5 days remaining.',
        createdAt: addDays(now, -25),
        updatedAt: now.toISOString()
      },
      {
        id: 'sup-3',
        patientId: 'PAT10001',
        patientName: 'Anjali Sharma',
        medicationId: 'med-3',
        medicationName: 'Atorvastatin 20 mg',
        prescriptionId: 'RX10001',
        prescribingDoctorId: 'DOC10001',
        prescribingDoctorName: 'Dr. Ravi Kumar, MD',
        initialQuantity: 30,
        quantityDispensed: 30,
        quantityRemaining: 4,
        dailyUsage: 1,
        dispensedDate: addDays(now, -26),
        expectedDepletionDate: addDays(now, 4),
        refillThresholdDays: 7,
        refillDate: addDays(now, 4),
        refillStatus: 'REFILL_DUE',
        lastRefillRequestId: 'RFL10001',
        notes: 'Low stock warning! Refill request has been initiated.',
        createdAt: addDays(now, -26),
        updatedAt: now.toISOString()
      },
      {
        id: 'sup-4',
        patientId: 'PAT10001',
        patientName: 'Anjali Sharma',
        medicationId: 'med-4',
        medicationName: 'Metoprolol Succinate 25 mg',
        prescriptionId: 'RX10002',
        prescribingDoctorId: 'DOC10001',
        prescribingDoctorName: 'Dr. Ravi Kumar, MD',
        initialQuantity: 30,
        quantityDispensed: 30,
        quantityRemaining: 15,
        dailyUsage: 1,
        dispensedDate: addDays(now, -15),
        expectedDepletionDate: addDays(now, 15),
        refillThresholdDays: 7,
        refillDate: addDays(now, 15),
        refillStatus: 'NOT_DUE',
        notes: '15 doses remaining.',
        createdAt: addDays(now, -15),
        updatedAt: now.toISOString()
      }
    ];
    db.medicationSupplies.insertMany(supplies);
  }

  // F. Refill Requests
  if (db.refillRequests.count() === 0) {
    const refillRequests: RefillRequest[] = [
      {
        id: 'rfl-1',
        refillRequestId: 'RFL10001',
        patientId: 'PAT10001',
        patientName: 'Anjali Sharma',
        medicationId: 'med-3',
        medicationName: 'Atorvastatin 20 mg',
        prescriptionId: 'RX10001',
        doctorId: 'DOC10001',
        doctorName: 'Dr. Ravi Kumar, MD',
        pharmacyName: 'MedSafe Central Pharmacy',
        quantityRequested: 30,
        status: 'REQUESTED',
        notes: 'Patient submitted monthly refill. 4 doses remaining in active supply.',
        statusHistory: [
          {
            status: 'REQUESTED',
            changedBy: 'usr-pat-1',
            changedByRole: 'PATIENT',
            timestamp: addDays(now, -1) + 'T09:30:00Z',
            notes: 'Refill requested via patient portal'
          }
        ],
        requestedDate: addDays(now, -1),
        updatedAt: addDays(now, -1)
      }
    ];
    db.refillRequests.insertMany(refillRequests);
  }

  // G. Hospitals & Organizations check
  const org1 = db.organizations.findById('org-1');
  if (org1) {
    db.organizations.update('org-1', {
      name: 'ABC Hospital',
      hospitalId: 'HOSP-00125',
      type: 'HOSPITAL'
    });
  }
  const org2 = db.organizations.findById('org-2');
  if (org2) {
    db.organizations.update('org-2', {
      name: 'XYZ Hospital',
      hospitalId: 'HOSP-00482',
      type: 'HOSPITAL'
    });
  }

  // H. Doctor Council Registration IDs & Hospitals
  const docRavi = db.doctors.findOne(d => d.doctorId === 'DOC10001');
  if (docRavi) {
    db.doctors.update(docRavi.id, {
      councilRegistrationId: 'DOC-AP-123456',
      hospitalId: 'HOSP-00125',
      hospitalName: 'ABC Hospital'
    });
  }
  const docSneha = db.doctors.findOne(d => d.doctorId === 'DOC10002');
  if (docSneha) {
    db.doctors.update(docSneha.id, {
      councilRegistrationId: 'DOC-TS-789012',
      hospitalId: 'HOSP-00482',
      hospitalName: 'XYZ Hospital'
    });
  }
  const docAmit = db.doctors.findOne(d => d.doctorId === 'DOC10003');
  if (docAmit) {
    db.doctors.update(docAmit.id, {
      councilRegistrationId: 'DOC-MH-345678',
      hospitalId: 'HOSP-00125',
      hospitalName: 'ABC Hospital'
    });
  }

  // I. Receptionists
  if (db.receptionists.count() === 0) {
    const passwordHash = bcrypt.hashSync('password123', 10);
    
    // Ensure Users exist for receptionists
    if (!db.users.findOne(u => u.email === 'receptionist.abc@medsafe.local')) {
      db.users.insert({
        id: 'usr-rec-1',
        email: 'receptionist.abc@medsafe.local',
        passwordHash,
        role: 'RECEPTIONIST',
        name: 'Priya',
        phone: '+91 98765 00018',
        receptionistId: 'REC-0018',
        hospitalId: 'HOSP-00125',
        hospitalName: 'ABC Hospital',
        verificationStatus: 'VERIFIED',
        createdAt: now.toISOString(),
        updatedAt: now.toISOString()
      });
    }

    if (!db.users.findOne(u => u.email === 'receptionist.xyz@medsafe.local')) {
      db.users.insert({
        id: 'usr-rec-2',
        email: 'receptionist.xyz@medsafe.local',
        passwordHash,
        role: 'RECEPTIONIST',
        name: 'Anil',
        phone: '+91 98765 00091',
        receptionistId: 'REC-0091',
        hospitalId: 'HOSP-00482',
        hospitalName: 'XYZ Hospital',
        verificationStatus: 'VERIFIED',
        createdAt: now.toISOString(),
        updatedAt: now.toISOString()
      });
    }

    db.receptionists.insertMany([
      {
        id: 'rec-1',
        receptionistId: 'REC-0018',
        userId: 'usr-rec-1',
        hospitalId: 'HOSP-00125',
        hospitalName: 'ABC Hospital',
        name: 'Priya',
        email: 'receptionist.abc@medsafe.local',
        phone: '+91 98765 00018',
        status: 'ACTIVE',
        createdAt: now.toISOString(),
        updatedAt: now.toISOString()
      },
      {
        id: 'rec-2',
        receptionistId: 'REC-0091',
        userId: 'usr-rec-2',
        hospitalId: 'HOSP-00482',
        hospitalName: 'XYZ Hospital',
        name: 'Anil',
        email: 'receptionist.xyz@medsafe.local',
        phone: '+91 98765 00091',
        status: 'ACTIVE',
        createdAt: now.toISOString(),
        updatedAt: now.toISOString()
      }
    ]);
  }

  // Ensure Receptionist demo users and profiles exist
  if (db.receptionists.count() === 0) {
    db.receptionists.insertMany([
      {
        id: 'rec-1',
        receptionistId: 'REC-0018',
        userId: 'usr-rec-1',
        name: 'Priya Sharma',
        email: 'receptionist.abc@medsafe.local',
        phone: '+91 98765 11111',
        hospitalId: 'HOSP-00125',
        hospitalName: 'ABC Hospital',
        status: 'ACTIVE',
        createdAt: now.toISOString()
      },
      {
        id: 'rec-2',
        receptionistId: 'REC-0091',
        userId: 'usr-rec-2',
        name: 'Anil Verma',
        email: 'receptionist.xyz@medsafe.local',
        phone: '+91 98765 22222',
        hospitalId: 'HOSP-00482',
        hospitalName: 'XYZ Hospital',
        status: 'ACTIVE',
        createdAt: now.toISOString()
      }
    ]);
  }

  const existingRecUser = db.users.findOne(u => u.email === 'receptionist.abc@medsafe.local');
  if (!existingRecUser) {
    const saltSync = bcrypt.genSaltSync(10);
    const recHash = bcrypt.hashSync('DemoPass123!', saltSync);
    db.users.insertMany([
      {
        id: 'usr-rec-1',
        email: 'receptionist.abc@medsafe.local',
        passwordHash: recHash,
        role: 'RECEPTIONIST',
        name: 'Priya Sharma',
        phone: '+91 98765 11111',
        receptionistId: 'REC-0018',
        organizationId: 'org-1',
        hospitalId: 'HOSP-00125',
        hospitalName: 'ABC Hospital',
        verificationStatus: 'VERIFIED',
        createdAt: now.toISOString(),
        updatedAt: now.toISOString()
      },
      {
        id: 'usr-rec-2',
        email: 'receptionist.xyz@medsafe.local',
        passwordHash: recHash,
        role: 'RECEPTIONIST',
        name: 'Anil Verma',
        phone: '+91 98765 22222',
        receptionistId: 'REC-0091',
        organizationId: 'org-2',
        hospitalId: 'HOSP-00482',
        hospitalName: 'XYZ Hospital',
        verificationStatus: 'VERIFIED',
        createdAt: now.toISOString(),
        updatedAt: now.toISOString()
      }
    ]);
  }

  // J. Patient Hospital Relationships & Doctor Patient Relationships
  if (db.patientHospitalRelationships.count() === 0) {
    db.patientHospitalRelationships.insertMany([
      {
        id: 'phr-1',
        relationshipId: 'REL-HOSP-10001',
        patientId: 'PAT10001',
        hospitalId: 'HOSP-00125',
        hospitalName: 'ABC Hospital',
        receptionistId: 'REC-0018',
        status: 'ACTIVE',
        createdAt: addDays(now, -60)
      }
    ]);
  }

  if (db.doctorPatientRelationships.count() === 0) {
    db.doctorPatientRelationships.insertMany([
      {
        id: 'dpr-1',
        relationshipId: 'REL-DOC-10001',
        patientId: 'PAT10001',
        doctorId: 'DOC10001',
        doctorName: 'Dr. Ravi Kumar, MD',
        hospitalId: 'HOSP-00125',
        hospitalName: 'ABC Hospital',
        status: 'ACTIVE',
        createdAt: addDays(now, -60),
        acceptedBy: 'REC-0018',
        acceptedByRole: 'RECEPTIONIST',
        acceptedAt: addDays(now, -60)
      }
    ]);
  }

  // Update existing consultation requests with hospital information
  const reqs = db.consultationRequests.find();
  for (const r of reqs) {
    if (!r.hospitalId) {
      const doc = db.doctors.findOne(d => d.doctorId === r.doctorId);
      db.consultationRequests.update(r.id, {
        hospitalId: doc?.hospitalId || 'HOSP-00125',
        hospitalName: doc?.hospitalName || 'ABC Hospital'
      });
    }
  }
}

