"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authController = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const uuid_1 = require("uuid");
const db_1 = require("../database/db");
const config_1 = require("../config");
exports.authController = {
    login: async (req, res) => {
        try {
            const { email, password, role } = req.body;
            if (!email || !password) {
                res.status(400).json({ success: false, message: 'Email and password are required.' });
                return;
            }
            const user = db_1.db.users.findOne(u => u.email.toLowerCase() === email.toLowerCase());
            if (!user) {
                res.status(401).json({ success: false, message: 'Invalid credentials or user not found.' });
                return;
            }
            // Check role if specified
            if (role && user.role !== role) {
                res.status(401).json({ success: false, message: `Account does not match selected role: ${role}.` });
                return;
            }
            const isMatch = await bcryptjs_1.default.compare(password, user.passwordHash);
            if (!isMatch) {
                res.status(401).json({ success: false, message: 'Invalid email or password.' });
                return;
            }
            const payload = {
                id: user.id,
                email: user.email,
                role: user.role,
                name: user.name,
                patientId: user.patientId,
                doctorId: user.doctorId,
                caregiverId: user.caregiverId,
                pharmacistId: user.pharmacistId,
                labId: user.labId,
                organizationId: user.organizationId,
                clinicId: user.clinicId,
                receptionistId: user.receptionistId,
                hospitalId: user.hospitalId,
                hospitalName: user.hospitalName,
                councilRegistrationId: user.councilRegistrationId,
                verificationStatus: user.verificationStatus || 'VERIFIED'
            };
            const token = jsonwebtoken_1.default.sign(payload, config_1.config.jwtSecret, { expiresIn: '7d' });
            res.json({
                success: true,
                data: {
                    token,
                    user: payload
                }
            });
        }
        catch (error) {
            console.error('Login error:', error);
            res.status(500).json({ success: false, message: 'An unexpected server error occurred.' });
        }
    },
    registerPatient: async (req, res) => {
        try {
            const { name, email, password, dob, gender, phone, address, emergencyContactName, emergencyContactPhone, emergencyContactRel } = req.body;
            if (!name || !email || !password) {
                res.status(400).json({ success: false, message: 'Name, email, and password are required.' });
                return;
            }
            const existingUser = db_1.db.users.findOne(u => u.email.toLowerCase() === email.toLowerCase());
            if (existingUser) {
                res.status(400).json({ success: false, message: 'An account with this email already exists.' });
                return;
            }
            // Generate unique sequential Patient ID
            const allPatients = db_1.db.patients.find();
            const allRequests = db_1.db.consultationRequests.find();
            let maxNum = 10001;
            for (const p of allPatients) {
                const match = p.patientId?.match(/PAT(\d+)/);
                if (match) {
                    const num = parseInt(match[1], 10);
                    if (num >= maxNum)
                        maxNum = num + 1;
                }
            }
            for (const r of allRequests) {
                const match = r.patientId?.match(/PAT(\d+)/);
                if (match) {
                    const num = parseInt(match[1], 10);
                    if (num >= maxNum)
                        maxNum = num + 1;
                }
            }
            const newPatientId = `PAT${maxNum}`;
            const salt = await bcryptjs_1.default.genSalt(10);
            const passwordHash = await bcryptjs_1.default.hash(password, salt);
            const now = new Date().toISOString();
            const newUser = {
                id: `usr-pat-${Date.now()}`,
                email: email.toLowerCase(),
                passwordHash,
                role: 'PATIENT',
                name,
                phone: phone || '',
                patientId: newPatientId,
                verificationStatus: 'VERIFIED',
                createdAt: now,
                updatedAt: now
            };
            db_1.db.users.insert(newUser);
            const newPatient = {
                id: `pat-${Date.now()}`,
                patientId: newPatientId,
                userId: newUser.id,
                name,
                dob: dob || '1995-01-01',
                gender: (gender || 'OTHER'),
                email: email.toLowerCase(),
                phone: phone || '',
                address: address || 'Not specified',
                emergencyContact: {
                    name: emergencyContactName || 'Emergency Contact',
                    relationship: emergencyContactRel || 'Family',
                    phone: emergencyContactPhone || phone || ''
                },
                registeredDate: now.split('T')[0],
                caregiverIds: [],
                doctorIds: [],
                clinicIds: []
            };
            db_1.db.patients.insert(newPatient);
            const payload = {
                id: newUser.id,
                email: newUser.email,
                role: 'PATIENT',
                name: newUser.name,
                patientId: newPatientId,
                verificationStatus: 'VERIFIED'
            };
            const token = jsonwebtoken_1.default.sign(payload, config_1.config.jwtSecret, { expiresIn: '7d' });
            res.status(201).json({
                success: true,
                data: {
                    token,
                    user: payload,
                    patient: newPatient,
                    message: `Registration successful! Your unique Patient ID is ${newPatientId}.`
                }
            });
        }
        catch (error) {
            console.error('registerPatient error:', error);
            res.status(500).json({ success: false, message: error.message });
        }
    },
    // Multi-Role Direct Registration for Doctor, Pharmacist, Lab, Clinic, Caregiver
    registerProfessional: async (req, res) => {
        try {
            const { role, name, email, password, phone, licenseNumber, specialty, clinicId, clinicName, pharmacyName, address, testCapabilities, relationship } = req.body;
            if (!role || !name || !email || !password) {
                res.status(400).json({ success: false, message: 'Role, name, email, and password are required.' });
                return;
            }
            const existingUser = db_1.db.users.findOne(u => u.email.toLowerCase() === email.toLowerCase());
            if (existingUser) {
                res.status(400).json({ success: false, message: 'An account with this email already exists.' });
                return;
            }
            const salt = await bcryptjs_1.default.genSalt(10);
            const passwordHash = await bcryptjs_1.default.hash(password, salt);
            const now = new Date().toISOString();
            const userId = `usr-${role.toLowerCase()}-${Date.now()}`;
            // Default verification status: PENDING for professionals/facilities, VERIFIED for caregivers
            const verificationStatus = role === 'CAREGIVER' ? 'VERIFIED' : 'PENDING';
            let doctorId;
            let pharmacistId;
            let labId;
            let caregiverId;
            let receptionistId;
            let newClinicId;
            let hospitalIdVal;
            let hospitalNameVal;
            let councilRegistrationIdVal;
            if (role === 'DOCTOR') {
                const { councilRegistrationId, hospitalId, hospitalName } = req.body;
                const councilId = councilRegistrationId || licenseNumber;
                if (!councilId) {
                    res.status(400).json({ success: false, message: 'Professional/Council Registration ID is required for doctor registration.' });
                    return;
                }
                const existingCouncil = db_1.db.doctors.findOne(d => Boolean((d.councilRegistrationId && d.councilRegistrationId.toLowerCase() === councilId.toLowerCase()) ||
                    (d.licenseNumber && d.licenseNumber.toLowerCase() === councilId.toLowerCase())));
                if (existingCouncil) {
                    res.status(400).json({ success: false, message: `Council/Registration ID "${councilId}" is already registered to another doctor.` });
                    return;
                }
                const allDocs = db_1.db.doctors.find();
                let maxNum = 10001;
                for (const d of allDocs) {
                    const match = d.doctorId?.match(/DOC(\d+)/);
                    if (match) {
                        const num = parseInt(match[1], 10);
                        if (num >= maxNum)
                            maxNum = num + 1;
                    }
                }
                doctorId = `DOC${maxNum}`;
                const hospId = hospitalId || 'HOSP-00125';
                const org = db_1.db.organizations.findOne(o => o.hospitalId === hospId || o.id === hospId);
                const hospName = org?.name || hospitalName || 'ABC Hospital';
                hospitalIdVal = hospId;
                hospitalNameVal = hospName;
                councilRegistrationIdVal = councilId;
                db_1.db.doctors.insert({
                    id: `doc-${(0, uuid_1.v4)().substring(0, 8)}`,
                    doctorId,
                    userId,
                    name,
                    specialty: specialty || 'General Medicine',
                    councilRegistrationId: councilId,
                    hospitalId: hospId,
                    hospitalName: hospName,
                    clinicId: clinicId || 'clin-1',
                    organizationId: org?.id || 'org-1',
                    phone: phone || '',
                    email: email.toLowerCase(),
                    licenseNumber: councilId,
                    verificationStatus: 'VERIFIED',
                    authorizedPatientIds: []
                });
            }
            else if (role === 'RECEPTIONIST') {
                const { hospitalId, hospitalName } = req.body;
                const allRecs = db_1.db.receptionists.find();
                let maxNum = 1000;
                for (const r of allRecs) {
                    const match = r.receptionistId?.match(/REC-?(\d+)/);
                    if (match) {
                        const num = parseInt(match[1], 10);
                        if (num >= maxNum)
                            maxNum = num + 1;
                    }
                }
                receptionistId = `REC-${maxNum}`;
                const hospId = hospitalId || 'HOSP-00125';
                const org = db_1.db.organizations.findOne(o => o.hospitalId === hospId || o.id === hospId);
                const hospName = org?.name || hospitalName || 'ABC Hospital';
                hospitalIdVal = hospId;
                hospitalNameVal = hospName;
                db_1.db.receptionists.insert({
                    id: `rec-${(0, uuid_1.v4)().substring(0, 8)}`,
                    receptionistId,
                    userId,
                    hospitalId: hospId,
                    hospitalName: hospName,
                    name,
                    email: email.toLowerCase(),
                    phone: phone || '',
                    status: 'ACTIVE',
                    createdAt: now,
                    updatedAt: now
                });
            }
            else if (role === 'PHARMACIST') {
                const allPhas = db_1.db.pharmacists.find();
                let maxNum = 10001;
                for (const p of allPhas) {
                    const match = p.pharmacistId?.match(/PHA(\d+)/);
                    if (match) {
                        const num = parseInt(match[1], 10);
                        if (num >= maxNum)
                            maxNum = num + 1;
                    }
                }
                pharmacistId = `PHA${maxNum}`;
                db_1.db.pharmacists.insert({
                    id: `pha-${(0, uuid_1.v4)().substring(0, 8)}`,
                    pharmacistId,
                    userId,
                    name,
                    email: email.toLowerCase(),
                    phone: phone || '',
                    pharmacyName: pharmacyName || `${name}'s MedSafe Pharmacy`,
                    organizationId: 'ORG10001',
                    licenseNumber: licenseNumber || `PHAR-LIC-${maxNum}`,
                    verificationStatus,
                    authorizedPatientIds: []
                });
            }
            else if (role === 'LAB') {
                const allLabs = db_1.db.labs.find();
                let maxNum = 10001;
                for (const l of allLabs) {
                    const match = l.labId?.match(/LAB(\d+)/);
                    if (match) {
                        const num = parseInt(match[1], 10);
                        if (num >= maxNum)
                            maxNum = num + 1;
                    }
                }
                labId = `LAB${maxNum}`;
                db_1.db.labs.insert({
                    id: `lab-${(0, uuid_1.v4)().substring(0, 8)}`,
                    labId,
                    userId,
                    name,
                    email: email.toLowerCase(),
                    phone: phone || '',
                    address: address || 'Healthcare Diagnostics Block, City Center',
                    licenseNumber: licenseNumber || `LAB-CERT-${maxNum}`,
                    testCapabilities: Array.isArray(testCapabilities) ? testCapabilities : [
                        'CBC Blood Test (Complete Blood Count)',
                        'Lipid Profile (Cholesterol & Triglycerides)',
                        'Chest X-Ray (PA View)',
                        'HbA1c (Glycated Hemoglobin)',
                        'Liver Function Test (LFT)',
                        'Kidney Function Test (KFT/RFT)'
                    ],
                    verificationStatus,
                    organizationId: 'ORG10001'
                });
            }
            else if (role === 'CLINIC' || role === 'HOSPITAL') {
                const allClinics = db_1.db.clinics.find();
                let maxNum = 10001;
                for (const c of allClinics) {
                    const match = c.id?.match(/CLN(\d+)/);
                    if (match) {
                        const num = parseInt(match[1], 10);
                        if (num >= maxNum)
                            maxNum = num + 1;
                    }
                }
                newClinicId = `CLN${maxNum}`;
                db_1.db.clinics.insert({
                    id: newClinicId,
                    organizationId: 'ORG10001',
                    name: clinicName || name,
                    location: address || 'Healthcare Blvd',
                    phone: phone || ''
                });
            }
            else if (role === 'CAREGIVER') {
                const allCars = db_1.db.caregivers.find();
                let maxNum = 10001;
                for (const c of allCars) {
                    const match = c.caregiverId?.match(/CAR(\d+)/);
                    if (match) {
                        const num = parseInt(match[1], 10);
                        if (num >= maxNum)
                            maxNum = num + 1;
                    }
                }
                caregiverId = `CAR${maxNum}`;
                db_1.db.caregivers.insert({
                    id: `car-${(0, uuid_1.v4)().substring(0, 8)}`,
                    caregiverId,
                    userId,
                    name,
                    email: email.toLowerCase(),
                    phone: phone || '',
                    relationship: relationship || 'Family Member',
                    authorizedPatientIds: []
                });
            }
            const newUser = {
                id: userId,
                email: email.toLowerCase(),
                passwordHash,
                role: role,
                name,
                phone: phone || '',
                doctorId,
                pharmacistId,
                labId,
                caregiverId,
                receptionistId,
                hospitalId: hospitalIdVal,
                hospitalName: hospitalNameVal,
                councilRegistrationId: councilRegistrationIdVal,
                clinicId: clinicId || newClinicId,
                verificationStatus,
                licenseNumber,
                createdAt: now,
                updatedAt: now
            };
            db_1.db.users.insert(newUser);
            // Notify Admins about new registration pending verification
            const adminUsers = db_1.db.users.find(u => u.role === 'ADMIN');
            for (const admin of adminUsers) {
                db_1.db.notifications.insert({
                    id: `notif-${(0, uuid_1.v4)().substring(0, 8)}`,
                    recipientId: admin.id,
                    recipientRole: 'ADMIN',
                    patientId: '',
                    type: 'VERIFICATION_STATUS',
                    title: `New ${role} Registration: ${name}`,
                    message: `${name} has registered as a ${role} (License: ${licenseNumber || councilRegistrationIdVal || 'N/A'}). Verification is ${verificationStatus}.`,
                    metadata: { userId, role, verificationStatus },
                    readStatus: false,
                    deliveryStatus: 'DELIVERED',
                    createdAt: now
                });
            }
            const payload = {
                id: newUser.id,
                email: newUser.email,
                role: newUser.role,
                name: newUser.name,
                doctorId,
                pharmacistId,
                labId,
                caregiverId,
                receptionistId,
                hospitalId: hospitalIdVal,
                hospitalName: hospitalNameVal,
                councilRegistrationId: councilRegistrationIdVal,
                clinicId: newUser.clinicId,
                verificationStatus
            };
            const token = jsonwebtoken_1.default.sign(payload, config_1.config.jwtSecret, { expiresIn: '7d' });
            res.status(201).json({
                success: true,
                data: {
                    token,
                    user: payload,
                    verificationStatus,
                    message: verificationStatus === 'PENDING'
                        ? `Registration received! Your ${role} profile is currently PENDING administrative credential verification.`
                        : `Registration successful as ${role}.`
                }
            });
        }
        catch (error) {
            console.error('registerProfessional error:', error);
            res.status(500).json({ success: false, message: error.message });
        }
    },
    getCurrentUser: async (req, res) => {
        try {
            if (!req.user) {
                res.status(401).json({ success: false, message: 'Unauthorized.' });
                return;
            }
            // Fetch latest verificationStatus from db
            const dbUser = db_1.db.users.findById(req.user.id);
            const userPayload = {
                ...req.user,
                verificationStatus: dbUser?.verificationStatus || req.user.verificationStatus || 'VERIFIED'
            };
            res.json({ success: true, data: { user: userPayload } });
        }
        catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    },
    // Instant 1-click Demo Switcher
    demoSwitch: async (req, res) => {
        try {
            const { role, email, hospitalId } = req.body;
            let user;
            if (email) {
                user = db_1.db.users.findOne(u => u.email.toLowerCase() === String(email).toLowerCase());
            }
            else if (hospitalId && role) {
                user = db_1.db.users.findOne(u => u.role === role && u.hospitalId === hospitalId);
            }
            else {
                const targetRole = (role || 'PATIENT');
                user = db_1.db.users.findOne(u => u.role === targetRole);
            }
            if (!user) {
                res.status(404).json({ success: false, message: `No demo account found.` });
                return;
            }
            const payload = {
                id: user.id,
                email: user.email,
                role: user.role,
                name: user.name,
                patientId: user.patientId,
                doctorId: user.doctorId,
                caregiverId: user.caregiverId,
                pharmacistId: user.pharmacistId,
                labId: user.labId,
                receptionistId: user.receptionistId,
                hospitalId: user.hospitalId,
                hospitalName: user.hospitalName,
                councilRegistrationId: user.councilRegistrationId,
                organizationId: user.organizationId,
                clinicId: user.clinicId,
                verificationStatus: user.verificationStatus || 'VERIFIED'
            };
            const token = jsonwebtoken_1.default.sign(payload, config_1.config.jwtSecret, { expiresIn: '7d' });
            res.json({
                success: true,
                data: {
                    token,
                    user: payload,
                    message: `Switched to ${user.name} (${user.role}) demo profile.`
                }
            });
        }
        catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }
};
