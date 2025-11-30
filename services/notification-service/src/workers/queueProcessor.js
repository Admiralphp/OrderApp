const queueService = require('../services/queueService');
const emailService = require('../services/emailService');
const config = require('../config');
const logger = require('../config/logger');
const { notificationProcessingTime } = require('../utils/metrics');

class QueueProcessor {
  constructor() {
    this.isRunning = false;
    this.processingInterval = null;
  }

  async processNotification(notification) {
    const start = Date.now();

    try {
      logger.info('Processing notification', {
        notificationId: notification.id,
        type: notification.type
      });

      let result;

      switch (notification.type) {
        case 'order_confirmation':
          result = await emailService.sendOrderConfirmation(notification.to, notification.data);
          break;
        case 'order_shipped':
          result = await emailService.sendOrderShipped(notification.to, notification.data);
          break;
        case 'order_delivered':
          result = await emailService.sendOrderDelivered(notification.to, notification.data);
          break;
        case 'payment_confirmation':
          result = await emailService.sendPaymentConfirmation(notification.to, notification.data);
          break;
        case 'welcome':
          result = await emailService.sendWelcomeEmail(notification.to, notification.data);
          break;
        default:
          throw new Error(`Unknown notification type: ${notification.type}`);
      }

      if (result.success) {
        await queueService.markAsCompleted(notification.id);
        logger.info('Notification processed successfully', {
          notificationId: notification.id
        });
      } else {
        throw new Error(result.error || 'Failed to send notification');
      }

      const duration = (Date.now() - start) / 1000;
      notificationProcessingTime.observe(duration);

    } catch (error) {
      logger.error('Failed to process notification:', error);
      await queueService.markAsFailed(
        notification.id,
        error.message,
        config.queue.maxRetries
      );
    }
  }

  async processQueue() {
    if (!this.isRunning) {
      return;
    }

    try {
      const notification = await queueService.dequeue();

      if (notification) {
        await this.processNotification(notification);
        // Process next immediately if available
        setImmediate(() => this.processQueue());
      } else {
        // No notifications, wait before checking again
        setTimeout(() => this.processQueue(), 1000);
      }
    } catch (error) {
      logger.error('Queue processing error:', error);
      setTimeout(() => this.processQueue(), 5000);
    }
  }

  start() {
    if (this.isRunning) {
      logger.warn('Queue processor already running');
      return;
    }

    this.isRunning = true;
    logger.info('Starting queue processor');
    this.processQueue();
  }

  stop() {
    this.isRunning = false;
    if (this.processingInterval) {
      clearInterval(this.processingInterval);
    }
    logger.info('Queue processor stopped');
  }
}

module.exports = new QueueProcessor();
