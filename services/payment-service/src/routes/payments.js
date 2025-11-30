const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');
const { authenticate, authorize } = require('../middleware/auth');
const { validate, createPaymentSchema, confirmPaymentSchema, refundPaymentSchema } = require('../middleware/validation');

router.post('/', authenticate, validate(createPaymentSchema), paymentController.createPayment);
router.post('/:id/confirm', authenticate, validate(confirmPaymentSchema), paymentController.confirmPayment);
router.post('/:id/refund', authenticate, authorize('admin'), validate(refundPaymentSchema), paymentController.refundPayment);
router.get('/', authenticate, paymentController.getPayments);
router.get('/:id', authenticate, paymentController.getPaymentById);

module.exports = router;
