# MedSafe — Medication Management, Adherence & Safety Coordination Platform

**Swarnandhra College Hackathon 2026 — Problem Statement 2**

> **Tagline:** *"Manage medications. Stay on schedule. Stay connected."*

MedSafe is an enterprise-grade healthcare coordination and medication adherence web application. It connects patients, prescribing clinicians, authorized caregivers, and dispensing pharmacists into a unified, safety-first ecosystem with real-time intake tracking, automated grace period classification, versioned medication plans, and rule-based safety intelligence.

---

## 🛡️ Critical Healthcare Safety Boundary

MedSafe is an adherence coordination and decision-support platform. It strictly enforces medical safety boundaries:

- **NEVER** independently changes medication dosages.
- **NEVER** stops or starts medications automatically.
- **NEVER** replaces a licensed doctor or pharmacist.
- **NEVER** provides medical diagnosis or unverified personalized medical advice.

Every safety intelligence signal and interaction alert is presented as:

> **"Possible concern detected — professional review recommended. This is a safety-support signal, not a medical diagnosis. Please consult your doctor/pharmacist before making medication changes."**

---

## 🚀 Key Features by Stage

### Phase 1 — Functional MVP / POC
- **Authentication & RBAC:** Role-based access control with secure bcrypt password hashing and JWT authorization for 5 distinct roles: `PATIENT`, `DOCTOR`, `CAREGIVER`, `PHARMACIST`, and `ADMIN`.
- **Unique Patient Identification:** Strict identification format (e.g. `PAT10001`) with ownership and consent verification.
- **Patient Profile:** Complete demographic, emergency contact, and clinical metadata.
- **Active Medication Plan:** Interactive dashboard displaying today's regimen with food intake directives and prescribing doctor attribution.
- **Real-Time Reminder Engine:** Continuous schedule evaluation with browser notifications and in-app reminder dialogs.
- **Configurable Grace Period (30 min):**
  - Taken within 30 min $\rightarrow$ **Taken — On Time**
  - Taken after 30 min $\rightarrow$ **Taken — Late**
  - Not taken after grace period $\rightarrow$ **Missed**
- **Non-Judgmental Missed Dose Handling:** Educational safety guidance without advising dangerous double doses.
- **Adherence Tracking & Analytics:** Real-time formula $\frac{\text{Taken}}{\text{Total Scheduled}} \times 100$, daily breakdown, and weekly trend charts.
- **Rule-Based Safety Signals:**
  - Duplicate medication record detection (e.g., Crocin + Paracetamol).
  - Incomplete medication details flagging.
  - Stale/expired prescription warning.
  - Drug-drug conflict detection against reference catalog.
- **Follow-Up Engine:** Automatically logs clinical action items when missed dose thresholds are breached.

### Phase 2 — Productized Medication Coordination Platform
- **Multiple Medication Support:** Regimens clustered by time of day (**Morning**, **Afternoon**, **Evening**, **Night**) supporting Daily, Twice Daily, Weekly, and Custom frequencies.
- **Medication Plan Versioning & History:** Preserves historical plans (`Plan v1 -> Plan v2`) recording who changed it, timestamp, reason, previous and new values. Automatically alerts the patient: *"Your medication plan has been updated by your healthcare provider."*
- **Prescription Lifecycle & Refills:** Active, Expiring, and Expired status management with 1-click renewal and pharmacy dispensing event tracking.
- **Caregiver Collaboration:** Patient-controlled consent granting read-only schedule visibility and real-time missed dose alerts. Patients can revoke access at any time.
- **Doctor Workflow:** Search patients by ID (`PAT10001`), add medications + prescriptions, adjust plans with clinical reasons, and log follow-up instructions.
- **Pharmacist Workflow:** Refill queue inspection, drug conflict checking, refill recording, and clinical review notes logging.
- **Admin & Organization Management:** Multi-tier hospital/clinic hierarchy, global user search, drug interaction reference management, and immutable audit logs.
- **Centralized Notification Center:** Real-time drawer tracking reminders, plan updates, late doses, and safety signals.
- **Configurable Email Notifications:** SMTP integration with mock fallback logger for offline evaluation.
- **Adherence Risk Scoring:** Calculates patient vulnerability (`LOW`, `MEDIUM`, `HIGH`) with non-diagnostic clinical context.
- **Demo / Test Mode Toolbar:** Floating hackathon controller offering 1-click role switching, instant reminder simulation, missed dose generation, and database reset.

---

## 🏗️ Architecture & Technology Stack

