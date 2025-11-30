require('dotenv').config();

module.exports = {
  env: process.env.NODE_ENV || 'development',
  port: process.env.PORT || 3005,
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: process.env.REDIS_PORT || 6379,
    password: process.env.REDIS_PASSWORD || '',
    db: process.env.REDIS_DB || 0
  },
  email: {
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: process.env.SMTP_PORT || 587,
    secure: process.env.SMTP_SECURE === 'true',
    user: process.env.SMTP_USER || '',
    password: process.env.SMTP_PASSWORD || '',
    from: process.env.SMTP_FROM || 'noreply@orderapp.com'
  },
  jwt: {
    secret: process.env.JWT_SECRET || 'default-secret-change-me'
  },
  queue: {
    maxRetries: parseInt(process.env.QUEUE_MAX_RETRIES) || 3,
    retryDelay: parseInt(process.env.QUEUE_RETRY_DELAY) || 5000
  },
  log: {
    level: process.env.LOG_LEVEL || 'info'
  }
};
