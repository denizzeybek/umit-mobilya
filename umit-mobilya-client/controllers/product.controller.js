// controllers/productController.js

const Product = require('../models/product.model');

const getProducts = async () => {
  try {
    const products = await Product.find().populate('modules.productId');
    const newProduct = products.map((product) => {
      return {
        _id: product._id,
        name: product.name,
        price: product.price,
        currency: product.currency,
        imageUrl: product.imageUrl,
        sizes: product.sizes,
        description: product.description,
        category: product.category,
        quantity: product.quantity,
        modules: product.modules.map((module) => {
          return {
            _id: module.productId._id,
            name: module.productId.name,
            price: module.productId.price,
            currency: module.productId.currency,
            imageUrl: module.productId.imageUrl,
            quantity: module.quantity,
            sizes: module.productId.sizes,
            description: module.productId.description,
            category: module.productId.category,
          };
        }),
      };
    });
    return newProduct;
  } catch (error) {}
};

// Tüm ürünleri listeleme
exports.getAllProducts = async (req, res) => {
  try {
    const products = await getProducts();
    res.status(201).json(products);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Yeni ürün ekleme
exports.createProduct = async (req, res) => {
  const {
    name,
    price,
    currency,
    sizes,
    description,
    imageUrl,
    quantity,
    category,
    modules,
  } = req.body;

  const product = new Product({
    name,
    price,
    currency,
    sizes,
    description,
    imageUrl,
    category,
    quantity,
    modules,
  });

  try {
    const newProduct = await product.save();
    res.status(201).json(newProduct);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Ürün silme
exports.deleteProduct = async (req, res) => {
  try {
    const allProducts = await getProducts();

    // Tüm ürünleri kontrol etme
    for (const product of allProducts) {
      for (const prd of product.modules || []) {
        if (prd._id.toString() === req.params.id) {
          return res.status(500).json({
            message: `Bu ürün ${product.name} içerisinde kullanıldığı için silinemez`,
          });
        }
      }
    }

    // Ürünü bulma
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: 'Ürün bulunamadı' });
    }

    // Burada silme işlemini gerçekleştirebilirsiniz
    await product.remove(); // veya product.deleteOne() kullanabilirsiniz.

    res.json({ message: 'Ürün silindi' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
