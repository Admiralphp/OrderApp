const { getRedisClient } = require('../config/redis');
const logger = require('../config/logger');
const { emailQueueLength } = require('../utils/metrics');

const QUEUE_KEY = 'notification:queue';
const PROCESSING_KEY = 'notification:processing';
const FAILED_KEY = 'notification:failed';

class QueueService {
  async enqueue(notification) {
    try {
      const redis = getRedisClient();
      const payload = JSON.stringify({
        ...notification,
        enqueuedAt: new Date().toISOString(),
        attempts: 0
      });

      await redis.rPush(QUEUE_KEY, payload);
      
      const queueLength = await redis.lLen(QUEUE_KEY);
      emailQueueLength.set(queueLength);

      logger.info('Notification enqueued', { notificationId: notification.id });
      return true;
    } catch (error) {
      logger.error('Failed to enqueue notification:', error);
      return false;
    }
  }

  async dequeue() {
    try {
      const redis = getRedisClient();
      const payload = await redis.lPop(QUEUE_KEY);

      if (!payload) {
        return null;
      }

      const notification = JSON.parse(payload);
      
      // Move to processing
      await redis.hSet(PROCESSING_KEY, notification.id, payload);
      
      const queueLength = await redis.lLen(QUEUE_KEY);
      emailQueueLength.set(queueLength);

      return notification;
    } catch (error) {
      logger.error('Failed to dequeue notification:', error);
      return null;
    }
  }

  async markAsCompleted(notificationId) {
    try {
      const redis = getRedisClient();
      await redis.hDel(PROCESSING_KEY, notificationId);
      logger.info('Notification marked as completed', { notificationId });
      return true;
    } catch (error) {
      logger.error('Failed to mark notification as completed:', error);
      return false;
    }
  }

  async markAsFailed(notificationId, error, maxRetries) {
    try {
      const redis = getRedisClient();
      const payload = await redis.hGet(PROCESSING_KEY, notificationId);

      if (!payload) {
        return false;
      }

      const notification = JSON.parse(payload);
      notification.attempts = (notification.attempts || 0) + 1;
      notification.lastError = error;
      notification.lastAttemptAt = new Date().toISOString();

      // Remove from processing
      await redis.hDel(PROCESSING_KEY, notificationId);

      if (notification.attempts < maxRetries) {
        // Re-queue for retry
        await redis.rPush(QUEUE_KEY, JSON.stringify(notification));
        logger.warn('Notification re-queued for retry', {
          notificationId,
          attempts: notification.attempts
        });
      } else {
        // Move to failed
        await redis.hSet(FAILED_KEY, notificationId, JSON.stringify(notification));
        logger.error('Notification moved to failed', {
          notificationId,
          attempts: notification.attempts
        });
      }

      return true;
    } catch (error) {
      logger.error('Failed to mark notification as failed:', error);
      return false;
    }
  }

  async getQueueLength() {
    try {
      const redis = getRedisClient();
      return await redis.lLen(QUEUE_KEY);
    } catch (error) {
      logger.error('Failed to get queue length:', error);
      return 0;
    }
  }

  async getProcessingCount() {
    try {
      const redis = getRedisClient();
      return await redis.hLen(PROCESSING_KEY);
    } catch (error) {
      logger.error('Failed to get processing count:', error);
      return 0;
    }
  }

  async getFailedCount() {
    try {
      const redis = getRedisClient();
      return await redis.hLen(FAILED_KEY);
    } catch (error) {
      logger.error('Failed to get failed count:', error);
      return 0;
    }
  }

  async getFailedNotifications() {
    try {
      const redis = getRedisClient();
      const failed = await redis.hGetAll(FAILED_KEY);
      
      return Object.entries(failed).map(([id, payload]) => ({
        id,
        ...JSON.parse(payload)
      }));
    } catch (error) {
      logger.error('Failed to get failed notifications:', error);
      return [];
    }
  }

  async retryFailed(notificationId) {
    try {
      const redis = getRedisClient();
      const payload = await redis.hGet(FAILED_KEY, notificationId);

      if (!payload) {
        return false;
      }

      const notification = JSON.parse(payload);
      notification.attempts = 0;
      delete notification.lastError;

      await redis.hDel(FAILED_KEY, notificationId);
      await redis.rPush(QUEUE_KEY, JSON.stringify(notification));

      logger.info('Failed notification re-queued', { notificationId });
      return true;
    } catch (error) {
      logger.error('Failed to retry notification:', error);
      return false;
    }
  }
}

module.exports = new QueueService();
