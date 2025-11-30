const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');
const { authenticate, authorize } = require('../middleware/auth');
const { validate, validateQuery, productSchemas } = require('../middleware/validation');

// Public routes
router.get(
  '/',
  validateQuery(productSchemas.listQuery),
  productController.getAllProducts
);

router.get('/:id', productController.getProductById);

router.get('/sku/:sku', productController.getProductBySku);

// Admin routes
router.post(
  '/',
  authenticate,
  authorize('ADMIN'),
  validate(productSchemas.create),
  productController.createProduct
);

router.put(
  '/:id',
  authenticate,
  authorize('ADMIN'),
  validate(productSchemas.update),
  productController.updateProduct
);

router.patch(
  '/:id/stock',
  authenticate,
  authorize('ADMIN'),
  validate(productSchemas.updateStock),
  productController.updateStock
);

router.delete(
  '/:id',
  authenticate,
  authorize('ADMIN'),
  productController.deleteProduct
);

module.exports = router;
