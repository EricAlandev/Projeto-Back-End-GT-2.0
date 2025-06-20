const { Op } = require('sequelize'); // ADICIONADO para usar operadores como LIKE
const Category = require('../models/Category');

exports.searchCategories = async (req, res) => {
  try {
    const limitRaw = req.query.limit ?? '12';
    const pageRaw = req.query.page ?? '1';
    const fieldsRaw = req.query.fields ?? 'name,slug';
    const useInMenuRaw = req.query.use_in_menu;
    const { name, slug } = req.query; // NOVO

    const limit = Number(limitRaw);
    const page = Number(pageRaw);

    if (isNaN(limit) || isNaN(page)) {
      return res.status(400).json({ message: 'Parâmetros limit e page devem ser números' });
    }

    const fields = fieldsRaw.split(',').map(f => f.trim());
    if (!fields.includes('id')) fields.push('id');

    const where = {};

    // Filtro por use_in_menu
    if (useInMenuRaw !== undefined) {
      if (useInMenuRaw === 'true') where.use_in_menu = true;
      else if (useInMenuRaw === 'false') where.use_in_menu = false;
      else return res.status(400).json({ message: 'use_in_menu deve ser true ou false' });
    }

    // NOVOS filtros por name e slug
    if (name) {
      where.name = { [Op.like]: `%${name}%` };
    }

    if (slug) {
      where.slug = { [Op.like]: `%${slug}%` };
    }

    const findOptions = {
      attributes: fields,
      where,
      order: [['id', 'ASC']],
    };

    if (limit !== -1) {
      findOptions.limit = limit;
      findOptions.offset = (page - 1) * limit;
    }

    const { count, rows } = await Category.findAndCountAll(findOptions);

    res.status(200).json({
      data: rows,
      total: count,
      limit,
      page: limit === -1 ? 1 : page,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erro interno' });
  }
};

exports.getCategoryById = async (req, res) => {
  try {
    const category = await Category.findByPk(req.params.id);
    if (!category) return res.status(404).json({ message: 'Categoria não encontrada' });

    res.status(200).json(category);
  } catch (error) {
    res.status(500).json({ message: 'Erro interno' });
  }
};

exports.createCategory = async (req, res) => {
  try {
    const { name, slug, use_in_menu } = req.body;
    if (!name || !slug || use_in_menu === undefined) {
      return res.status(400).json({ message: 'Dados incompletos' });
    }

    const exists = await Category.findOne({ where: { slug } });
    if (exists) {
      return res.status(400).json({ message: 'Slug já cadastrado' });
    }

    await Category.create({ name, slug, use_in_menu });

    res.status(201).json({ message: 'Categoria criada com sucesso' });
  } catch (error) {
    res.status(500).json({ message: 'Erro interno' });
  }
};

exports.updateCategory = async (req, res) => {
  try {
    const { name, slug, use_in_menu } = req.body;
    const { id } = req.params;

    if (!name || !slug || use_in_menu === undefined) {
      return res.status(400).json({ message: 'Dados incompletos' });
    }

    const category = await Category.findByPk(id);
    if (!category) return res.status(404).json({ message: 'Categoria não encontrada' });

    await category.update({ name, slug, use_in_menu });

    res.status(204).send();
  } catch (error) {
    res.status(500).json({ message: 'Erro interno' });
  }
};

exports.deleteCategory = async (req, res) => {
  try {
    const { id } = req.params;

    const category = await Category.findByPk(id);
    if (!category) return res.status(404).json({ message: 'Categoria não encontrada' });

    await category.destroy();

    res.status(204).send();
  } catch (error) {
    res.status(500).json({ message: 'Erro interno' });
  }
};
