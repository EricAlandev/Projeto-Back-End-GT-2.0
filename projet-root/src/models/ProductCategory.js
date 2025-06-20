const { Model, DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');
const Product = require('./Product');
const Category = require('./Category');

class ProductCategory extends Model {}

ProductCategory.init({
  product_id: {
    type: DataTypes.INTEGER,
    references: {
      model: Product,
      key: 'id',
    },
    allowNull: false,
    primaryKey: true,
  },
  category_id: {
    type: DataTypes.INTEGER,
    references: {
      model: Category,
      key: 'id',
    },
    allowNull: false,
    primaryKey: true,
  },
}, {
  sequelize,
  modelName: 'ProductCategory',
  tableName: 'product_categories',
  timestamps: false,
  underscored: true,
});

module.exports = ProductCategory;
