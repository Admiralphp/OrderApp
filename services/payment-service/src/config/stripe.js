const Stripe = require('stripe');
const config = require('./index');
const logger = require('./logger');

let stripeClient = null;

const initializeStripe = () => {
  if (!config.stripe.secretKey) {
    logger.warn('Stripe secret key not configured');
    return null;
  }

  try {
    stripeClient = new Stripe(config.stripe.secretKey, {
      apiVersion: '2023-10-16'
    });
    
    logger.info('Stripe client initialized');
    return stripeClient;
  } catch (error) {
    logger.error('Failed to initialize Stripe:', error);
    return null;
  }
};

const getStripeClient = () => {
  if (!stripeClient) {
    stripeClient = initializeStripe();
  }
  return stripeClient;
};

module.exports = { initializeStripe, getStripeClient };
