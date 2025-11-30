const Product = require('./Product');
const Category = require('./Category');
const { sequelize } = require('../config/database');

const models = {
  Product,
  Category,
  sequelize,
};

// Sync models (only in development)
const syncModels = async () => {
  if (process.env.NODE_ENV === 'development') {
    try {
      await sequelize.sync({ alter: false });
      console.log('✅ Models synchronized successfully');
    } catch (error) {
      console.error('❌ Error synchronizing models:', error.message);
    }
  }
};

module.exports = { ...models, syncModels };
