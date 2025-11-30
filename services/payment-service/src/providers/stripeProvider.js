const { getStripeClient } = require('../config/stripe');
const logger = require('../config/logger');

class StripeProvider {
  async createPaymentIntent(amount, currency, metadata) {
    try {
      const stripe = getStripeClient();
      
      if (!stripe) {
        throw new Error('Stripe not configured');
      }

      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(amount * 100), // Convert to cents
        currency: currency.toLowerCase(),
        metadata,
        automatic_payment_methods: {
          enabled: true
        }
      });

      return {
        success: true,
        clientSecret: paymentIntent.client_secret,
        transactionId: paymentIntent.id,
        status: paymentIntent.status
      };
    } catch (error) {
      logger.error('Stripe payment intent creation failed:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  async confirmPayment(paymentIntentId) {
    try {
      const stripe = getStripeClient();
      
      const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

      return {
        success: paymentIntent.status === 'succeeded',
        status: paymentIntent.status,
        transactionId: paymentIntent.id,
        amount: paymentIntent.amount / 100
      };
    } catch (error) {
      logger.error('Stripe payment confirmation failed:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  async refundPayment(paymentIntentId, amount) {
    try {
      const stripe = getStripeClient();
      
      const refund = await stripe.refunds.create({
        payment_intent: paymentIntentId,
        amount: amount ? Math.round(amount * 100) : undefined
      });

      return {
        success: refund.status === 'succeeded',
        refundId: refund.id,
        status: refund.status,
        amount: refund.amount / 100
      };
    } catch (error) {
      logger.error('Stripe refund failed:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  async handleWebhook(payload, signature, webhookSecret) {
    try {
      const stripe = getStripeClient();
      
      const event = stripe.webhooks.constructEvent(
        payload,
        signature,
        webhookSecret
      );

      return {
        success: true,
        event
      };
    } catch (error) {
      logger.error('Stripe webhook verification failed:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
}

module.exports = new StripeProvider();
