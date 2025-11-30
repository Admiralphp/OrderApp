const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { authenticate, authorize } = require('../middleware/auth');
const { validate, addressSchema } = require('../middleware/validation');

// Admin only routes
router.get('/', authenticate, authorize('admin'), userController.getAllUsers);
router.get('/:id', authenticate, authorize('admin'), userController.getUserById);
router.put('/:id', authenticate, authorize('admin'), userController.updateUser);
router.delete('/:id', authenticate, authorize('admin'), userController.deleteUser);

// Address management (authenticated users)
router.post('/addresses', authenticate, validate(addressSchema), userController.addAddress);
router.put('/addresses/:addressId', authenticate, validate(addressSchema), userController.updateAddress);
router.delete('/addresses/:addressId', authenticate, userController.deleteAddress);

module.exports = router;
