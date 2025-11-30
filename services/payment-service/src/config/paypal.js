const paypal = require('@paypal/checkout-server-sdk');
const config = require('./index');
const logger = require('./logger');

let paypalClient = null;

const initializePayPal = () => {
  if (!config.paypal.clientId || !config.paypal.clientSecret) {
    logger.warn('PayPal credentials not configured');
    return null;
  }

  try {
    const environment = config.paypal.mode === 'live'
      ? new paypal.core.LiveEnvironment(config.paypal.clientId, config.paypal.clientSecret)
      : new paypal.core.SandboxEnvironment(config.paypal.clientId, config.paypal.clientSecret);

    paypalClient = new paypal.core.PayPalHttpClient(environment);
    
    logger.info(`PayPal client initialized in ${config.paypal.mode} mode`);
    return paypalClient;
  } catch (error) {
    logger.error('Failed to initialize PayPal:', error);
    return null;
  }
};

const getPayPalClient = () => {
  if (!paypalClient) {
    paypalClient = initializePayPal();
  }
  return paypalClient;
};

module.exports = { initializePayPal, getPayPalClient };
