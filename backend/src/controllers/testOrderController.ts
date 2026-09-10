import { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../database/db';
import { TestOrder, TestOrderStatus, Bill, BillItem, Notification } from '../models/types';

// Standard pricing lookup for common diagnostic tests
export const TEST_PRICING: Record<string, { category: 'BLOOD' | 'RADIOLOGY' | 'CARDIOLOGY' | 'PATHOLOGY' | 'OTHER'; cost: number }> = {
  'CBC Blood Test (Complete Blood Count)': { category: 'BLOOD', cost: 450 },
  'Chest X-Ray (PA View)': { category: 'RADIOLOGY', cost: 750 },
  'Lipid Profile (Cholesterol & Triglycerides)': { category: 'BLOOD', cost: 650 },
  '12-Lead Electrocardiogram (ECG)': { category: 'CARDIOLOGY', cost: 400 },
  'HbA1c (Glycated Hemoglobin)': { category: 'BLOOD', cost: 550 },
  'Liver Function Test (LFT)': { category: 'BLOOD', cost: 700 },
  'Kidney Function Test (KFT/RFT)': { category: 'BLOOD', cost: 750 },
  'Thyroid Stimulating Hormone (TSH)': { category: 'BLOOD', cost: 500 },
  'Ultrasound Abdomen & Pelvis': { category: 'RADIOLOGY', cost: 1200 },
  'Urine Routine & Microscopic': { category: 'PATHOLOGY', cost: 250 }
};

export const testOrderController = {
  // Doctor or Clinician prescribes a test order
  createOrder: async (req: Request, res: Response): Promise<void> => {
    try {
      const {
        patientId,
        testName,
        testCategory,
        reason,
        priority = 'ROUTINE',
        labId,
        customCost,
        notes
      } = req.body;

      if (!patientId || !testName) {
        res.status(400).json({ success: false, message: 'patientId and testName are required.' });
        return;
      }

      const patient = db.patients.findOne(p => p.patientId === patientId);
      if (!patient) {
        res.status(404).json({ success: false, message: `Patient ${patientId} not found.` });
        return;
      }

      const doctorId = req.user?.doctorId || 'DOC10001';
      const doctor = db.doctors.findOne(d => d.doctorId === doctorId);
      const doctorName = doctor ? doctor.name : (req.user?.name || 'Dr. Sarah Jenkins');

      // Select lab
      let assignedLab = labId ? db.labs.findOne(l => l.labId === labId) : null;
      if (!assignedLab) {
        assignedLab = db.labs.findOne(l => l.verificationStatus === 'VERIFIED') || db.labs.find()[0];
      }

      // Generate sequential Test Order ID
      const allOrders = db.testOrders.find();
      let maxOrderNum = 10001;
      for (const o of allOrders) {
        const match = o.testOrderId?.match(/TST(\d+)/);
        if (match) {
          const num = parseInt(match[1], 10);
          if (num >= maxOrderNum) maxOrderNum = num + 1;
        }
      }
      const testOrderId = `TST${maxOrderNum}`;

      // Calculate cost
      const standardInfo = TEST_PRICING[testName];
      const category = testCategory || standardInfo?.category || 'BLOOD';
      const cost = customCost || standardInfo?.cost || 500;

      const now = new Date().toISOString();

      // Create Test Order
      const newOrder: TestOrder = {
        id: `tst-${uuidv4().substring(0, 8)}`,
        testOrderId,
        patientId,
        patientName: patient.name,
        doctorId,
        doctorName,
        clinicId: doctor?.clinicId || patient.clinicId || 'CLN10001',
        clinicName: 'MedSafe Multispecialty Clinic',
        labId: assignedLab?.labId || 'LAB10001',
        labName: assignedLab?.name || 'Apex Diagnostics & Imaging',
        testName,
        testCategory: category,
        reason: reason || 'Routine clinical investigation',
        priority: priority as any,
        status: 'ORDERED',
        orderedAt: now,
        cost,
        notes
      };

      // Generate corresponding itemized Bill
      const allBills = db.bills.find();
      let maxBillNum = 10001;
      for (const b of allBills) {
        const match = b.billId?.match(/BIL(\d+)/);
        if (match) {
          const num = parseInt(match[1], 10);
          if (num >= maxBillNum) maxBillNum = num + 1;
        }
      }
      const billId = `BIL${maxBillNum}`;

      const billItem: BillItem = {
        description: `${testName} (Investigation - ${priority})`,
        quantity: 1,
        unitPrice: cost,
        totalPrice: cost,
        itemType: 'TEST',
        referenceId: testOrderId
      };

      const tax = Math.round(cost * 0.05); // 5% GST on healthcare tests
      const totalAmount = cost + tax;

      // Due in 7 days
      const dueDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

      const newBill: Bill = {
        id: `bil-${uuidv4().substring(0, 8)}`,
        billId,
        patientId,
        patientName: patient.name,
        clinicId: newOrder.clinicId,
        clinicName: newOrder.clinicName,
        labId: newOrder.labId,
        labName: newOrder.labName,
        doctorId,
        doctorName,
        items: [billItem],
        subtotal: cost,
        tax,
        discount: 0,
        totalAmount,
        status: 'PENDING',
        billDate: now.split('T')[0],
        dueDate
      };

      db.bills.insert(newBill);
      newOrder.billId = billId;
      db.testOrders.insert(newOrder);

      // Patient Notification
      const patNotification: Notification = {
        id: `notif-${uuidv4().substring(0, 8)}`,
        recipientId: patient.userId,
        recipientRole: 'PATIENT',
        patientId,
        type: 'TEST_ORDERED',
        title: `Diagnostic Test Prescribed: ${testName}`,
        message: `${doctorName} has prescribed a ${testName}. Bill #${billId} (₹${totalAmount}) has been generated.`,
        metadata: { testOrderId, billId, testName, cost: totalAmount },
        readStatus: false,
        deliveryStatus: 'DELIVERED',
        createdAt: now
      };
      db.notifications.insert(patNotification);

      // Lab Notification if lab user exists
      if (assignedLab) {
        const labUser = db.users.findOne(u => u.labId === assignedLab?.labId || u.id === assignedLab?.userId);
        if (labUser) {
          const labNotification: Notification = {
            id: `notif-${uuidv4().substring(0, 8)}`,
            recipientId: labUser.id,
            recipientRole: 'LAB',
            patientId,
            type: 'TEST_ORDERED',
            title: `New Test Order #${testOrderId}`,
            message: `New test ${testName} ordered for patient ${patient.name} by ${doctorName}. Priority: ${priority}.`,
            metadata: { testOrderId, testName, priority },
            readStatus: false,
            deliveryStatus: 'DELIVERED',
            createdAt: now
          };
          db.notifications.insert(labNotification);
        }
      }

      res.status(201).json({
        success: true,
        data: {
          testOrder: newOrder,
          bill: newBill,
          message: `Test order #${testOrderId} created successfully. Bill #${billId} generated.`
        }
      });
    } catch (error: any) {
      console.error('createOrder error:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  },

  // Get orders for a specific patient
  getPatientOrders: async (req: Request, res: Response): Promise<void> => {
    try {
      const patientId = req.params.patientId;
      const orders = db.testOrders.find(o => o.patientId === patientId).sort((a, b) => b.orderedAt.localeCompare(a.orderedAt));
      res.json({ success: true, data: { testOrders: orders } });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  },

  // Get all orders (for Lab, Doctor, or Admin)
  getAllOrders: async (req: Request, res: Response): Promise<void> => {
    try {
      const { status, labId, doctorId, priority } = req.query;
      let orders = db.testOrders.find().sort((a, b) => b.orderedAt.localeCompare(a.orderedAt));

      if (status) {
        orders = orders.filter(o => o.status === status);
      }
      if (labId) {
        orders = orders.filter(o => o.labId === labId);
      }
      if (doctorId) {
        orders = orders.filter(o => o.doctorId === doctorId);
      }
      if (priority) {
        orders = orders.filter(o => o.priority === priority);
      }

      res.json({ success: true, data: { testOrders: orders } });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  },

  // Get single order by ID
  getOrderById: async (req: Request, res: Response): Promise<void> => {
    try {
      const id = req.params.id;
      const order = db.testOrders.findOne(o => o.id === id || o.testOrderId === id);
      if (!order) {
        res.status(404).json({ success: false, message: `Test order ${id} not found.` });
        return;
      }
      res.json({ success: true, data: { testOrder: order } });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  },

  // Lab marks sample collected
  collectSample: async (req: Request, res: Response): Promise<void> => {
    try {
      const id = req.params.id;
      const order = db.testOrders.findOne(o => o.id === id || o.testOrderId === id);
      if (!order) {
        res.status(404).json({ success: false, message: `Test order ${id} not found.` });
        return;
      }

      const now = new Date().toISOString();
      const updated = db.testOrders.update(order.id, {
        status: 'SAMPLE_COLLECTED',
        sampleCollectedAt: now
      });

      // Notify patient
      const patient = db.patients.findOne(p => p.patientId === order.patientId);
      if (patient) {
        const notif: Notification = {
          id: `notif-${uuidv4().substring(0, 8)}`,
          recipientId: patient.userId,
          recipientRole: 'PATIENT',
          patientId: order.patientId,
          type: 'SAMPLE_COLLECTED',
          title: `Sample Collected for ${order.testName}`,
          message: `Your sample for ${order.testName} (Order #${order.testOrderId}) has been successfully collected by ${order.labName}.`,
          metadata: { testOrderId: order.testOrderId },
          readStatus: false,
          deliveryStatus: 'DELIVERED',
          createdAt: now
        };
        db.notifications.insert(notif);
      }

      res.json({ success: true, data: { testOrder: updated, message: 'Sample collection recorded.' } });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  },

  // Update order status (e.g. IN_PROGRESS, CANCELLED)
  updateStatus: async (req: Request, res: Response): Promise<void> => {
    try {
      const id = req.params.id;
      const { status, notes } = req.body;
      const order = db.testOrders.findOne(o => o.id === id || o.testOrderId === id);
      if (!order) {
        res.status(404).json({ success: false, message: `Test order ${id} not found.` });
        return;
      }

      const updates: Partial<TestOrder> = { status: status as TestOrderStatus };
      if (notes) updates.notes = notes;
      if (status === 'COMPLETED') updates.completedAt = new Date().toISOString();

      const updated = db.testOrders.update(order.id, updates);
      res.json({ success: true, data: { testOrder: updated } });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  },

  // Available test catalogue
  getCatalogue: async (req: Request, res: Response): Promise<void> => {
    try {
      const items = Object.entries(TEST_PRICING).map(([name, info]) => ({
        testName: name,
        category: info.category,
        cost: info.cost
      }));
      res.json({ success: true, data: { catalogue: items } });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }
};
