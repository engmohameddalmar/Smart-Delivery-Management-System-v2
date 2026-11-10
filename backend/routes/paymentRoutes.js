import { Router } from 'express';
import { cancelPayment, createPayment, getDriverPaymentSummary, getMyPayments, getPaymentById, getPaymentByOrder, getPayments, initiateOnlinePayment, markPaymentFailed, markPaymentPaid, refundPayment, verifyPayment } from '../controllers/paymentController.js';
import { authorize, protect } from '../middleware/authMiddleware.js';
import { paymentLimiter } from '../middleware/rateLimitMiddleware.js';

const router = Router();
router.use(paymentLimiter, protect);
router.post('/', authorize('admin', 'business', 'customer'), createPayment);
router.get('/', authorize('admin'), getPayments);
router.get('/my', authorize('business', 'customer'), getMyPayments);
router.get('/driver/summary', authorize('driver'), getDriverPaymentSummary);
router.get('/order/:orderId', authorize('admin', 'business', 'customer', 'driver'), getPaymentByOrder);
router.get('/:id', authorize('admin', 'business', 'customer', 'driver'), getPaymentById);
router.post('/:id/initiate', authorize('business', 'customer'), initiateOnlinePayment);
router.post('/:id/verify', authorize('admin'), verifyPayment);
router.patch('/:id/paid', authorize('admin'), markPaymentPaid);
router.patch('/:id/failed', authorize('admin'), markPaymentFailed);
router.patch('/:id/cancel', authorize('admin', 'business', 'customer'), cancelPayment);
router.patch('/:id/refund', authorize('admin'), refundPayment);

export default router;
