const Joi = require('joi');

const validate = (schema) => {
  return (req, res, next) => {
    const { error } = schema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true,
    });

    if (error) {
      const errors = error.details.map((detail) => ({
        field: detail.path.join('.'),
        message: detail.message,
      }));

      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Validation failed',
          details: errors,
        },
      });
    }

    next();
  };
};

const validateQuery = (schema) => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.query, {
      abortEarly: false,
      stripUnknown: true,
    });

    if (error) {
      const errors = error.details.map((detail) => ({
        field: detail.path.join('.'),
        message: detail.message,
      }));

      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Query validation failed',
          details: errors,
        },
      });
    }

    req.query = value;
    next();
  };
};

// Product validation schemas
const productSchemas = {
  create: Joi.object({
    name: Joi.string().min(2).max(200).required(),
    description: Joi.string().allow('').optional(),
    sku: Joi.string().pattern(/^[A-Z0-9-]+$/i).required(),
    categoryId: Joi.number().integer().positive().optional(),
    price: Joi.number().positive().precision(2).required(),
    discountPrice: Joi.number().positive().precision(2).less(Joi.ref('price')).optional(),
    stockQuantity: Joi.number().integer().min(0).required(),
    isAvailable: Joi.boolean().optional(),
    images: Joi.array().items(Joi.string().uri()).optional(),
    attributes: Joi.object().optional(),
    tags: Joi.array().items(Joi.string()).optional(),
    weight: Joi.number().positive().precision(2).optional(),
    dimensions: Joi.object({
      length: Joi.number().positive(),
      width: Joi.number().positive(),
      height: Joi.number().positive(),
      unit: Joi.string().valid('cm', 'inch'),
    }).optional(),
  }),

  update: Joi.object({
    name: Joi.string().min(2).max(200).optional(),
    description: Joi.string().allow('').optional(),
    sku: Joi.string().pattern(/^[A-Z0-9-]+$/i).optional(),
    categoryId: Joi.number().integer().positive().allow(null).optional(),
    price: Joi.number().positive().precision(2).optional(),
    discountPrice: Joi.number().positive().precision(2).allow(null).optional(),
    stockQuantity: Joi.number().integer().min(0).optional(),
    isAvailable: Joi.boolean().optional(),
    images: Joi.array().items(Joi.string().uri()).optional(),
    attributes: Joi.object().optional(),
    tags: Joi.array().items(Joi.string()).optional(),
    weight: Joi.number().positive().precision(2).allow(null).optional(),
    dimensions: Joi.object({
      length: Joi.number().positive(),
      width: Joi.number().positive(),
      height: Joi.number().positive(),
      unit: Joi.string().valid('cm', 'inch'),
    }).allow(null).optional(),
  }),

  updateStock: Joi.object({
    stockQuantity: Joi.number().integer().min(0).required(),
  }),

  listQuery: Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(20),
    category: Joi.number().integer().positive().optional(),
    minPrice: Joi.number().positive().optional(),
    maxPrice: Joi.number().positive().optional(),
    available: Joi.boolean().optional(),
    sort: Joi.string().valid('price_asc', 'price_desc', 'name_asc', 'name_desc', 'created_desc').default('created_desc'),
    search: Joi.string().min(1).max(100).optional(),
  }),
};

// Category validation schemas
const categorySchemas = {
  create: Joi.object({
    name: Joi.string().min(2).max(100).required(),
    description: Joi.string().allow('').optional(),
    slug: Joi.string().pattern(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).required(),
    parentId: Joi.number().integer().positive().optional(),
    isActive: Joi.boolean().optional(),
  }),

  update: Joi.object({
    name: Joi.string().min(2).max(100).optional(),
    description: Joi.string().allow('').optional(),
    slug: Joi.string().pattern(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).optional(),
    parentId: Joi.number().integer().positive().allow(null).optional(),
    isActive: Joi.boolean().optional(),
  }),
};

module.exports = {
  validate,
  validateQuery,
  productSchemas,
  categorySchemas,
};
