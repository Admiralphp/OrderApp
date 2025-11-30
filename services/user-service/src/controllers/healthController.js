const mongoose = require('mongoose');

exports.healthCheck = (req, res) => {
  res.json({
    success: true,
    message: 'User service is running',
    timestamp: new Date().toISOString()
  });
};

exports.readinessCheck = (req, res) => {
  const isDbReady = mongoose.connection.readyState === 1;

  if (!isDbReady) {
    return res.status(503).json({
      success: false,
      message: 'Service not ready',
      details: {
        database: 'disconnected'
      }
    });
  }

  res.json({
    success: true,
    message: 'Service is ready',
    details: {
      database: 'connected'
    }
  });
};

exports.livenessCheck = (req, res) => {
  res.json({
    success: true,
    message: 'Service is alive',
    uptime: process.uptime()
  });
};
