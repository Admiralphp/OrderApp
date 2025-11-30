const Product = require('../models/Product');
const Category = require('../models/Category');
const logger = require('../config/logger');
const { Op } = require('sequelize');

// Get all products with filters
exports.getAllProducts = async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 20,
      category,
      minPrice,
      maxPrice,
      available,
      sort = 'created_desc',
      search,
    } = req.query;

    const offset = (page - 1) * limit;

    // Build where clause
    const where = {};

    if (category) {
      where.categoryId = category;
    }

    if (minPrice || maxPrice) {
      where.price = {};
      if (minPrice) where.price[Op.gte] = minPrice;
      if (maxPrice) where.price[Op.lte] = maxPrice;
    }

    if (available !== undefined) {
      where.isAvailable = available === 'true' || available === true;
    }

    if (search) {
      where[Op.or] = [
        { name: { [Op.iLike]: `%${search}%` } },
        { description: { [Op.iLike]: `%${search}%` } },
      ];
    }

    // Build order clause
    const orderMap = {
      price_asc: [['price', 'ASC']],
      price_desc: [['price', 'DESC']],
      name_asc: [['name', 'ASC']],
      name_desc: [['name', 'DESC']],
      created_desc: [['createdAt', 'DESC']],
    };
    const order = orderMap[sort] || orderMap.created_desc;

    // Query products
    const { count, rows: products } = await Product.findAndCountAll({
      where,
      include: [
        {
          model: Category,
          as: 'category',
          attributes: ['id', 'name', 'slug'],
        },
      ],
      limit: parseInt(limit),
      offset: parseInt(offset),
      order,
    });

    const totalPages = Math.ceil(count / limit);

    logger.info('Products retrieved', { count, page, limit });

    res.json({
      success: true,
      data: {
        products,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: count,
          totalPages,
          hasNext: page < totalPages,
          hasPrev: page > 1,
        },
      },
    });
  } catch (error) {
    logger.error('Error retrieving products', { error: error.message });
    next(error);
  }
};

// Get product by ID
exports.getProductById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const product = await Product.findByPk(id, {
      include: [
        {
          model: Category,
          as: 'category',
          attributes: ['id', 'name', 'slug', 'description'],
        },
      ],
    });

    if (!product) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'RESOURCE_NOT_FOUND',
          message: 'Product not found',
        },
      });
    }

    logger.info('Product retrieved', { productId: id });

    res.json({
      success: true,
      data: product,
    });
  } catch (error) {
    logger.error('Error retrieving product', { error: error.message, productId: req.params.id });
    next(error);
  }
};

// Get product by SKU
exports.getProductBySku = async (req, res, next) => {
  try {
    const { sku } = req.params;

    const product = await Product.findOne({
      where: { sku: sku.toUpperCase() },
      include: [
        {
          model: Category,
          as: 'category',
          attributes: ['id', 'name', 'slug'],
        },
      ],
    });

    if (!product) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'RESOURCE_NOT_FOUND',
          message: 'Product not found',
        },
      });
    }

    res.json({
      success: true,
      data: product,
    });
  } catch (error) {
    logger.error('Error retrieving product by SKU', { error: error.message, sku: req.params.sku });
    next(error);
  }
};

// Create product (Admin only)
exports.createProduct = async (req, res, next) => {
  try {
    const productData = {
      ...req.body,
      sku: req.body.sku.toUpperCase(),
      createdBy: req.user.userId,
    };

    const product = await Product.create(productData);

    logger.info('Product created', { productId: product.id, userId: req.user.userId });

    res.status(201).json({
      success: true,
      data: product,
      message: 'Product created successfully',
    });
  } catch (error) {
    logger.error('Error creating product', { error: error.message, userId: req.user.userId });
    next(error);
  }
};

// Update product (Admin only)
exports.updateProduct = async (req, res, next) => {
  try {
    const { id } = req.params;

    const product = await Product.findByPk(id);

    if (!product) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'RESOURCE_NOT_FOUND',
          message: 'Product not found',
        },
      });
    }

    const updateData = {
      ...req.body,
      updatedBy: req.user.userId,
    };

    if (req.body.sku) {
      updateData.sku = req.body.sku.toUpperCase();
    }

    await product.update(updateData);

    logger.info('Product updated', { productId: id, userId: req.user.userId });

    res.json({
      success: true,
      data: product,
      message: 'Product updated successfully',
    });
  } catch (error) {
    logger.error('Error updating product', { error: error.message, productId: req.params.id });
    next(error);
  }
};

// Update product stock (Admin only)
exports.updateStock = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { stockQuantity } = req.body;

    const product = await Product.findByPk(id);

    if (!product) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'RESOURCE_NOT_FOUND',
          message: 'Product not found',
        },
      });
    }

    await product.update({
      stockQuantity,
      updatedBy: req.user.userId,
    });

    logger.info('Product stock updated', { productId: id, newStock: stockQuantity });

    res.json({
      success: true,
      data: {
        id: product.id,
        sku: product.sku,
        stockQuantity: product.stockQuantity,
      },
      message: 'Stock updated successfully',
    });
  } catch (error) {
    logger.error('Error updating stock', { error: error.message, productId: req.params.id });
    next(error);
  }
};

// Delete product (Admin only)
exports.deleteProduct = async (req, res, next) => {
  try {
    const { id } = req.params;

    const product = await Product.findByPk(id);

    if (!product) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'RESOURCE_NOT_FOUND',
          message: 'Product not found',
        },
      });
    }

    // Soft delete: mark as inactive instead of deleting
    await product.update({
      isAvailable: false,
      updatedBy: req.user.userId,
    });

    logger.info('Product deleted', { productId: id, userId: req.user.userId });

    res.json({
      success: true,
      message: 'Product deleted successfully',
    });
  } catch (error) {
    logger.error('Error deleting product', { error: error.message, productId: req.params.id });
    next(error);
  }
};
