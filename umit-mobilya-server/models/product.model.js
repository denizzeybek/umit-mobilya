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
  },
  imageName: {
    type: String,
  },
  sizes: {
    type: String,
    required: true,
  },

  description: {
    type: String,
  },
  imageNameList: [
    {
      type: String, // Just the names of images
    },
  ],
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category', // Referencing the Category model
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
        required: true,
      },
      quantity: {
        type: Number,
        default: 1,
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
