require('dotenv').config();

module.exports = {
  env: process.env.NODE_ENV || 'development',
  port: process.env.PORT || 3001,
  mongodb: {
    uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/user_db'
  },
  jwt: {
    secret: process.env.JWT_SECRET || 'default-secret-change-me',
    expiry: process.env.JWT_EXPIRY || '24h'
  },
  bcrypt: {
    rounds: parseInt(process.env.BCRYPT_ROUNDS) || 10
  },
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
    max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100
  },
  log: {
    level: process.env.LOG_LEVEL || 'info'
  }
};
