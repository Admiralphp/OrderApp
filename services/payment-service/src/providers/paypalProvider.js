const paypal = require('@paypal/checkout-server-sdk');
const { getPayPalClient } = require('../config/paypal');
const logger = require('../config/logger');

class PayPalProvider {
  async createOrder(amount, currency, metadata) {
    try {
      const client = getPayPalClient();
      
      if (!client) {
        throw new Error('PayPal not configured');
      }

      const request = new paypal.orders.OrdersCreateRequest();
      request.prefer('return=representation');
      request.requestBody({
        intent: 'CAPTURE',
        purchase_units: [{
          amount: {
            currency_code: currency.toUpperCase(),
            value: amount.toFixed(2)
          },
          description: metadata.description || 'Order payment',
          custom_id: metadata.orderId
        }]
      });

      const order = await client.execute(request);

      return {
        success: true,
        orderId: order.result.id,
        transactionId: order.result.id,
        status: order.result.status,
        approvalUrl: order.result.links.find(link => link.rel === 'approve')?.href
      };
    } catch (error) {
      logger.error('PayPal order creation failed:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  async captureOrder(orderId) {
    try {
      const client = getPayPalClient();
      
      const request = new paypal.orders.OrdersCaptureRequest(orderId);
      request.requestBody({});

      const capture = await client.execute(request);

      return {
        success: capture.result.status === 'COMPLETED',
        status: capture.result.status,
        transactionId: capture.result.id,
        captureId: capture.result.purchase_units[0]?.payments?.captures[0]?.id
      };
    } catch (error) {
      logger.error('PayPal order capture failed:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  async refundCapture(captureId, amount, currency) {
    try {
      const client = getPayPalClient();
      
      const request = new paypal.payments.CapturesRefundRequest(captureId);
      request.requestBody({
        amount: {
          value: amount.toFixed(2),
          currency_code: currency.toUpperCase()
        }
      });

      const refund = await client.execute(request);

      return {
        success: refund.result.status === 'COMPLETED',
        refundId: refund.result.id,
        status: refund.result.status,
        amount: parseFloat(refund.result.amount.value)
      };
    } catch (error) {
      logger.error('PayPal refund failed:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  async verifyWebhook(headers, body, webhookId) {
    try {
      const client = getPayPalClient();
      
      const request = new paypal.notifications.WebhookVerifySignatureRequest();
      request.requestBody({
        auth_algo: headers['paypal-auth-algo'],
        cert_url: headers['paypal-cert-url'],
        transmission_id: headers['paypal-transmission-id'],
        transmission_sig: headers['paypal-transmission-sig'],
        transmission_time: headers['paypal-transmission-time'],
        webhook_id: webhookId,
        webhook_event: body
      });

      const response = await client.execute(request);

      return {
        success: response.result.verification_status === 'SUCCESS',
        event: body
      };
    } catch (error) {
      logger.error('PayPal webhook verification failed:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
}

module.exports = new PayPalProvider();
