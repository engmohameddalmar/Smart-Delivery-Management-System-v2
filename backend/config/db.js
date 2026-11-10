import mongoose from 'mongoose';
import { logger } from '../utils/logger.js';

export async function connectDatabase() {
  try {
    const connection = await mongoose.connect(process.env.MONGO_URI, { serverSelectionTimeoutMS: 5000 });
    logger.info('database.connected', { database: connection.connection.name });
    mongoose.connection.on('disconnected', () => logger.warn('database.disconnected'));
    mongoose.connection.on('error', (error) => logger.error('database.error', { name: error.name, message: error.message }));
    return connection;
  } catch (error) {
    logger.error('database.connection_failed', { name: error.name, message: 'Unable to connect to MongoDB' });
    throw error;
  }
}
