const express = require('express');
const app = express();
require('dotenv').config();

const categoryRoutes = require('./routes/categoryRoutes');
const userRoutes = require('./routes/userRoutes');
const productRoutes = require('./routes/productRoutes'); // ✅ aqui

app.use(express.json());

app.use('/v1', categoryRoutes);
app.use('/v1', userRoutes);
app.use('/v1', productRoutes); // ✅ aqui também

module.exports = app;
