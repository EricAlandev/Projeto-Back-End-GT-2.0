require('dotenv').config();
const app = require('./app');
const { sequelize } = require('./config/database');

const PORT = process.env.PORT || 3000;

sequelize.sync({ force: false }) // false para não apagar dados existentes
  .then(() => {
    console.log('Banco sincronizado, tabelas criadas se não existiam');
    app.listen(PORT, () => {
      console.log(`Servidor rodando na porta ${PORT}`);
    });
  })
  .catch((error) => {
    console.error('Erro ao sincronizar banco:', error);
  });
