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
      const modules = product.modules.map((module) => {
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
      });

      // Calculate total price: product price + sum of module prices
      const moduleTotalPrice = modules.reduce((sum, module) => {
        return sum + (module.price || 0) * (module.quantity || 1);
      }, 0);

      const totalPrice = (product.price || 0) + moduleTotalPrice;

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
        modules,
        totalPrice, // Add totalPrice field
      };
    });

    return newProduct;
  } catch (error) {
    console.error('Error in getProducts:', error);
    throw new Error('Failed to fetch products');
  }
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

// Ürün güncelleme
exports.updateProduct = async (req, res) => {
  const { id } = req.params; // Get product ID from the route parameter
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

  try {
    // Find the product by ID
    const product = await Product.findById(id);
    if (!product) {
      return res.status(404).json({ message: 'Ürün bulunamadı' });
    }

    // Update the product fields
    product.name = name ?? product.name;
    product.price = price ?? product.price;
    product.currency = currency ?? product.currency;
    product.sizes = sizes ?? product.sizes;
    product.description = description ?? product.description;
    product.imageUrl = imageUrl ?? product.imageUrl;
    product.quantity = quantity ?? product.quantity;
    product.category = category ?? product.category;
    // product.modules = modules ?? product.modules;

    // Save the updated product
    const updatedProduct = await product.save();

    res.status(200).json(updatedProduct);
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

exports.addModule = async (req, res) => {
  try {
    const { productId, module } = req.body; // Gelen modül: { productId, quantity }

    if (productId.toString() === module.productId) {
      return res.status(400).json({ message: 'Aynı ürünü ekleyemezsiniz' });
    }

    // Ürünü bul
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ message: 'Ürün bulunamadı' });
    }

    // Modül zaten var mı kontrol et
    const existingModule = product.modules.find(
      (m) => m.productId.toString() === module.productId,
    );
    if (existingModule) {
      return res.status(404).json({ message: 'Bu modül zaten eklenmiş' });
    }

    // Yeni modülü ekle
    product.modules.push(module);

    // Güncellenmiş ürünü kaydet
    await product.save();

    res.status(200).json({ message: 'Modül başarıyla eklendi', product });
  } catch (error) {
    console.error('Modül ekleme hatası:', error);
    res.status(500).json({ message: 'Modül eklenirken bir hata oluştu' });
  }
};

exports.removeModule = async (req, res) => {
  try {
    // Ürün ve modül ID'leri
    const { productId, moduleId } = req.params;

    // Ürünü bul
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ message: 'Ürün bulunamadı' });
    }

    // Modülü ürünün modules dizisinden çıkar
    const initialModuleCount = product.modules.length;
    product.modules = product.modules.filter(
      (m) => m.productId.toString() !== moduleId,
    );

    // Eğer modül bulunamadıysa hata döndür
    if (product.modules.length === initialModuleCount) {
      return res.status(404).json({
        message: 'Bu modül ürün içinde bulunamadı veya zaten kaldırılmış',
      });
    }

    // Güncellenmiş ürünü kaydet
    await product.save();

    res.status(200).json({ message: 'Modül başarıyla kaldırıldı', product });
  } catch (error) {
    console.error('Modül kaldırma hatası:', error);
    res.status(500).json({ message: 'Modül kaldırılırken bir hata oluştu' });
  }
};
