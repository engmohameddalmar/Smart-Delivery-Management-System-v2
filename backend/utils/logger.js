const sensitiveKey = /password|passwd|secret|token|authorization|cookie|mongo_uri|api[_-]?key/i;
const redactString = (value) => String(value)
  .replace(/mongodb(?:\+srv)?:\/\/[^\s"']+/gi, '[REDACTED_DATABASE_URI]')
  .replace(/Bearer\s+[A-Za-z0-9._~-]+/gi, 'Bearer [REDACTED]')
  .replace(/\beyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\b/g, '[REDACTED_JWT]');

const sanitize = (value, key = '') => {
  if (sensitiveKey.test(key)) return '[REDACTED]';
  if (typeof value === 'string') return redactString(value);
  if (Array.isArray(value)) return value.map((item) => sanitize(item));
  if (value && typeof value === 'object') return Object.fromEntries(Object.entries(value).map(([childKey, childValue]) => [childKey, sanitize(childValue, childKey)]));
  return value;
};

const write = (level, event, details = {}) => {
  const output = JSON.stringify(sanitize({ timestamp: new Date().toISOString(), level, event, ...details }));
  if (level === 'error' || level === 'warn') console.error(output);
  else console.log(output);
};

export const logger = {
  info: (event, details) => write('info', event, details),
  warn: (event, details) => write('warn', event, details),
  error: (event, details) => write('error', event, details),
};
