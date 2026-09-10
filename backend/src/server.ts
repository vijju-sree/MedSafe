import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import { config } from './config';
import { seedDatabase } from './database/seedData';
import { reminderTicker } from './services/reminderTicker';

import authRoutes from './routes/authRoutes';
import patientRoutes from './routes/patientRoutes';
import medicationRoutes from './routes/medicationRoutes';
import prescriptionRoutes from './routes/prescriptionRoutes';
import adherenceRoutes from './routes/adherenceRoutes';
import doctorRoutes from './routes/doctorRoutes';
import caregiverRoutes from './routes/caregiverRoutes';
import pharmacistRoutes from './routes/pharmacistRoutes';
import adminRoutes from './routes/adminRoutes';
import demoRoutes from './routes/demoRoutes';
import consultationRoutes from './routes/consultationRoutes';
import testOrderRoutes from './routes/testOrderRoutes';
import reportRoutes from './routes/reportRoutes';
import billingRoutes from './routes/billingRoutes';
import subscriptionRoutes from './routes/subscriptionRoutes';
import refillRoutes from './routes/refillRoutes';
import receptionistRoutes from './routes/receptionistRoutes';
import paymentRoutes from './routes/paymentRoutes';

const app = express();

app.use(cors());
app.use(express.json({
  verify: (req: any, _res, buf) => {
    req.rawBody = buf.toString();
  }
}));

// Request logging for dev
app.use((req: Request, res: Response, next: NextFunction) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

import fs from 'fs';
import path from 'path';

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/patients', patientRoutes);
app.use('/api/medications', medicationRoutes);
app.use('/api/prescriptions', prescriptionRoutes);
app.use('/api/adherence', adherenceRoutes);
app.use('/api/doctor', doctorRoutes);
app.use('/api/caregiver', caregiverRoutes);
app.use('/api/pharmacist', pharmacistRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/demo', demoRoutes);
app.use('/api/consultations', consultationRoutes);
app.use('/api/test-orders', testOrderRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/bills', billingRoutes);
app.use('/api/subscriptions', subscriptionRoutes);
app.use('/api/refills', refillRoutes);
app.use('/api/receptionist', receptionistRoutes);
app.use('/api/payments', paymentRoutes);

// Health Check
app.get('/api/health', (req: Request, res: Response) => {
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
const frontendDist = path.resolve(__dirname, '../../frontend/dist');
if (fs.existsSync(frontendDist)) {
  app.use(express.static(frontendDist));
  app.get('*', (req: Request, res: Response, next: NextFunction) => {
    if (req.path.startsWith('/api')) return next();
    res.sendFile(path.join(frontendDist, 'index.html'));
  });
}

// Global Error Handler
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
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
    await seedDatabase(false);

    // Start real-time background reminder ticker
    reminderTicker.start();

    app.listen(config.port, () => {
      console.log(`=======================================================`);
      console.log(` MedSafe API Server running on port http://localhost:${config.port}`);
      console.log(` Safety boundary intelligence & adherence active.`);
      console.log(`=======================================================`);
    });
  } catch (error) {
    console.error('Fatal error starting MedSafe server:', error);
    process.exit(1);
  }
}

startServer();
