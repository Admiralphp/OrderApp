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

const paymentsTotal = new client.Counter({
  name: 'payments_total',
  help: 'Total number of payment transactions',
  labelNames: ['provider', 'status']
});

const paymentAmountTotal = new client.Counter({
  name: 'payment_amount_total',
  help: 'Total amount of payments processed',
  labelNames: ['provider', 'currency']
});

const activePaymentsGauge = new client.Gauge({
  name: 'active_payments',
  help: 'Number of active payments',
  labelNames: ['status']
});

// Register metrics
register.registerMetric(httpRequestDuration);
register.registerMetric(httpRequestTotal);
register.registerMetric(paymentsTotal);
register.registerMetric(paymentAmountTotal);
register.registerMetric(activePaymentsGauge);

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
  paymentsTotal,
  paymentAmountTotal,
  activePaymentsGauge
};
