const { v4: uuidv4 } = require('uuid');
const queueService = require('../services/queueService');
const emailService = require('../services/emailService');
const logger = require('../config/logger');

const sendNotification = async (req, res) => {
  try {
    const { to, type, data } = req.body;

    const notificationId = uuidv4();
    
    const notification = {
      id: notificationId,
      to,
      type,
      data,
      userId: req.user?.id,
      createdAt: new Date().toISOString()
    };

    const enqueued = await queueService.enqueue(notification);

    if (enqueued) {
      res.status(202).json({
        success: true,
        message: 'Notification queued successfully',
        notificationId
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'Failed to queue notification'
      });
    }
  } catch (error) {
    logger.error('Send notification error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send notification',
      error: error.message
    });
  }
};

const sendEmail = async (req, res) => {
  try {
    const { to, subject, template, data } = req.body;

    const result = await emailService.sendEmail({
      to,
      subject,
      template,
      data
    });

    if (result.success) {
      res.json({
        success: true,
        message: 'Email sent successfully',
        messageId: result.messageId
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'Failed to send email',
        error: result.error
      });
    }
  } catch (error) {
    logger.error('Send email error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send email',
      error: error.message
    });
  }
};

const getQueueStats = async (req, res) => {
  try {
    const queueLength = await queueService.getQueueLength();
    const processingCount = await queueService.getProcessingCount();
    const failedCount = await queueService.getFailedCount();

    res.json({
      success: true,
      stats: {
        queued: queueLength,
        processing: processingCount,
        failed: failedCount,
        total: queueLength + processingCount + failedCount
      }
    });
  } catch (error) {
    logger.error('Get queue stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get queue stats',
      error: error.message
    });
  }
};

const getFailedNotifications = async (req, res) => {
  try {
    const failed = await queueService.getFailedNotifications();

    res.json({
      success: true,
      count: failed.length,
      notifications: failed
    });
  } catch (error) {
    logger.error('Get failed notifications error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get failed notifications',
      error: error.message
    });
  }
};

const retryFailedNotification = async (req, res) => {
  try {
    const { id } = req.params;

    const retried = await queueService.retryFailed(id);

    if (retried) {
      res.json({
        success: true,
        message: 'Notification re-queued for retry'
      });
    } else {
      res.status(404).json({
        success: false,
        message: 'Notification not found'
      });
    }
  } catch (error) {
    logger.error('Retry failed notification error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retry notification',
      error: error.message
    });
  }
};

module.exports = {
  sendNotification,
  sendEmail,
  getQueueStats,
  getFailedNotifications,
  retryFailedNotification
};
