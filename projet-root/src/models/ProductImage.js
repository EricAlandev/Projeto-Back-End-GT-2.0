const { Model, DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');
const Product = require('./Product');

class ProductImage extends Model {}

ProductImage.init({
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  product_id: {
    type: DataTypes.INTEGER,
    references: {
      model: Product,
      key: 'id',
    },
    allowNull: false,
  },
  enabled: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  path: {
    type: DataTypes.STRING,
    allowNull: false,
  }
}, {
  sequelize,
  modelName: 'ProductImage',
  tableName: 'product_images',
  timestamps: true,
  underscored: true,
});

module.exports = ProductImage;
