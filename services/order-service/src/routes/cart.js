const express = require('express');
const router = express.Router();
const cartController = require('../controllers/cartController');
const { authenticate } = require('../middleware/auth');
const { validate, addToCartSchema, updateCartItemSchema } = require('../middleware/validation');

router.get('/', authenticate, cartController.getCart);
router.post('/items', authenticate, validate(addToCartSchema), cartController.addToCart);
router.put('/items/:itemId', authenticate, validate(updateCartItemSchema), cartController.updateCartItem);
router.delete('/items/:itemId', authenticate, cartController.removeFromCart);
router.delete('/', authenticate, cartController.clearCart);

module.exports = router;
