// routes/productRoutes.js

const express = require('express');
const {
  getAllProducts,
  createProduct,
  deleteProduct,
} = require('../controllers/productController');

const router = express.Router();

// Tüm ürünleri listeleme
router.get('/', getAllProducts);

// Yeni ürün ekleme
router.post('/', createProduct);

// Ürün silme
router.delete('/:id', deleteProduct);

module.exports = router;
