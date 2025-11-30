const Joi = require('joi');

const createOrderSchema = Joi.object({
  items: Joi.array().items(
    Joi.object({
      productId: Joi.string().uuid().required(),
      quantity: Joi.number().integer().min(1).required()
    })
  ).min(1).required(),
  shippingAddress: Joi.object({
    street: Joi.string().required(),
    city: Joi.string().required(),
    state: Joi.string().optional(),
    zipCode: Joi.string().required(),
    country: Joi.string().required()
  }).required(),
  paymentMethod: Joi.string().valid('credit_card', 'paypal', 'stripe').required(),
  notes: Joi.string().optional()
});

const updateOrderStatusSchema = Joi.object({
  status: Joi.string().valid('confirmed', 'processing', 'shipped', 'delivered', 'cancelled').required()
});

const addToCartSchema = Joi.object({
  productId: Joi.string().uuid().required(),
  quantity: Joi.number().integer().min(1).default(1)
});

const updateCartItemSchema = Joi.object({
  quantity: Joi.number().integer().min(1).required()
});

const validate = (schema) => {
  return (req, res, next) => {
    const { error } = schema.validate(req.body, { abortEarly: false });
    
    if (error) {
      const errors = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message
      }));
      
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors
      });
    }
    
    next();
  };
};

module.exports = {
  validate,
  createOrderSchema,
  updateOrderStatusSchema,
  addToCartSchema,
  updateCartItemSchema
};
