import rateLimit from 'express-rate-limit';

const make = (windowMs, max, message, options = {}) => rateLimit({
  windowMs,
  max,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { success: false, message },
  skip: () => process.env.NODE_ENV === 'test',
  ...options,
});

// Successful sign-ins should never consume the failed-attempt allowance.
export const authLimiter = make(15 * 60 * 1000, 20, 'Too many failed authentication attempts. Please try again later.', { skipSuccessfulRequests: true });
export const passwordLimiter = make(60 * 60 * 1000, 10, 'Too many password attempts. Please try again later.');
export const trackingLimiter = make(60 * 1000, 60, 'Too many tracking requests. Please slow down.');
export const paymentLimiter = make(60 * 1000, 100, 'Too many payment requests. Please slow down.');
export const apiLimiter = make(15 * 60 * 1000, 1000, 'Too many API requests. Please try again later.');
