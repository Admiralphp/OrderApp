const client = require('prom-client');

// Create a Registry
const register = new client.Registry();

// Add default metrics
client.collectDefaultMetrics({ register });

// Custom metrics
const httpRequestDuration = new client.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.1, 0.3, 0.5, 0.7, 1, 3, 5, 7, 10]
});

const httpRequestTotal = new client.Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status_code']
});

const emailsSentTotal = new client.Counter({
  name: 'emails_sent_total',
  help: 'Total number of emails sent',
  labelNames: ['status']
});

const emailQueueLength = new client.Gauge({
  name: 'email_queue_length',
  help: 'Number of emails in queue'
});

const notificationProcessingTime = new client.Histogram({
  name: 'notification_processing_time_seconds',
  help: 'Time taken to process notifications',
  buckets: [0.1, 0.5, 1, 2, 5, 10]
});

// Register metrics
register.registerMetric(httpRequestDuration);
register.registerMetric(httpRequestTotal);
register.registerMetric(emailsSentTotal);
register.registerMetric(emailQueueLength);
register.registerMetric(notificationProcessingTime);

// Middleware to track HTTP metrics
const metricsMiddleware = (req, res, next) => {
  const start = Date.now();

  res.on('finish', () => {
    const duration = (Date.now() - start) / 1000;
    const route = req.route ? req.route.path : req.path;

    httpRequestDuration.labels(req.method, route, res.statusCode).observe(duration);
    httpRequestTotal.labels(req.method, route, res.statusCode).inc();
  });

  next();
};

module.exports = {
  register,
  metricsMiddleware,
  emailsSentTotal,
  emailQueueLength,
  notificationProcessingTime
};
