const Payment = require('../models/Payment');
const stripeProvider = require('../providers/stripeProvider');
const paypalProvider = require('../providers/paypalProvider');
const axios = require('axios');
const config = require('../config');
const logger = require('../config/logger');
const { paymentsTotal, paymentAmountTotal } = require('../utils/metrics');

const createPayment = async (req, res) => {
  try {
    const { orderId, amount, currency, provider, paymentMethod } = req.body;
    const userId = req.user.id;

    // Create payment record
    const payment = new Payment({
      userId,
      orderId,
      provider,
      amount,
      currency,
      paymentMethod,
      status: 'pending',
      metadata: {
        userAgent: req.headers['user-agent'],
        ip: req.ip
      }
    });

    await payment.save();

    let result;

    // Process payment based on provider
    if (provider === 'stripe') {
      result = await stripeProvider.createPaymentIntent(amount, currency, {
        orderId,
        userId,
        paymentId: payment._id.toString()
      });

      if (result.success) {
        payment.transactionId = result.transactionId;
        payment.status = 'processing';
        payment.metadata.clientSecret = result.clientSecret;
        await payment.save();
      }
    } else if (provider === 'paypal') {
      result = await paypalProvider.createOrder(amount, currency, {
        orderId,
        userId,
        paymentId: payment._id.toString()
      });

      if (result.success) {
        payment.transactionId = result.transactionId;
        payment.status = 'processing';
        payment.metadata.approvalUrl = result.approvalUrl;
        await payment.save();
      }
    } else {
      return res.status(400).json({
        success: false,
        message: 'Unsupported payment provider'
      });
    }

    if (!result.success) {
      payment.status = 'failed';
      payment.errorMessage = result.error;
      await payment.save();

      return res.status(400).json({
        success: false,
        message: 'Payment creation failed',
        error: result.error
      });
    }

    paymentsTotal.labels(provider, 'created').inc();

    res.status(201).json({
      success: true,
      message: 'Payment created successfully',
      payment: {
        id: payment._id,
        status: payment.status,
        ...(provider === 'stripe' && { clientSecret: payment.metadata.clientSecret }),
        ...(provider === 'paypal' && { approvalUrl: payment.metadata.approvalUrl })
      }
    });
  } catch (error) {
    logger.error('Create payment error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create payment',
      error: error.message
    });
  }
};

const confirmPayment = async (req, res) => {
  try {
    const { id } = req.params;
    const { transactionId } = req.body;

    const payment = await Payment.findById(id);

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'Payment not found'
      });
    }

    if (payment.userId !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized'
      });
    }

    let result;

    if (payment.provider === 'stripe') {
      result = await stripeProvider.confirmPayment(transactionId || payment.transactionId);
    } else if (payment.provider === 'paypal') {
      result = await paypalProvider.captureOrder(transactionId || payment.transactionId);
    }

    if (result.success) {
      payment.status = 'completed';
      payment.completedAt = new Date();
      payment.transactionId = result.transactionId;
      await payment.save();

      // Notify order service
      try {
        await axios.put(
          `${config.externalServices.orderService}/api/v1/orders/${payment.orderId}/status`,
          { status: 'confirmed' },
          { headers: { Authorization: req.headers.authorization } }
        );
      } catch (error) {
        logger.error('Failed to update order status:', error);
      }

      paymentsTotal.labels(payment.provider, 'completed').inc();
      paymentAmountTotal.labels(payment.provider, payment.currency).inc(payment.amount);

      res.json({
        success: true,
        message: 'Payment confirmed successfully',
        payment
      });
    } else {
      payment.status = 'failed';
      payment.errorMessage = result.error;
      await payment.save();

      paymentsTotal.labels(payment.provider, 'failed').inc();

      res.status(400).json({
        success: false,
        message: 'Payment confirmation failed',
        error: result.error
      });
    }
  } catch (error) {
    logger.error('Confirm payment error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to confirm payment',
      error: error.message
    });
  }
};

const refundPayment = async (req, res) => {
  try {
    const { id } = req.params;
    const { amount, reason } = req.body;

    const payment = await Payment.findById(id);

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'Payment not found'
      });
    }

    if (payment.status !== 'completed') {
      return res.status(400).json({
        success: false,
        message: 'Only completed payments can be refunded'
      });
    }

    let result;
    const refundAmount = amount || payment.amount;

    if (payment.provider === 'stripe') {
      result = await stripeProvider.refundPayment(payment.transactionId, refundAmount);
    } else if (payment.provider === 'paypal') {
      const captureId = payment.metadata.captureId;
      result = await paypalProvider.refundCapture(captureId, refundAmount, payment.currency);
    }

    if (result.success) {
      payment.status = 'refunded';
      payment.refundAmount = refundAmount;
      payment.refundReason = reason;
      payment.refundedAt = new Date();
      payment.metadata.refundId = result.refundId;
      await payment.save();

      paymentsTotal.labels(payment.provider, 'refunded').inc();

      res.json({
        success: true,
        message: 'Payment refunded successfully',
        payment
      });
    } else {
      res.status(400).json({
        success: false,
        message: 'Refund failed',
        error: result.error
      });
    }
  } catch (error) {
    logger.error('Refund payment error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to refund payment',
      error: error.message
    });
  }
};

const getPayments = async (req, res) => {
  try {
    const { page = 1, limit = 10, status, provider } = req.query;
    const userId = req.user.id;

    const query = { userId };
    if (status) query.status = status;
    if (provider) query.provider = provider;

    const payments = await Payment.find(query)
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const count = await Payment.countDocuments(query);

    res.json({
      success: true,
      payments,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
      totalPayments: count
    });
  } catch (error) {
    logger.error('Get payments error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve payments',
      error: error.message
    });
  }
};

const getPaymentById = async (req, res) => {
  try {
    const { id } = req.params;

    const payment = await Payment.findById(id);

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'Payment not found'
      });
    }

    if (payment.userId !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized'
      });
    }

    res.json({
      success: true,
      payment
    });
  } catch (error) {
    logger.error('Get payment error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve payment',
      error: error.message
    });
  }
};

module.exports = {
  createPayment,
  confirmPayment,
  refundPayment,
  getPayments,
  getPaymentById
};
