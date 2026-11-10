export function validateEnvironment() {
  const required = ['MONGO_URI', 'JWT_SECRET', 'CLIENT_URL'];
  const missing = required.filter((key) => !process.env[key]?.trim());
  if (missing.length) throw new Error(`Missing required environment variables: ${missing.join(', ')}`);

  const environment = process.env.NODE_ENV || 'development';
  if (!['development', 'test', 'production'].includes(environment)) throw new Error('NODE_ENV must be development, test, or production');
  if (environment === 'production' && process.env.JWT_SECRET.length < 32) throw new Error('JWT_SECRET must be at least 32 characters in production');

  const origins = process.env.CLIENT_URL.split(',').map((value) => value.trim()).filter(Boolean);
  if (!origins.length || origins.some((origin) => origin === '*')) throw new Error('CLIENT_URL must contain explicit trusted origins');
}
