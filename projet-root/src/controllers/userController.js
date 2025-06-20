const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken'); // npm install jsonwebtoken

// Gera token JWT (login)
exports.generateToken = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email e senha são obrigatórios' });
    }

    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(400).json({ message: 'Email ou senha inválidos' });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(400).json({ message: 'Email ou senha inválidos' });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '1d' }
    );

    return res.status(200).json({ token });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Erro interno' });
  }
};

// Buscar usuário por id
exports.getUserById = async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id, {
      attributes: ['id', 'firstname', 'surname', 'email']
    });

    if (!user) return res.status(404).json({ message: 'Usuário não encontrado' });

    res.status(200).json(user);
  } catch (error) {
    res.status(500).json({ message: 'Erro interno' });
  }
};

// Criar usuário (sem hash manual aqui)
exports.createUser = async (req, res) => {
  try {
    const { firstname, surname, email, password, confirmPassword } = req.body;

    if (!firstname || !surname || !email || !password || !confirmPassword)
      return res.status(400).json({ message: 'Dados incompletos' });

    if (password !== confirmPassword)
      return res.status(400).json({ message: 'Senhas não conferem' });

    const existingUser = await User.findOne({ where: { email } });
    if (existingUser)
      return res.status(400).json({ message: 'Email já cadastrado' });

    // Aqui só envia a senha pura, o hook do model fará o hash automaticamente
    await User.create({ firstname, surname, email, password });

    res.status(201).json({ message: 'Usuário criado com sucesso' });
  } catch (error) {
    res.status(500).json({ message: 'Erro interno' });
  }
};

// Atualizar usuário
exports.updateUser = async (req, res) => {
  try {
    const { firstname, surname, email } = req.body;
    const { id } = req.params;

    if (!firstname || !surname || !email)
      return res.status(400).json({ message: 'Dados incompletos' });

    const user = await User.findByPk(id);
    if (!user) return res.status(404).json({ message: 'Usuário não encontrado' });

    await user.update({ firstname, surname, email });

    res.status(204).send();
  } catch (error) {
    res.status(500).json({ message: 'Erro interno' });
  }
};

// Deletar usuário
exports.deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await User.findByPk(id);
    if (!user) return res.status(404).json({ message: 'Usuário não encontrado' });

    await user.destroy();

    res.status(204).send();
  } catch (error) {
    res.status(500).json({ message: 'Erro interno' });
  }
};
