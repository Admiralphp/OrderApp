const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const compression = require('compression');
const rateLimit = require('express-rate-limit');

const config = require('./config');
const logger = require('./config/logger');
const { connectRedis } = require('./config/redis');
const { initializeEmailTransporter, verifyEmailConnection } = require('./config/email');
const errorHandler = require('./middleware/errorHandler');
const { metricsMiddleware, register } = require('./utils/metrics');
const queueProcessor = require('./workers/queueProcessor');

// Routes
const notificationRoutes = require('./routes/notifications');
const healthRoutes = require('./routes/health');

const app = express();

// Initialize connections
const initialize = async () => {
  try {
    await connectRedis();
    initializeEmailTransporter();
    await verifyEmailConnection();
    logger.info('All services initialized');
  } catch (error) {
    logger.error('Initialization failed:', error);
    process.exit(1);
  }
};

initialize();

// Security
app.use(helmet());
app.use(cors());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100
});
app.use('/api/', limiter);

// Body parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(compression());

// Metrics
app.use(metricsMiddleware);

// Logging
app.use((req, res, next) => {
  logger.info('Incoming request', {
    method: req.method,
    url: req.url,
    ip: req.ip
  });
  next();
});

// Health routes
app.use('/health', healthRoutes);

// API routes
app.use('/api/v1/notifications', notificationRoutes);

// Metrics endpoint
app.get('/metrics', async (req, res) => {
  res.set('Content-Type', register.contentType);
  res.end(await register.metrics());
});

// 404
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

// Error handler
app.use(errorHandler);

// Start server
const PORT = config.port;
const server = app.listen(PORT, () => {
  logger.info(`Notification service running on port ${PORT} in ${config.env} mode`);
  
  // Start queue processor
  queueProcessor.start();
});

// Graceful shutdown
const gracefulShutdown = (signal) => {
  logger.info(`${signal} received. Starting graceful shutdown...`);
  
  // Stop queue processor
  queueProcessor.stop();
  
  server.close(async () => {
    logger.info('HTTP server closed');
    
    try {
      const { getRedisClient } = require('./config/redis');
      const redis = getRedisClient();
      await redis.quit();
      logger.info('Redis connection closed');
      process.exit(0);
    } catch (error) {
      logger.error('Error during shutdown:', error);
      process.exit(1);
    }
  });

  setTimeout(() => {
    logger.error('Forced shutdown after timeout');
    process.exit(1);
  }, 10000);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

module.exports = app;
