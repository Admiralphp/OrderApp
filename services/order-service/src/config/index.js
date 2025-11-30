require('dotenv').config();

module.exports = {
  env: process.env.NODE_ENV || 'development',
  port: process.env.PORT || 3003,
  database: {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    name: process.env.DB_NAME || 'order_db',
    user: process.env.DB_USER || 'order_user',
    password: process.env.DB_PASSWORD || 'order_pass'
  },
  jwt: {
    secret: process.env.JWT_SECRET || 'default-secret-change-me'
  },
  externalServices: {
    productService: process.env.PRODUCT_SERVICE_URL || 'http://localhost:3002',
    paymentService: process.env.PAYMENT_SERVICE_URL || 'http://localhost:3004',
    notificationService: process.env.NOTIFICATION_SERVICE_URL || 'http://localhost:3005'
  },
  log: {
    level: process.env.LOG_LEVEL || 'info'
  }
};
