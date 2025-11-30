const Joi = require('joi');

const createPaymentSchema = Joi.object({
  orderId: Joi.string().required(),
  amount: Joi.number().min(0.01).required(),
  currency: Joi.string().length(3).uppercase().default('USD'),
  provider: Joi.string().valid('stripe', 'paypal').required(),
  paymentMethod: Joi.string().required()
});

const confirmPaymentSchema = Joi.object({
  transactionId: Joi.string().optional()
});

const refundPaymentSchema = Joi.object({
  amount: Joi.number().min(0.01).optional(),
  reason: Joi.string().required()
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
  createPaymentSchema,
  confirmPaymentSchema,
  refundPaymentSchema
};
