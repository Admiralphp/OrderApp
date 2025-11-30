const { sequelize } = require('../config/database');

const healthCheck = async (req, res) => {
  try {
    await sequelize.authenticate();
    
    res.json({
      success: true,
      service: 'order-service',
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      database: 'connected'
    });
  } catch (error) {
    res.status(503).json({
      success: false,
      service: 'order-service',
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      database: 'disconnected',
      error: error.message
    });
  }
};

const readinessCheck = async (req, res) => {
  try {
    await sequelize.authenticate();
    
    res.json({
      success: true,
      ready: true,
      database: 'ready'
    });
  } catch (error) {
    res.status(503).json({
      success: false,
      ready: false,
      database: 'not ready'
    });
  }
};

const livenessCheck = (req, res) => {
  res.json({
    success: true,
    alive: true
  });
};

module.exports = {
  healthCheck,
  readinessCheck,
  livenessCheck
};
