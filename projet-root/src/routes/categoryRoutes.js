const express = require('express');
const router = express.Router();
const categoryController = require('../controllers/categoryController');
const authMiddleware = require('../middleware/auth');

router.get('/category/search', categoryController.searchCategories);
router.get('/category/:id', categoryController.getCategoryById);
router.post('/category', authMiddleware, categoryController.createCategory);
router.put('/category/:id', authMiddleware, categoryController.updateCategory);
router.delete('/category/:id', authMiddleware, categoryController.deleteCategory);

module.exports = router;
