"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.db = exports.Database = exports.Collection = void 0;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const config_1 = require("../config");
class Collection {
    items = [];
    filePath;
    tableName;
    constructor(tableName, dataDir) {
        this.tableName = tableName;
        this.filePath = path_1.default.join(dataDir, `${tableName}.json`);
        this.load();
    }
    load() {
        try {
            if (!fs_1.default.existsSync(path_1.default.dirname(this.filePath))) {
                fs_1.default.mkdirSync(path_1.default.dirname(this.filePath), { recursive: true });
            }
            if (fs_1.default.existsSync(this.filePath)) {
                const raw = fs_1.default.readFileSync(this.filePath, 'utf-8');
                this.items = JSON.parse(raw);
            }
            else {
                this.items = [];
                this.save();
            }
        }
        catch (err) {
            console.error(`Error loading table ${this.tableName}:`, err);
            this.items = [];
        }
    }
    save() {
        try {
            const dir = path_1.default.dirname(this.filePath);
            if (!fs_1.default.existsSync(dir)) {
                fs_1.default.mkdirSync(dir, { recursive: true });
            }
            const tmpPath = `${this.filePath}.tmp`;
            fs_1.default.writeFileSync(tmpPath, JSON.stringify(this.items, null, 2), 'utf-8');
            fs_1.default.renameSync(tmpPath, this.filePath);
        }
        catch (err) {
            console.error(`Error saving table ${this.tableName}:`, err);
        }
    }
    find(predicate) {
        if (!predicate)
            return [...this.items];
        return this.items.filter(predicate);
    }
    findOne(predicate) {
        return this.items.find(predicate);
    }
    findById(id) {
        return this.items.find(item => item.id === id);
    }
    insert(item) {
        this.items.push(item);
        this.save();
        return item;
    }
    insertMany(newItems) {
        this.items.push(...newItems);
        this.save();
        return newItems;
    }
    update(id, updates) {
        const index = this.items.findIndex(item => item.id === id);
        if (index === -1)
            return undefined;
        this.items[index] = { ...this.items[index], ...updates };
        this.save();
        return this.items[index];
    }
    delete(id) {
        const initialLen = this.items.length;
        this.items = this.items.filter(item => item.id !== id);
        if (this.items.length !== initialLen) {
            this.save();
            return true;
        }
        return false;
    }
    clear() {
        this.items = [];
        this.save();
    }
    count(predicate) {
        if (!predicate)
            return this.items.length;
        return this.items.filter(predicate).length;
    }
}
exports.Collection = Collection;
class Database {
    users;
    patients;
    doctors;
    caregivers;
    pharmacists;
    organizations;
    clinics;
    medications;
    medicationPlanHistory;
    prescriptions;
    medicationSchedules;
    adherenceRecords;
    notifications;
    followUpActions;
    safetyAlerts;
    medicationReferences;
    consents;
    auditLogs;
    consultationRequests;
    consultations;
    labs;
    testOrders;
    medicalReports;
    bills;
    payments;
    medicationSupplies;
    refillRequests;
    subscriptionPlans;
    subscriptions;
    organizationLicenses;
    usageRecords;
    receptionists;
    patientHospitalRelationships;
    doctorPatientRelationships;
    constructor(dataDir = config_1.config.dataDir) {
        this.users = new Collection('users', dataDir);
        this.patients = new Collection('patients', dataDir);
        this.doctors = new Collection('doctors', dataDir);
        this.caregivers = new Collection('caregivers', dataDir);
        this.pharmacists = new Collection('pharmacists', dataDir);
        this.organizations = new Collection('organizations', dataDir);
        this.clinics = new Collection('clinics', dataDir);
        this.medications = new Collection('medications', dataDir);
        this.medicationPlanHistory = new Collection('medication_plan_history', dataDir);
        this.prescriptions = new Collection('prescriptions', dataDir);
        this.medicationSchedules = new Collection('medication_schedules', dataDir);
        this.adherenceRecords = new Collection('adherence_records', dataDir);
        this.notifications = new Collection('notifications', dataDir);
        this.followUpActions = new Collection('follow_up_actions', dataDir);
        this.safetyAlerts = new Collection('safety_alerts', dataDir);
        this.medicationReferences = new Collection('medication_references', dataDir);
        this.consents = new Collection('consents', dataDir);
        this.auditLogs = new Collection('audit_logs', dataDir);
        this.consultationRequests = new Collection('consultation_requests', dataDir);
        this.consultations = new Collection('consultations', dataDir);
        this.labs = new Collection('labs', dataDir);
        this.testOrders = new Collection('test_orders', dataDir);
        this.medicalReports = new Collection('medical_reports', dataDir);
        this.bills = new Collection('bills', dataDir);
        this.payments = new Collection('payments', dataDir);
        this.medicationSupplies = new Collection('medication_supplies', dataDir);
        this.refillRequests = new Collection('refill_requests', dataDir);
        this.subscriptionPlans = new Collection('subscription_plans', dataDir);
        this.subscriptions = new Collection('subscriptions', dataDir);
        this.organizationLicenses = new Collection('organization_licenses', dataDir);
        this.usageRecords = new Collection('usage_records', dataDir);
        this.receptionists = new Collection('receptionists', dataDir);
        this.patientHospitalRelationships = new Collection('patient_hospital_relationships', dataDir);
        this.doctorPatientRelationships = new Collection('doctor_patient_relationships', dataDir);
    }
    clearAll() {
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
exports.Database = Database;
exports.db = new Database();
