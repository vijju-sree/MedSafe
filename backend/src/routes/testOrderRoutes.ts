import { Router } from 'express';
import { testOrderController } from '../controllers/testOrderController';
import { authMiddleware } from '../middleware/auth';
import { logAudit } from '../middleware/audit';

const router = Router();

router.get('/catalogue', authMiddleware, testOrderController.getCatalogue);
router.post('/', authMiddleware, logAudit('TEST_ORDER_CREATED', 'TestOrder'), testOrderController.createOrder);
router.get('/', authMiddleware, testOrderController.getAllOrders);
router.get('/patient/:patientId', authMiddleware, testOrderController.getPatientOrders);
router.get('/:id', authMiddleware, testOrderController.getOrderById);
router.put('/:id/sample', authMiddleware, logAudit('SAMPLE_COLLECTED', 'TestOrder'), testOrderController.collectSample);
router.put('/:id/status', authMiddleware, logAudit('TEST_STATUS_UPDATED', 'TestOrder'), testOrderController.updateStatus);

export default router;
