const express = require('express');
const router = express.Router();
const webhookController = require('../controllers/webhookController');

// Stripe webhook (raw body needed)
router.post('/stripe', express.raw({ type: 'application/json' }), webhookController.handleStripeWebhook);

// PayPal webhook
router.post('/paypal', webhookController.handlePayPalWebhook);

module.exports = router;
