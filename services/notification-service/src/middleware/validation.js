const Joi = require('joi');

const sendNotificationSchema = Joi.object({
  to: Joi.string().email().required(),
  type: Joi.string().valid(
    'order_confirmation',
    'order_shipped',
    'order_delivered',
    'payment_confirmation',
    'welcome'
  ).required(),
  data: Joi.object().required()
});

const sendEmailSchema = Joi.object({
  to: Joi.string().email().required(),
  subject: Joi.string().required(),
  template: Joi.string().required(),
  data: Joi.object().default({})
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
  sendNotificationSchema,
  sendEmailSchema
};
