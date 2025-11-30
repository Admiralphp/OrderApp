require('dotenv').config();

module.exports = {
  env: process.env.NODE_ENV || 'development',
  port: process.env.PORT || 3004,
  database: {
    uri: process.env.MONGODB_URI || 'mongodb://localhost:27018/payment_db'
  },
  jwt: {
    secret: process.env.JWT_SECRET || 'default-secret-change-me'
  },
  stripe: {
    secretKey: process.env.STRIPE_SECRET_KEY || '',
    publishableKey: process.env.STRIPE_PUBLISHABLE_KEY || '',
    webhookSecret: process.env.STRIPE_WEBHOOK_SECRET || ''
  },
  paypal: {
    clientId: process.env.PAYPAL_CLIENT_ID || '',
    clientSecret: process.env.PAYPAL_CLIENT_SECRET || '',
    mode: process.env.PAYPAL_MODE || 'sandbox'
  },
  externalServices: {
    orderService: process.env.ORDER_SERVICE_URL || 'http://localhost:3003',
    notificationService: process.env.NOTIFICATION_SERVICE_URL || 'http://localhost:3005'
  },
  log: {
    level: process.env.LOG_LEVEL || 'info'
  }
};
