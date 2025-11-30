const express = require('express');
const router = express.Router();
const categoryController = require('../controllers/categoryController');
const { authenticate, authorize } = require('../middleware/auth');
const { validate, categorySchemas } = require('../middleware/validation');

// Public routes
router.get('/', categoryController.getAllCategories);

router.get('/:id', categoryController.getCategoryById);

// Admin routes
router.post(
  '/',
  authenticate,
  authorize('ADMIN'),
  validate(categorySchemas.create),
  categoryController.createCategory
);

router.put(
  '/:id',
  authenticate,
  authorize('ADMIN'),
  validate(categorySchemas.update),
  categoryController.updateCategory
);

router.delete(
  '/:id',
  authenticate,
  authorize('ADMIN'),
  categoryController.deleteCategory
);

module.exports = router;
