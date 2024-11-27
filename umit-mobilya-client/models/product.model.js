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
  quantity: {
    type: Number,
    default: 1,
  },
  modules: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product', // 'Product' modeline referans
      default: [],
    },
  ],
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Ürün modelini oluşturma
const Product = mongoose.model('Product', productSchema);

module.exports = Product;
