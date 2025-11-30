const { getRedisClient } = require('../config/redis');

const healthCheck = async (req, res) => {
  try {
    const redis = getRedisClient();
    await redis.ping();
    
    res.json({
      success: true,
      service: 'notification-service',
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      redis: 'connected'
    });
  } catch (error) {
    res.status(503).json({
      success: false,
      service: 'notification-service',
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      redis: 'disconnected',
      error: error.message
    });
  }
};

const readinessCheck = async (req, res) => {
  try {
    const redis = getRedisClient();
    await redis.ping();
    
    res.json({
      success: true,
      ready: true,
      redis: 'ready'
    });
  } catch (error) {
    res.status(503).json({
      success: false,
      ready: false,
      redis: 'not ready'
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
