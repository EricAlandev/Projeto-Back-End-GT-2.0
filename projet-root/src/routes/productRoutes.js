const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');
const authMiddleware = require('../middleware/auth');

// CRUD de produtos
router.get('/product/search', productController.searchProducts);
router.get('/product/:id', productController.getProductById);
router.post('/product', authMiddleware, productController.createProduct);
router.put('/product/:id', authMiddleware, productController.updateProduct);
router.delete('/product/:id', authMiddleware, productController.deleteProduct);

module.exports = router;
