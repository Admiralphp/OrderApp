const Payment = require('../models/Payment');
const stripeProvider = require('../providers/stripeProvider');
const config = require('../config');
const logger = require('../config/logger');

const handleStripeWebhook = async (req, res) => {
  try {
    const signature = req.headers['stripe-signature'];
    const payload = req.body;

    const result = await stripeProvider.handleWebhook(
      payload,
      signature,
      config.stripe.webhookSecret
    );

    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: 'Webhook verification failed'
      });
    }

    const event = result.event;

    // Handle different event types
    switch (event.type) {
      case 'payment_intent.succeeded':
        await handlePaymentSuccess(event.data.object);
        break;
      case 'payment_intent.payment_failed':
        await handlePaymentFailure(event.data.object);
        break;
      case 'charge.refunded':
        await handleRefund(event.data.object);
        break;
      default:
        logger.info(`Unhandled Stripe event type: ${event.type}`);
    }

    res.json({ received: true });
  } catch (error) {
    logger.error('Stripe webhook error:', error);
    res.status(500).json({
      success: false,
      message: 'Webhook processing failed',
      error: error.message
    });
  }
};

const handlePayPalWebhook = async (req, res) => {
  try {
    // PayPal webhook verification would go here
    const event = req.body;

    switch (event.event_type) {
      case 'PAYMENT.CAPTURE.COMPLETED':
        await handlePayPalCaptureCompleted(event.resource);
        break;
      case 'PAYMENT.CAPTURE.DENIED':
        await handlePayPalCaptureDenied(event.resource);
        break;
      default:
        logger.info(`Unhandled PayPal event type: ${event.event_type}`);
    }

    res.json({ received: true });
  } catch (error) {
    logger.error('PayPal webhook error:', error);
    res.status(500).json({
      success: false,
      message: 'Webhook processing failed',
      error: error.message
    });
  }
};

// Helper functions
const handlePaymentSuccess = async (paymentIntent) => {
  try {
    const payment = await Payment.findOne({ transactionId: paymentIntent.id });
    
    if (payment && payment.status !== 'completed') {
      payment.status = 'completed';
      payment.completedAt = new Date();
      await payment.save();
      
      logger.info(`Payment ${payment._id} marked as completed via webhook`);
    }
  } catch (error) {
    logger.error('Handle payment success error:', error);
  }
};

const handlePaymentFailure = async (paymentIntent) => {
  try {
    const payment = await Payment.findOne({ transactionId: paymentIntent.id });
    
    if (payment && payment.status !== 'failed') {
      payment.status = 'failed';
      payment.errorMessage = paymentIntent.last_payment_error?.message || 'Payment failed';
      await payment.save();
      
      logger.info(`Payment ${payment._id} marked as failed via webhook`);
    }
  } catch (error) {
    logger.error('Handle payment failure error:', error);
  }
};

const handleRefund = async (charge) => {
  try {
    const payment = await Payment.findOne({ transactionId: charge.payment_intent });
    
    if (payment && payment.status !== 'refunded') {
      payment.status = 'refunded';
      payment.refundedAt = new Date();
      payment.refundAmount = charge.amount_refunded / 100;
      await payment.save();
      
      logger.info(`Payment ${payment._id} marked as refunded via webhook`);
    }
  } catch (error) {
    logger.error('Handle refund error:', error);
  }
};

const handlePayPalCaptureCompleted = async (resource) => {
  try {
    const payment = await Payment.findOne({ transactionId: resource.id });
    
    if (payment && payment.status !== 'completed') {
      payment.status = 'completed';
      payment.completedAt = new Date();
      payment.metadata.captureId = resource.id;
      await payment.save();
      
      logger.info(`PayPal payment ${payment._id} marked as completed via webhook`);
    }
  } catch (error) {
    logger.error('Handle PayPal capture completed error:', error);
  }
};

const handlePayPalCaptureDenied = async (resource) => {
  try {
    const payment = await Payment.findOne({ transactionId: resource.id });
    
    if (payment && payment.status !== 'failed') {
      payment.status = 'failed';
      payment.errorMessage = 'Payment capture denied';
      await payment.save();
      
      logger.info(`PayPal payment ${payment._id} marked as failed via webhook`);
    }
  } catch (error) {
    logger.error('Handle PayPal capture denied error:', error);
  }
};

module.exports = {
  handleStripeWebhook,
  handlePayPalWebhook
};
