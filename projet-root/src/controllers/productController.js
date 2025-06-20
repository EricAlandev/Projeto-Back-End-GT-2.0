const { Op } = require('sequelize');
const { Product, ProductImage, ProductOption, Category, ProductCategory } = require('../models');
const fs = require('fs');
const path = require('path');

const IMAGE_UPLOAD_PATH = path.resolve(__dirname, '../../uploads');

async function saveBase64Image(base64String, filename) {
  if (!fs.existsSync(IMAGE_UPLOAD_PATH)) {
    fs.mkdirSync(IMAGE_UPLOAD_PATH, { recursive: true });
  }

  const matches = base64String.match(/^data:(.+);base64,(.+)$/);
  if (!matches) throw new Error('Imagem base64 inválida');

  const ext = matches[1].split('/')[1];
  const buffer = Buffer.from(matches[2], 'base64');
  const filePath = path.join(IMAGE_UPLOAD_PATH, `${filename}.${ext}`);

  await fs.promises.writeFile(filePath, buffer);

  return `uploads/${filename}.${ext}`;
}

exports.searchProducts = async (req, res) => {
  try {
    const {
      limit: limitRaw = '12',
      page: pageRaw = '1',
      fields: fieldsRaw = 'id,name,slug,price,price_with_discount,enabled,use_in_menu,stock,description',
      match,
      category_ids,
      price_range,
      ...restFilters
    } = req.query;

    const limit = Number(limitRaw);
    const page = Number(pageRaw);

    if (isNaN(limit) || isNaN(page) || limit < -1 || page < 1) {
      return res.status(400).json({ message: 'Parâmetros limit e page inválidos' });
    }

    // Campos a retornar
    const fields = fieldsRaw.split(',').map(f => f.trim());
    if (!fields.includes('id')) fields.push('id');

    // Construindo filtro WHERE
    const where = {};

    // Filtro de busca por match no nome (LIKE)
    if (match) {
      where.name = { [Op.like]: `%${match}%` };
    }

    // Filtro price_range: formato esperado "min-max" exemplo: "50-150"
    if (price_range) {
      const [minStr, maxStr] = price_range.split('-');
      const min = parseFloat(minStr);
      const max = parseFloat(maxStr);
      if (!isNaN(min) && !isNaN(max)) {
        where.price = { [Op.between]: [min, max] };
      }
    }

    // Filtro por categorias (category_ids), separados por vírgula
    let include = [
      { model: ProductImage, where: { enabled: true }, required: false },
      { model: ProductOption },
      { model: Category, through: { attributes: [] } },
    ];

    if (category_ids) {
      const ids = category_ids.split(',').map(id => Number(id)).filter(id => !isNaN(id));
      if (ids.length > 0) {
        include = [
          ...include.filter(i => i.model !== Category),
          {
            model: Category,
            where: { id: ids },
            through: { attributes: [] },
            required: true,
          },
          { model: ProductImage, where: { enabled: true }, required: false },
          { model: ProductOption },
        ];
      }
    }

    // Filtros por opções dinâmicas (opção "option[...]") como option[shape]=circle, option[type]=text, etc
    const optionFilters = Object.entries(restFilters)
      .filter(([key]) => key.startsWith('option[') && key.endsWith(']'))
      .map(([key, value]) => {
        const field = key.slice(7, -1);
        return { [field]: value };
      });

    if (optionFilters.length > 0) {
      include.push({
        model: ProductOption,
        where: {
          [Op.and]: optionFilters
        },
        required: true,
      });
    }

    // Opção para quando limit = -1 (retorna todos)
    const findOptions = {
      attributes: fields,
      where,
      include,
      order: [['id', 'ASC']],
    };

    if (limit !== -1) {
      findOptions.limit = limit;
      findOptions.offset = (page - 1) * limit;
    }

    const { count, rows } = await Product.findAndCountAll(findOptions);

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

exports.getProductById = async (req, res) => {
  try {
    const product = await Product.findByPk(req.params.id, {
      include: [
        { model: ProductImage, where: { enabled: true }, required: false },
        { model: ProductOption },
        { model: Category, through: { attributes: [] } },
      ],
    });

    if (!product) {
      return res.status(404).json({ message: 'Produto não encontrado' });
    }

    res.status(200).json(product);
  } catch (error) {
    console.error('Erro ao buscar produto:', error);
    res.status(500).json({ message: 'Erro interno' });
  }
};

exports.createProduct = async (req, res) => {
  try {
    const {
      name,
      slug,
      price,
      price_with_discount,
      enabled = false,
      use_in_menu = false,
      stock = 0,
      description = '',
      images = [],
      options = [],
      categories = [],
    } = req.body;

    if (!name || !slug || !price || !price_with_discount) {
      return res.status(400).json({ message: 'Dados obrigatórios faltando' });
    }

    const product = await Product.create({
      name,
      slug,
      price,
      price_with_discount,
      enabled,
      use_in_menu,
      stock,
      description,
    });

    if (categories.length > 0 && typeof product.setCategories === 'function') {
      await product.setCategories(categories);
    }

    for (let i = 0; i < images.length; i++) {
      const imagePath = await saveBase64Image(images[i].base64, `product_${product.id}_${i}`);
      await ProductImage.create({
        product_id: product.id,
        enabled: true,
        path: imagePath,
      });
    }

    for (const opt of options) {
      await ProductOption.create({
        product_id: product.id,
        title: opt.title,
        shape: opt.shape || 'square',
        radius: opt.radius || 0,
        type: opt.type || 'text',
        values: Array.isArray(opt.values) ? opt.values.join(',') : opt.values,
      });
    }

    res.status(201).json({ message: 'Produto criado com sucesso', product });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erro interno' });
  }
};

exports.updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      name,
      slug,
      price,
      price_with_discount,
      enabled,
      use_in_menu,
      stock,
      description,
      images = [],
      options = [],
      categories = [],
    } = req.body;

    const product = await Product.findByPk(id);
    if (!product) return res.status(404).json({ message: 'Produto não encontrado' });

    await product.update({
      name,
      slug,
      price,
      price_with_discount,
      enabled,
      use_in_menu,
      stock,
      description,
    });

    if (categories.length > 0 && typeof product.setCategories === 'function') {
      await product.setCategories(categories);
    }

    const oldImages = await ProductImage.findAll({ where: { product_id: id } });
    const imagesToDelete = [];
    const imagesToKeep = [];

    for (const img of images) {
      if (img.id && img.deleted) {
        imagesToDelete.push(img.id);
      } else if (img.id && !img.deleted) {
        imagesToKeep.push(img.id);
      } else if (!img.id && typeof img === 'string') {
        const imagePath = await saveBase64Image(img, `product_${id}_${Date.now()}`);
        await ProductImage.create({
          product_id: id,
          enabled: true,
          path: imagePath,
        });
      }
    }

    if (imagesToDelete.length > 0) {
      await ProductImage.destroy({ where: { id: imagesToDelete } });
    }

    const oldOptions = await ProductOption.findAll({ where: { product_id: id } });
    const optionsToDelete = [];
    const optionsToUpdate = [];
    const optionsToCreate = [];

    for (const opt of options) {
      if (opt.id && opt.deleted) {
        optionsToDelete.push(opt.id);
      } else if (opt.id && !opt.deleted) {
        optionsToUpdate.push(opt);
      } else if (!opt.id) {
        optionsToCreate.push(opt);
      }
    }

    if (optionsToDelete.length > 0) {
      await ProductOption.destroy({ where: { id: optionsToDelete } });
    }

    for (const opt of optionsToUpdate) {
      await ProductOption.update({
        title: opt.title,
        shape: opt.shape || 'square',
        radius: opt.radius || 0,
        type: opt.type || 'text',
        values: Array.isArray(opt.values) ? opt.values.join(',') : opt.values,
      }, { where: { id: opt.id } });
    }

    for (const opt of optionsToCreate) {
      await ProductOption.create({
        product_id: id,
        title: opt.title,
        shape: opt.shape || 'square',
        radius: opt.radius || 0,
        type: opt.type || 'text',
        values: Array.isArray(opt.values) ? opt.values.join(',') : opt.values,
      });
    }

    res.status(204).send();
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erro interno' });
  }
};

exports.deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;

    const product = await Product.findByPk(id);
    if (!product) return res.status(404).json({ message: 'Produto não encontrado' });

    await ProductImage.destroy({ where: { product_id: id } });
    await ProductOption.destroy({ where: { product_id: id } });
    await ProductCategory.destroy({ where: { product_id: id } });

    await product.destroy();

    res.status(204).send();
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erro interno' });
  }
};
