const { Sequelize } = require('sequelize');
require('dotenv').config();

const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASS,
  {
    host: process.env.DB_HOST,
    dialect: 'mysql',
    logging: false,
    define: {
      underscored: true, // para usar snake_case nas colunas
      timestamps: true,  // created_at e updated_at automáticos
    }
  }
);

module.exports = { sequelize };
