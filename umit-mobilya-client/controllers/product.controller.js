// controllers/productController.js

const Product = require('../models/product.model');

const getProducts = async (payload) => {
  try {
    // Create a query object
    const { id, name, category, dynamicQuery } = payload || {};
    const query = {};

    // Build the query object
    if (id) {
      query._id = id; // Find product by exact ID
    }

    if (name) {
      query.name = new RegExp(name, 'i');
    }
    if (category) {
      query.category = new RegExp(category, 'i');
    }

    if (dynamicQuery) {
      query.$or = [
        { name: new RegExp(dynamicQuery, 'i') }, // Case-insensitive search for 'name'
        { category: new RegExp(dynamicQuery, 'i') }, // Case-insensitive search for 'category'
      ];
    }

    const products = await Product.find(query).populate('modules.productId');
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

exports.getProductById = async (req, res) => {
  try {
    const id = req.params.id;
    const product = await getProducts({ id });
    if (product?.length) {
      res.status(201).json(product[0]);
    } else {
      res.status(404).json({ message: 'Ürün bulunamadı' });
    }
  } catch (error) {
    console.error('Error fetching product(s):', error);
    throw new Error('Failed to fetch product(s). Please try again.');
  }
};

// API endpoint to get filtered products by name
exports.filterProducts = async (req, res) => {
  try {
    // Get the 'name' query parameter from the request
    const { name, category, dynamicQuery } = req.body;

    // Call getProducts with the name filter
    const products = await getProducts({ name, category, dynamicQuery });

    res.status(200).json(products);
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
    await Product.findByIdAndDelete(req.params.id);

    res.json({ message: 'Ürün silindi' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
