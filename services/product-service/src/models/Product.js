const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');
const Category = require('./Category');

const Product = sequelize.define('Product', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  name: {
    type: DataTypes.STRING(200),
    allowNull: false,
    validate: {
      notEmpty: true,
      len: [2, 200],
    },
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  sku: {
    type: DataTypes.STRING(50),
    allowNull: false,
    unique: true,
    validate: {
      notEmpty: true,
      is: /^[A-Z0-9-]+$/i,
    },
  },
  categoryId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'categories',
      key: 'id',
    },
    onDelete: 'SET NULL',
    field: 'category_id',
  },
  price: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    validate: {
      min: 0,
      isDecimal: true,
    },
  },
  discountPrice: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
    validate: {
      min: 0,
      isDecimal: true,
    },
    field: 'discount_price',
  },
  stockQuantity: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
    validate: {
      min: 0,
      isInt: true,
    },
    field: 'stock_quantity',
  },
  isAvailable: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    field: 'is_available',
  },
  images: {
    type: DataTypes.JSONB,
    defaultValue: [],
    validate: {
      isValidArray(value) {
        if (!Array.isArray(value)) {
          throw new Error('Images must be an array');
        }
      },
    },
  },
  attributes: {
    type: DataTypes.JSONB,
    defaultValue: {},
  },
  tags: {
    type: DataTypes.ARRAY(DataTypes.STRING),
    defaultValue: [],
  },
  weight: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
    validate: {
      min: 0,
    },
  },
  dimensions: {
    type: DataTypes.JSONB,
    allowNull: true,
    defaultValue: {},
  },
  createdBy: {
    type: DataTypes.INTEGER,
    allowNull: true,
    field: 'created_by',
  },
  updatedBy: {
    type: DataTypes.INTEGER,
    allowNull: true,
    field: 'updated_by',
  },
}, {
  tableName: 'products',
  indexes: [
    { fields: ['sku'], unique: true },
    { fields: ['category_id'] },
    { fields: ['price'] },
    { fields: ['is_available'] },
    { fields: ['created_at'] },
  ],
  hooks: {
    beforeValidate: (product) => {
      // Ensure discount price is less than regular price
      if (product.discountPrice && product.discountPrice >= product.price) {
        throw new Error('Discount price must be less than regular price');
      }
    },
  },
});

// Association with Category
Product.belongsTo(Category, { foreignKey: 'categoryId', as: 'category' });
Category.hasMany(Product, { foreignKey: 'categoryId', as: 'products' });

module.exports = Product;