```
+---------------------------------------------------------------------------------+
|                                Frontend (Vite + React + TS)                     |
|  - React 18, TypeScript, Tailwind CSS, Lucide Icons, Recharts                   |
|  - Patient Dashboard, Doctor Portal, Caregiver Hub, Pharmacist Queue, Admin     |
|  - Real-time Reminder Modal, Notifications Drawer, Floating Demo Toolbar       |
+---------------------------------------------------------------------------------+
                                         | REST APIs (JWT Auth, RBAC, Ownership)
                                         v
+---------------------------------------------------------------------------------+
|                                Backend (Node.js + Express + TS)                 |
|  - Express, TypeScript, JWT, bcryptjs, Nodemailer, UUID                         |
|  - Services: ReminderTicker, AdherenceEngine, SafetyEngine, EmailService        |
|  - Middleware: authMiddleware, rbacMiddleware, auditMiddleware, errorHandler   |
+---------------------------------------------------------------------------------+
                                         | Persistent Atomic JSON Store
                                         v
+---------------------------------------------------------------------------------+
|                        Persistent Data Storage (data/*.json)                    |
|  - Users, Patients, Doctors, Caregivers, Pharmacists, Organizations, Clinics   |
|  - Medications, PlanHistory, Prescriptions, Schedules, AdherenceRecords       |
|  - Notifications, FollowUps, SafetyAlerts, DrugReferences, Consents, AuditLogs |
+---------------------------------------------------------------------------------+
```

---

## ⚡ Quick Start & Setup

### Prerequisites
- Node.js (v18+) and npm installed.

### 1. Unified Run (Production Mode)
The backend automatically builds and serves the frontend on a single unified port:

```bash
# In backend directory
cd backend
npm install
npm run seed       # Seeds realistic demo data
npm run build      # Builds TypeScript backend
node dist/server.js
```

Open your browser at:
👉 **`http://localhost:5000`**

### 2. Development Mode (Hot-Reloading)
Run backend and frontend independently:

```bash
# Terminal 1: Backend API
cd backend
npm run dev        # Runs on http://localhost:5000

# Terminal 2: Frontend Vite Server
cd frontend
npm run dev        # Runs on http://localhost:3000 (proxies to :5000)
```

---

## 👥 Pre-Configured Demo Accounts

All demo accounts use password: **`password123`**

| Role | Name | Email | Reference ID |
| :--- | :--- | :--- | :--- |
| **Patient** | Anjali Sharma | `anjali@medsafe.local` | `PAT10001` |
| **Doctor** | Dr. Ravi Kumar, MD | `dr.ravi@medsafe.local` | `DOC10001` |
| **Caregiver** | Priya Sharma | `priya@medsafe.local` | `CAR10001` |
| **Pharmacist** | Suresh Reddy, RPh | `suresh@medsafe.local` | `PHA10001` |
| **Admin** | Rajesh Varma | `admin@medsafe.local` | `ADM10001` |

> 💡 **Tip:** You can switch between any of these accounts in 1 click using the landing page cards or the persistent **Demo Toolbar** at the bottom of the screen!

---

## 📋 Evaluation Demo Scripts

### Phase 1 Demo Script
1. **Login as Doctor**: Click **Doctor (Dr. Ravi)** on the Demo Toolbar or login with `dr.ravi@medsafe.local`.
2. **Search Patient**: Enter `PAT10001` in the search bar and click on **Anjali Sharma**.
3. **Add Medication**: Click **+ Add Medication**, enter medicine name (e.g. `Amoxicillin 500 mg`), dosage `1 tablet`, frequency `Twice Daily`, and validity `30 days`. Click **Save**.
4. **Observe Schedule**: 7 days of scheduled intakes are automatically generated.
5. **Switch to Patient**: Click **Patient (Anjali)** on the Demo Toolbar.
6. **Inspect Today's Plan**: See medications organized by Morning, Afternoon, Evening, Night.
7. **Simulate Reminder**: Click **Test Reminder** on the Demo Toolbar. The **Medication Reminder Modal** pops up with medicine details and intake instructions.
8. **Mark Dose as TAKEN**: Click the green **TAKEN** button. Notice real-time transition to **Taken — On Time** or **Taken — Late** with exact timestamp.
9. **Simulate Missed Dose**: Click **Trigger Missed** on the Demo Toolbar. Observe status becoming **Missed** and adherence percentage recalculating.
10. **View Safety Signals & Follow-Up**: Notice the duplicate medication warning (Paracetamol + Crocin) and recommended healthcare review.

