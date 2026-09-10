import { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../database/db';
import { RefillRequest, RefillRequestStatus, Notification, MedicationSupply } from '../models/types';

export const refillController = {
  getAllRefills: async (req: Request, res: Response): Promise<void> => {
    try {
      const { doctorId, patientId, status } = req.query;
      let refills = db.refillRequests.find();

      if (doctorId) {
        refills = refills.filter((r: any) => r.doctorId === doctorId);
      }
      if (patientId) {
        refills = refills.filter((r: any) => r.patientId === patientId);
      }
      if (status) {
        refills = refills.filter((r: any) => r.status === status);
      }

      refills.sort((a: any, b: any) => new Date(b.requestedDate).getTime() - new Date(a.requestedDate).getTime());
      res.json({ success: true, data: { refills } });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  },

  getRefillById: async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const refill = db.refillRequests.findById(id) || db.refillRequests.findOne(r => r.refillRequestId === id);
      if (!refill) {
        res.status(404).json({ success: false, message: 'Refill request not found' });
        return;
      }
      res.json({ success: true, data: { refill } });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  },

  updateRefillStatus: async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const { status, notes } = req.body as { status: RefillRequestStatus; notes?: string };

      const refill = db.refillRequests.findById(id) || db.refillRequests.findOne(r => r.refillRequestId === id);
      if (!refill) {
        res.status(404).json({ success: false, message: 'Refill request not found' });
        return;
      }

      const now = new Date();
      const nowISO = now.toISOString();
      const updatedHistory = [
        ...(refill.statusHistory || []),
        {
          status,
          changedBy: req.user?.id || 'PROVIDER',
          changedByRole: req.user?.role || 'DOCTOR',
          timestamp: nowISO,
          notes: notes || `Status updated to ${status}`
        }
      ];

      const updatedRefill = db.refillRequests.update(refill.id, {
        status,
        statusHistory: updatedHistory,
        updatedAt: nowISO
      });

      // If COMPLETED, automatically replenish the medication supply!
      if (status === 'COMPLETED') {
        const supply = db.medicationSupplies.findOne(
          s => s.medicationId === refill.medicationId && s.patientId === refill.patientId
        );
        if (supply) {
          const replenishedQty = supply.initialQuantity || refill.quantityRequested || 30;
          const daysRemaining = Math.floor(replenishedQty / Math.max(1, supply.dailyUsage));
          const depletionDate = new Date(now);
          depletionDate.setDate(depletionDate.getDate() + daysRemaining);

          db.medicationSupplies.update(supply.id, {
            quantityRemaining: replenishedQty,
            quantityDispensed: replenishedQty,
            refillStatus: 'REFILLED',
            dispensedDate: nowISO.split('T')[0],
            expectedDepletionDate: depletionDate.toISOString().split('T')[0],
            refillDate: depletionDate.toISOString().split('T')[0],
            notes: `Supply replenished (+${replenishedQty} units) upon Refill #${refill.refillRequestId} completion.`,
            updatedAt: nowISO
          });
        }

        // Also update medication remaining count
        const med = db.medications.findById(refill.medicationId);
        if (med) {
          db.medications.update(med.id, {
            refillRemaining: med.totalQuantity || refill.quantityRequested || 30,
            updatedAt: nowISO
          });
        }

        // Complete any pending FollowUpAction for this refill
        const followUps = db.followUpActions.find(
          f => f.patientId === refill.patientId && f.medicationId === refill.medicationId && f.type === 'REFILL_REQUIRED' && f.status === 'PENDING'
        );
        for (const flw of followUps) {
          db.followUpActions.update(flw.id, {
            status: 'COMPLETED',
            resolvedAt: nowISO,
            notes: `Resolved by Refill #${refill.refillRequestId} completion.`
          });
        }
      }

      // Notify Patient
      const patient = db.patients.findOne(p => p.patientId === refill.patientId);
      const user = patient ? db.users.findOne(u => u.patientId === patient.patientId) : undefined;
      if (user) {
        const notif: Notification = {
          id: `notif-rfl-status-${uuidv4().substring(0, 8)}`,
          recipientId: user.id,
          recipientRole: 'PATIENT',
          patientId: refill.patientId,
          type: 'REFILL_STATUS_CHANGED',
          title: `Refill Request ${status}: ${refill.medicationName}`,
          message: `Your refill request #${refill.refillRequestId} for ${refill.medicationName} is now marked as ${status}.`,
          category: 'USER',
          metadata: { refillRequestId: refill.refillRequestId, status },
          readStatus: false,
          isRead: false,
          deliveryStatus: 'DELIVERED',
          createdAt: nowISO
        };
        db.notifications.insert(notif);
      }

      res.json({
        success: true,
        data: {
          refill: updatedRefill,
          message: `Refill request #${refill.refillRequestId} status updated to ${status}.`
        }
      });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }
};
