import { Router } from 'express';
import { cancelOrder, confirmOrder, createOrder, getCustomerOrders, getOrderById, getOrders, updateOrder } from '../controllers/orderController.js';
import { authorize, protect } from '../middleware/authMiddleware.js';
import { getOrderTrackingHistory } from '../controllers/trackingController.js';

const router = Router();
router.use(protect);
router.post('/', authorize('admin', 'customer'), createOrder);
router.get('/', authorize('admin', 'customer'), getOrders);
router.get('/my', authorize('customer'), getCustomerOrders);
router.get('/:id/tracking', authorize('admin', 'customer', 'driver'), getOrderTrackingHistory);
router.get('/:id', authorize('admin', 'customer'), getOrderById);
router.put('/:id', authorize('admin'), updateOrder);
router.patch('/:id/confirm', authorize('admin'), confirmOrder);
router.patch('/:id/cancel', authorize('admin'), cancelOrder);

export default router;
