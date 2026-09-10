import { Router } from 'express';
import { billingController } from '../controllers/billingController';
import { authMiddleware } from '../middleware/auth';
import { logAudit } from '../middleware/audit';

const router = Router();

router.get('/patient/:patientId', authMiddleware, billingController.getPatientBills);
router.get('/receipt/:id', authMiddleware, billingController.getReceipt);
router.get('/:id', authMiddleware, billingController.getBillById);
router.post('/:id/pay', authMiddleware, logAudit('BILL_PAID', 'Bill'), billingController.payBill);
router.get('/', authMiddleware, billingController.getAllBills);

export default router;
