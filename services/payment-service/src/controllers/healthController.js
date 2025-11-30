const mongoose = require('mongoose');

const healthCheck = async (req, res) => {
  try {
    const dbStatus = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';
    
    res.json({
      success: true,
      service: 'payment-service',
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      database: dbStatus
    });
  } catch (error) {
    res.status(503).json({
      success: false,
      service: 'payment-service',
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: error.message
    });
  }
};

const readinessCheck = async (req, res) => {
  try {
    const dbReady = mongoose.connection.readyState === 1;
    
    res.json({
      success: true,
      ready: dbReady,
      database: dbReady ? 'ready' : 'not ready'
    });
  } catch (error) {
    res.status(503).json({
      success: false,
      ready: false,
      error: error.message
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
