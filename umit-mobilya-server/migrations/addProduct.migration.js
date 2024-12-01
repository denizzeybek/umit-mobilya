const mongoose = require('mongoose');
const Product = require('../models/product.model'); // Modelinizi import edin

// Bağlantıyı yapılandırın
const mongoURI = process.env.MONGO_URI; // MongoDB URI
mongoose.connect(mongoURI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('Connected to MongoDB'))
  .catch((err) => console.error('MongoDB connection error:', err));

// Migration verileri
const productsData = [
  {
    name: 'Product 1',
    price: 100,
    currency: 'TRY',
    sizes: 'M',
    description: 'Description of product 1',
    category: 'Category A',
    quantity: 50,
    modules: [
      { productId: '648b3f8e4d0b34a4a9bdbb35', quantity: 2 }, // Örnek ürün ID'lerini değiştirin
    ],
  },
  {
    name: 'Product 2',
    price: 200,
    currency: 'USD',
    sizes: 'L',
    description: 'Description of product 2',
    category: 'Category B',
    quantity: 30,
  },
  // Diğer ürünleri buraya ekleyin...
];

// Migration işlemi
const migrate = async () => {
  try {
    await Product.insertMany(productsData);
    console.log('Migration completed successfully.');
  } catch (err) {
    console.error('Error during migration:', err);
  } finally {
    mongoose.disconnect();
  }
};

migrate();
