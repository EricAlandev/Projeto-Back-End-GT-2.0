const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const authMiddleware = require('../middleware/auth'); // vamos supor que você tem um middleware para proteger rotas

// Geração do token JWT (login)
router.post('/user/token', userController.generateToken);

// CRUD usuário
router.get('/user/:id', userController.getUserById);
router.post('/user', userController.createUser);
router.put('/user/:id', authMiddleware, userController.updateUser);
router.delete('/user/:id', authMiddleware, userController.deleteUser);

module.exports = router;
