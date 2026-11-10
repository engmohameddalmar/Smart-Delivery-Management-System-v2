import cors from 'cors';
import dotenv from 'dotenv';
import express from 'express';
import helmet from 'helmet';
import mongoose from 'mongoose';
import path from 'path';
import { connectDatabase } from './config/db.js';
import { validateEnvironment } from './config/env.js';
import { errorHandler, notFound } from './middleware/errorMiddleware.js';
import { apiLimiter } from './middleware/rateLimitMiddleware.js';
import activityLogRoutes from './routes/activityLogRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import analyticsRoutes from './routes/analyticsRoutes.js';
import authRoutes from './routes/authRoutes.js';
import businessRoutes from './routes/businessRoutes.js';
import customerRoutes from './routes/customerRoutes.js';
import deliveryRoutes from './routes/deliveryRoutes.js';
import driverRoutes from './routes/driverRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js';
import orderRoutes from './routes/orderRoutes.js';
import paymentRoutes from './routes/paymentRoutes.js';
import reportRoutes from './routes/reportRoutes.js';
import settingsRoutes from './routes/settingsRoutes.js';
import trackingRoutes from './routes/trackingRoutes.js';
import userRoutes from './routes/userRoutes.js';
import { logActivity } from './utils/activityLogger.js';
import { logger } from './utils/logger.js';

dotenv.config();

try {
  validateEnvironment();
} catch (error) {
  logger.error('configuration.invalid', { message: error.message });
  process.exit(1);
}

const app = express();
const port = Number(process.env.PORT) || 5000;
if (process.env.TRUST_PROXY === 'true' || process.env.TRUST_PROXY === '1') app.set('trust proxy', 1);
const allowedOrigins = process.env.CLIENT_URL.split(',').map((value) => value.trim()).filter(Boolean);
// Vite may select another local port when its default is already occupied.
const isDevelopmentOrigin = (origin) => (process.env.NODE_ENV || 'development') !== 'production'
  && /^http:\/\/(localhost|127\.0\.0\.1):\d+$/.test(origin);

app.disable('x-powered-by');
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(cors({
  origin(origin, callback) {
    if (!origin || allowedOrigins.includes(origin) || isDevelopmentOrigin(origin)) return callback(null, true);
    return callback(Object.assign(new Error('Origin is not allowed by CORS'), { statusCode: 403 }));
  },
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  maxAge: 86400,
}));
app.use(express.json({ limit: '100kb' }));
app.use(express.urlencoded({ extended: false, limit: '100kb' }));
app.use('/uploads/avatars', express.static(path.resolve('uploads/avatars'), { dotfiles: 'deny', fallthrough: false, maxAge: '7d', immutable: process.env.NODE_ENV === 'production' }));

app.get('/api/health', (_request, response) => {
  const databaseReady = mongoose.connection.readyState === 1;
  response.status(databaseReady ? 200 : 503).json({ success: databaseReady, message: databaseReady ? 'Smart Delivery API is running' : 'Service temporarily unavailable' });
});
app.use('/api', apiLimiter);
app.use((request, response, next) => {
  response.on('finish', () => {
    if (response.statusCode >= 400 || request.user?.role !== 'admin') return;
    const route = request.originalUrl.split('?')[0];
    const rules = [[/^\/api\/deliveries\/[^/]+\/assign$/, 'driver.assigned', 'Delivery'], [/^\/api\/orders\/[^/]+\/cancel$/, 'order.cancelled', 'Order'], [/^\/api\/payments\/[^/]+\/refund$/, 'payment.refunded', 'Payment']];
    const rule = rules.find(([pattern]) => pattern.test(route));
    if (rule) logActivity(request, { action: rule[1], entityType: rule[2], description: `${rule[1]} via ${route}` }).catch(() => {});
  });
  next();
});

app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/business', businessRoutes);
app.use('/api/driver', driverRoutes);
app.use('/api/customer', customerRoutes);
app.use('/api/users', userRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/deliveries', deliveryRoutes);
app.use('/api/tracking', trackingRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/activity-logs', activityLogRoutes);
app.use('/api', notFound);
app.use(errorHandler);

try {
  await connectDatabase();
  const server = app.listen(port, () => logger.info('server.started', { port, environment: process.env.NODE_ENV || 'development' }));
  const shutdown = (signal) => {
    logger.info('server.shutdown', { signal });
    server.close(async () => { await mongoose.connection.close(); process.exit(0); });
  };
  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
} catch {
  logger.error('server.startup_failed', { message: 'Database initialization failed' });
  process.exit(1);
}
