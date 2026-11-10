import { Router } from 'express'; import { authorize, protect } from '../middleware/authMiddleware.js';
import { getDriverDashboard } from '../controllers/dashboardController.js';
const router = Router();
router.get('/test', protect, authorize('driver'), (_request, response) => response.json({ success: true, message: 'Driver access granted' }));
router.get('/dashboard', protect, authorize('driver'), getDriverDashboard);
export default router;
