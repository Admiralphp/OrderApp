const { testConnection } = require('../config/database');
const { sequelize } = require('../models');
const logger = require('../config/logger');

exports.healthCheck = async (req, res) => {
  res.json({
    success: true,
    service: 'product-service',
    status: 'healthy',
    timestamp: new Date().toISOString(),
  });
};

exports.readinessCheck = async (req, res) => {
  try {
    // Check database connection
    await sequelize.authenticate();

    res.json({
      success: true,
      service: 'product-service',
      status: 'ready',
      checks: {
        database: 'connected',
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error('Readiness check failed', { error: error.message });
    res.status(503).json({
      success: false,
      service: 'product-service',
      status: 'not ready',
      checks: {
        database: 'disconnected',
      },
      error: error.message,
      timestamp: new Date().toISOString(),
    });
  }
};

exports.livenessCheck = (req, res) => {
  res.json({
    success: true,
    service: 'product-service',
    status: 'alive',
    timestamp: new Date().toISOString(),
  });
};
