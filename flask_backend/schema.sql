-- MedSafe SQLite Schema for Razorpay Integration
CREATE TABLE IF NOT EXISTS subscription_payments (
    id TEXT PRIMARY KEY,
    subscription_payment_id TEXT UNIQUE NOT NULL,
    user_id TEXT NOT NULL,
    patient_id TEXT NOT NULL,
    subscription_id TEXT NOT NULL,
    plan_id TEXT NOT NULL,
    plan_name TEXT NOT NULL,
    amount REAL NOT NULL,
    currency TEXT DEFAULT 'INR',
    razorpay_order_id TEXT UNIQUE NOT NULL,
    razorpay_payment_id TEXT UNIQUE NOT NULL,
    razorpay_signature TEXT NOT NULL,
    status TEXT NOT NULL,
    payment_method TEXT DEFAULT 'Razorpay',
    created_at TEXT NOT NULL,
    paid_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS bill_payments (
    id TEXT PRIMARY KEY,
    bill_payment_id TEXT UNIQUE NOT NULL,
    bill_id TEXT NOT NULL,
    patient_id TEXT NOT NULL,
    organization_id TEXT,
    amount REAL NOT NULL,
    currency TEXT DEFAULT 'INR',
    razorpay_order_id TEXT UNIQUE NOT NULL,
    razorpay_payment_id TEXT UNIQUE NOT NULL,
    razorpay_signature TEXT NOT NULL,
    status TEXT NOT NULL,
    payment_method TEXT DEFAULT 'Razorpay',
    created_at TEXT NOT NULL,
    paid_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS subscriptions (
    id TEXT PRIMARY KEY,
    subscription_id TEXT UNIQUE NOT NULL,
    user_id TEXT,
    patient_id TEXT UNIQUE NOT NULL,
    plan_id TEXT NOT NULL,
    plan_name TEXT NOT NULL,
    price REAL NOT NULL,
    billing_cycle TEXT NOT NULL,
    start_date TEXT NOT NULL,
    end_date TEXT NOT NULL,
    renewal_date TEXT NOT NULL,
    status TEXT NOT NULL,
    auto_renew INTEGER DEFAULT 1,
    razorpay_payment_id TEXT,
    family_members_limit INTEGER DEFAULT 0,
    family_members_count INTEGER DEFAULT 0,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS family_members (
    id TEXT PRIMARY KEY,
    primary_patient_id TEXT NOT NULL,
    name TEXT NOT NULL,
    relationship TEXT NOT NULL,
    phone TEXT,
    email TEXT,
    status TEXT DEFAULT 'ACTIVE',
    created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS bills (
    id TEXT PRIMARY KEY,
    bill_id TEXT UNIQUE NOT NULL,
    patient_id TEXT NOT NULL,
    patient_name TEXT,
    clinic_id TEXT,
    clinic_name TEXT,
    lab_id TEXT,
    lab_name TEXT,
    doctor_id TEXT,
    doctor_name TEXT,
    description TEXT,
    subtotal REAL NOT NULL,
    tax REAL DEFAULT 0,
    discount REAL DEFAULT 0,
    total_amount REAL NOT NULL,
    status TEXT NOT NULL DEFAULT 'PENDING',
    bill_date TEXT NOT NULL,
    due_date TEXT NOT NULL,
    paid_at TEXT,
    payment_reference TEXT
);

CREATE TABLE IF NOT EXISTS organization_payments (
    id TEXT PRIMARY KEY,
    organization_payment_id TEXT UNIQUE NOT NULL,
    organization_id TEXT NOT NULL,
    organization_name TEXT,
    payment_type TEXT NOT NULL, -- 'LICENSE' | 'USAGE'
    reference_id TEXT NOT NULL,
    amount REAL NOT NULL,
    currency TEXT DEFAULT 'INR',
    razorpay_order_id TEXT UNIQUE NOT NULL,
    razorpay_payment_id TEXT UNIQUE NOT NULL,
    razorpay_signature TEXT NOT NULL,
    status TEXT NOT NULL,
    payment_method TEXT DEFAULT 'Razorpay',
    created_at TEXT NOT NULL,
    paid_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS webhook_events (
    id TEXT PRIMARY KEY,
    event_id TEXT UNIQUE NOT NULL,
    event_type TEXT NOT NULL,
    entity_id TEXT NOT NULL,
    payload TEXT NOT NULL,
    status TEXT NOT NULL,
    created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_sub_payments_patient ON subscription_payments(patient_id);
CREATE INDEX IF NOT EXISTS idx_bill_payments_patient ON bill_payments(patient_id);
CREATE INDEX IF NOT EXISTS idx_family_members_patient ON family_members(primary_patient_id);
CREATE INDEX IF NOT EXISTS idx_org_payments_org ON organization_payments(organization_id);
