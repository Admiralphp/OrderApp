const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');
const { authenticate, authorize } = require('../middleware/auth');
const { validate, createOrderSchema, updateOrderStatusSchema } = require('../middleware/validation');

router.post('/', authenticate, validate(createOrderSchema), orderController.createOrder);
router.get('/', authenticate, orderController.getOrders);
router.get('/:id', authenticate, orderController.getOrderById);
router.put('/:id/status', authenticate, authorize('admin'), validate(updateOrderStatusSchema), orderController.updateOrderStatus);
router.post('/:id/cancel', authenticate, orderController.cancelOrder);

module.exports = router;
