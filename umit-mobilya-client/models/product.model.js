const mongoose = require('mongoose');

// Ürün şeması
const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  price: {
    type: Number,
    required: true,
  },
  description: {
    type: String,
  },
  category: {
    type: String,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Ürün modelini oluşturma
const Product = mongoose.model('Product', productSchema);

module.exports = Product;
