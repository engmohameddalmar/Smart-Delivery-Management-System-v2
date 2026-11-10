import multer from 'multer';
import { logger } from '../utils/logger.js';

export function notFound(request, response) {
  response.status(404).json({ success: false, message: 'Route not found' });
}

export function errorHandler(error, request, response, _next) {
  let status = error.statusCode || error.status || 500;
  let message = error.message || 'Something went wrong';
  if (error.name === 'ValidationError') {
    status = 400;
    message = Object.values(error.errors).map((item) => item.message).join(', ');
  } else if (error.name === 'CastError') {
    status = 400;
    message = 'Invalid resource ID.';
  } else if (error.code === 11000) {
    status = 409;
    message = 'A record with that value already exists.';
  } else if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
    status = 401;
    message = 'Invalid or expired token';
  } else if (error instanceof multer.MulterError) {
    status = 400;
    message = error.code === 'LIMIT_FILE_SIZE' ? 'Image must be 5MB or smaller' : error.message;
  } else if (error.message?.includes('proof images') || error.message?.includes('avatar images')) {
    status = 400;
  }

  if (status >= 500) {
    logger.error('request.failed', { method: request.method, path: request.originalUrl.split('?')[0], status, name: error.name || 'Error', message: error.message });
    message = 'Something went wrong';
  } else if (status === 401 || status === 403 || status === 429) {
    logger.warn('security.request_rejected', { method: request.method, path: request.originalUrl.split('?')[0], status });
  }
  response.status(status).json({ success: false, message });
}
