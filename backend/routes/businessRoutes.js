import { Router } from 'express';
import { authorize, protect } from '../middleware/authMiddleware.js';
import { createBusinessCustomer, createBusinessOrder, getBusinessCustomers, getBusinessDashboard, getBusinessDeliveries, getBusinessOrderById, getBusinessOrders } from '../controllers/businessController.js';

const router = Router();
router.use(protect, authorize('business'));
router.get('/dashboard', getBusinessDashboard);
router.get('/orders', getBusinessOrders);
router.post('/orders', createBusinessOrder);
router.get('/orders/:id', getBusinessOrderById);
router.get('/deliveries', getBusinessDeliveries);
router.get('/customers', getBusinessCustomers);
router.post('/customers', createBusinessCustomer);

export default router;
