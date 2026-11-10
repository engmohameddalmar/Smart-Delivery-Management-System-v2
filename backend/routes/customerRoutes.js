import { Router } from 'express'; import { authorize, protect } from '../middleware/authMiddleware.js';
import { getCustomerDashboard } from '../controllers/dashboardController.js';
const router = Router();
router.get('/test', protect, authorize('customer'), (_request, response) => response.json({ success: true, message: 'Customer access granted' }));
router.get('/dashboard', protect, authorize('customer'), getCustomerDashboard);
export default router;
