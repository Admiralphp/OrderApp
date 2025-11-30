const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notificationController');
const { authenticate, authorize } = require('../middleware/auth');
const { validate, sendNotificationSchema, sendEmailSchema } = require('../middleware/validation');

router.post('/', validate(sendNotificationSchema), notificationController.sendNotification);
router.post('/email', validate(sendEmailSchema), notificationController.sendEmail);
router.get('/queue/stats', authenticate, authorize('admin'), notificationController.getQueueStats);
router.get('/failed', authenticate, authorize('admin'), notificationController.getFailedNotifications);
router.post('/failed/:id/retry', authenticate, authorize('admin'), notificationController.retryFailedNotification);

module.exports = router;
