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
  currency: {
    type: String,
    default: 'TRY',
  },
  imageUrl: {
    type: String,
    default: 'https://picsum.photos/536/354',
  },
  sizes: {
    type: String,
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
      productId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
        required: true
      },
      quantity: {
        type: Number,
        default: 1, // Her modül için farklı quantity
      },
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