### Phase 2 Demo Script
1. **Plan Versioning**: As Doctor, click **Modify Plan** on an active medication, change dosage to `2 tablets`, and provide a clinical reason: *"Patient reported persistent symptoms"*.
2. **Patient Notification**: Switch to Patient. Notice notification: *"Your medication plan has been updated by your healthcare provider"*, and plan version incremented to **Plan v2**.
3. **Caregiver Oversight**: Switch to **Caregiver (Priya)**. View Anjali's schedule, adherence rate, and missed dose alerts. Notice caregiver has read-only access (no unauthorized prescription edits).
4. **Consent Revocation**: As Patient, go to **Authorized Caregivers** and click the trash icon to revoke access. Verify consent is revoked.
5. **Pharmacy Refill Flow**: Switch to **Pharmacist**. Inspect prescription refill queue. Click **Dispense Refill** (+30 units). Notice refill recorded and patient notified. Add clinical review notes.
6. **Admin Oversight & Audit Trail**: Switch to **Admin**. Inspect system metrics, view the full registered user table, and review the immutable **Audit Log** documenting every prescription, dose taken, and consent event.

---

## 📡 Key REST API Endpoints

### Authentication
- `POST /api/auth/login` — Authenticate and receive JWT token
- `POST /api/auth/demo-switch` — Instant 1-click demo role switcher
- `GET /api/auth/me` — Current user context

### Patient & Schedule
- `GET /api/patients/:patientId/dashboard` — Complete patient summary, schedules, safety alerts, adherence
- `GET /api/patients/:patientId/schedule` — Date-filtered medication schedule
- `GET /api/patients/:patientId/caregivers` — List authorized caregivers
- `POST /api/patients/:patientId/caregivers` — Grant caregiver access consent
- `DELETE /api/patients/:patientId/caregivers/:consentId` — Revoke caregiver consent
- `GET /api/patients/:patientId/notifications` — Notification history

### Medications & Plan Versioning
- `GET /api/medications/patient/:patientId` — Active and past medications
- `POST /api/medications` — Doctor adds medication and generates schedules
- `PUT /api/medications/:id` — Update plan (increments version and logs audit reason)
- `POST /api/medications/:id/discontinue` — Discontinue medication

### Adherence Tracking
- `POST /api/adherence/taken` — Record taken dose (evaluates on-time vs late)
- `POST /api/adherence/missed` — Record missed dose (enforces safety advice)
- `GET /api/adherence/:patientId` — Detailed analytics, daily/weekly charts, risk score

### Doctor Portal
- `GET /api/doctor/patients/search?q=:query` — Search patients by ID or name
- `GET /api/doctor/patients/:patientId` — Full patient clinical file
- `POST /api/doctor/followups` — Log clinical follow-up instructions

### Pharmacist & Refills
- `GET /api/pharmacist/queue` — Active prescription refill queue
- `POST /api/pharmacist/refill` — Record dispensed refill
- `POST /api/pharmacist/notes` — Attach pharmacist professional review note

### Admin & System
- `GET /api/admin/metrics` — Global system metrics
- `GET /api/admin/users` — User management directory
- `GET /api/admin/audit-logs` — Immutable audit log viewer
- `GET /api/admin/drug-references` — Drug interaction database
- `POST /api/admin/drug-references` — Add drug reference rule

### Demo / Test Mode Triggers
- `POST /api/demo/trigger-reminder` — Fast-forward test reminder
- `POST /api/demo/simulate-missed` — Trigger test missed dose
- `POST /api/demo/simulate-conflict` — Trigger drug conflict safety alert
- `POST /api/demo/reset-database` — Reset demo database to initial state

---

## 🔒 Security & Data Integrity Highlights
- **Password Protection:** Passwords securely hashed with `bcryptjs` (salt rounds: 10).
- **JWT Authorization:** Standard bearer tokens with role and ownership verification.
- **Audit Logging:** Every sensitive healthcare event is permanently written to `audit_logs.json`.
- **Zero-Friction Storage:** Atomic write operations (write to `.tmp` then rename) ensure data integrity without partial writes or database corruption.
- **Strict Disclaimers:** Every safety and adherence score includes non-diagnostic disclosures.

---

## 🏆 Swarnandhra College Hackathon 2026 Problem Statement 2 Compliance
- ✅ Phase 1 MVP / POC workflow complete
- ✅ Phase 2 Productization extensions fully implemented on identical architecture
- ✅ Multi-role access (Patient, Doctor, Caregiver, Pharmacist, Admin)
- ✅ Real-time reminder modal + 30-minute grace period
- ✅ Taken, Late, Missed adherence calculations
- ✅ Plan versioning preserving full historical changes
- ✅ Caregiver consent management & revocation
- ✅ Pharmacy refill dispensing & notes
- ✅ Rule-based safety signals (duplicates, conflicts, expired Rx, repeated missed)
- ✅ Dedicated Demo Toolbar for judges & evaluators
