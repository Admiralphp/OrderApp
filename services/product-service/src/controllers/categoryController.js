const Category = require('../models/Category');
const Product = require('../models/Product');
const logger = require('../config/logger');

// Get all categories
exports.getAllCategories = async (req, res, next) => {
  try {
    const categories = await Category.findAll({
      where: { isActive: true },
      include: [
        {
          model: Category,
          as: 'parent',
          attributes: ['id', 'name', 'slug'],
        },
        {
          model: Category,
          as: 'children',
          attributes: ['id', 'name', 'slug'],
        },
      ],
      order: [['name', 'ASC']],
    });

    // Add product count for each category
    const categoriesWithCount = await Promise.all(
      categories.map(async (category) => {
        const productCount = await Product.count({
          where: { categoryId: category.id },
        });
        return {
          ...category.toJSON(),
          productCount,
        };
      })
    );

    logger.info('Categories retrieved', { count: categories.length });

    res.json({
      success: true,
      data: {
        categories: categoriesWithCount,
      },
    });
  } catch (error) {
    logger.error('Error retrieving categories', { error: error.message });
    next(error);
  }
};

// Get category by ID
exports.getCategoryById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const category = await Category.findByPk(id, {
      include: [
        {
          model: Category,
          as: 'parent',
          attributes: ['id', 'name', 'slug'],
        },
        {
          model: Category,
          as: 'children',
          attributes: ['id', 'name', 'slug'],
        },
      ],
    });

    if (!category) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'RESOURCE_NOT_FOUND',
          message: 'Category not found',
        },
      });
    }

    const productCount = await Product.count({
      where: { categoryId: id },
    });

    res.json({
      success: true,
      data: {
        ...category.toJSON(),
        productCount,
      },
    });
  } catch (error) {
    logger.error('Error retrieving category', { error: error.message, categoryId: req.params.id });
    next(error);
  }
};

// Create category (Admin only)
exports.createCategory = async (req, res, next) => {
  try {
    const category = await Category.create(req.body);

    logger.info('Category created', { categoryId: category.id, userId: req.user.userId });

    res.status(201).json({
      success: true,
      data: category,
      message: 'Category created successfully',
    });
  } catch (error) {
    logger.error('Error creating category', { error: error.message, userId: req.user.userId });
    next(error);
  }
};

// Update category (Admin only)
exports.updateCategory = async (req, res, next) => {
  try {
    const { id } = req.params;

    const category = await Category.findByPk(id);

    if (!category) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'RESOURCE_NOT_FOUND',
          message: 'Category not found',
        },
      });
    }

    await category.update(req.body);

    logger.info('Category updated', { categoryId: id, userId: req.user.userId });

    res.json({
      success: true,
      data: category,
      message: 'Category updated successfully',
    });
  } catch (error) {
    logger.error('Error updating category', { error: error.message, categoryId: req.params.id });
    next(error);
  }
};

// Delete category (Admin only)
exports.deleteCategory = async (req, res, next) => {
  try {
    const { id } = req.params;

    const category = await Category.findByPk(id);

    if (!category) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'RESOURCE_NOT_FOUND',
          message: 'Category not found',
        },
      });
    }

    // Check if category has products
    const productCount = await Product.count({
      where: { categoryId: id },
    });

    if (productCount > 0) {
      return res.status(409).json({
        success: false,
        error: {
          code: 'CATEGORY_HAS_PRODUCTS',
          message: `Cannot delete category with ${productCount} products. Please reassign or delete products first.`,
        },
      });
    }

    // Soft delete: mark as inactive
    await category.update({ isActive: false });

    logger.info('Category deleted', { categoryId: id, userId: req.user.userId });

    res.json({
      success: true,
      message: 'Category deleted successfully',
    });
  } catch (error) {
    logger.error('Error deleting category', { error: error.message, categoryId: req.params.id });
    next(error);
  }
};
