"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const config_1 = require("./config");
const seedData_1 = require("./database/seedData");
const reminderTicker_1 = require("./services/reminderTicker");
const authRoutes_1 = __importDefault(require("./routes/authRoutes"));
const patientRoutes_1 = __importDefault(require("./routes/patientRoutes"));
const medicationRoutes_1 = __importDefault(require("./routes/medicationRoutes"));
const prescriptionRoutes_1 = __importDefault(require("./routes/prescriptionRoutes"));
const adherenceRoutes_1 = __importDefault(require("./routes/adherenceRoutes"));
const doctorRoutes_1 = __importDefault(require("./routes/doctorRoutes"));
const caregiverRoutes_1 = __importDefault(require("./routes/caregiverRoutes"));
const pharmacistRoutes_1 = __importDefault(require("./routes/pharmacistRoutes"));
const adminRoutes_1 = __importDefault(require("./routes/adminRoutes"));
const demoRoutes_1 = __importDefault(require("./routes/demoRoutes"));
const consultationRoutes_1 = __importDefault(require("./routes/consultationRoutes"));
const testOrderRoutes_1 = __importDefault(require("./routes/testOrderRoutes"));
const reportRoutes_1 = __importDefault(require("./routes/reportRoutes"));
const billingRoutes_1 = __importDefault(require("./routes/billingRoutes"));
const subscriptionRoutes_1 = __importDefault(require("./routes/subscriptionRoutes"));
const refillRoutes_1 = __importDefault(require("./routes/refillRoutes"));
const receptionistRoutes_1 = __importDefault(require("./routes/receptionistRoutes"));
const paymentRoutes_1 = __importDefault(require("./routes/paymentRoutes"));
const app = (0, express_1.default)();
app.use((0, cors_1.default)());
app.use(express_1.default.json({
    verify: (req, _res, buf) => {
        req.rawBody = buf.toString();
    }
}));
// Request logging for dev
app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    next();
});
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
// API Routes
app.use('/api/auth', authRoutes_1.default);
app.use('/api/patients', patientRoutes_1.default);
app.use('/api/medications', medicationRoutes_1.default);
app.use('/api/prescriptions', prescriptionRoutes_1.default);
app.use('/api/adherence', adherenceRoutes_1.default);
app.use('/api/doctor', doctorRoutes_1.default);
app.use('/api/caregiver', caregiverRoutes_1.default);
app.use('/api/pharmacist', pharmacistRoutes_1.default);
app.use('/api/admin', adminRoutes_1.default);
app.use('/api/demo', demoRoutes_1.default);
app.use('/api/consultations', consultationRoutes_1.default);
app.use('/api/test-orders', testOrderRoutes_1.default);
app.use('/api/reports', reportRoutes_1.default);
app.use('/api/bills', billingRoutes_1.default);
app.use('/api/subscriptions', subscriptionRoutes_1.default);
app.use('/api/refills', refillRoutes_1.default);
app.use('/api/receptionist', receptionistRoutes_1.default);
app.use('/api/payments', paymentRoutes_1.default);
// Health Check
app.get('/api/health', (req, res) => {
    res.json({
        success: true,
        data: {
            status: 'healthy',
            platform: 'MedSafe Healthcare Coordination',
            version: '2.0.0',
            timestamp: new Date().toISOString()
        }
    });
});
// Serve frontend production build if present
const frontendDist = path_1.default.resolve(__dirname, '../../frontend/dist');
if (fs_1.default.existsSync(frontendDist)) {
    app.use(express_1.default.static(frontendDist));
    app.get('*', (req, res, next) => {
        if (req.path.startsWith('/api'))
            return next();
        res.sendFile(path_1.default.join(frontendDist, 'index.html'));
    });
}
// Global Error Handler
app.use((err, req, res, next) => {
    console.error('Unhandled Server Error:', err);
    res.status(err.status || 500).json({
        success: false,
        message: err.message || 'An internal server error occurred.'
    });
});
// Start Server and Background Jobs
async function startServer() {
    try {
        // Ensure demo records are seeded if database is empty
        await (0, seedData_1.seedDatabase)(false);
        // Start real-time background reminder ticker
        reminderTicker_1.reminderTicker.start();
        app.listen(config_1.config.port, () => {
            console.log(`=======================================================`);
            console.log(` MedSafe API Server running on port http://localhost:${config_1.config.port}`);
            console.log(` Safety boundary intelligence & adherence active.`);
            console.log(`=======================================================`);
        });
    }
    catch (error) {
        console.error('Fatal error starting MedSafe server:', error);
        process.exit(1);
    }
}
startServer();
