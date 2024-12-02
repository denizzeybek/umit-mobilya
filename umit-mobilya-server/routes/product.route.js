// routes/productRoutes.js

const express = require('express');
const {
  getAllProducts,
  getProductById,
  createProduct,
  deleteProduct,
  filterProducts,
  addModule,
  removeModule,
  updateProduct,
  updateProductModules,
} = require('../controllers/product.controller');
const { requireAuth } = require('../middleware/auth.middleware');

const router = express.Router();

// Tüm ürünleri listeleme
router.get('/', getAllProducts);

// ürün detayı
router.get('/:id', getProductById);

// Ürünleri adıyla filtreleme
router.get('/filter', filterProducts);

// Yeni ürün ekleme
router.post('/', requireAuth, createProduct);

// Ürün güncelleme
router.put('/:id', requireAuth, updateProduct);

// Ürün module quantity güncelleme
router.put('/update-modules/:id', requireAuth, updateProductModules);

// Ürün silme
router.delete('/:id', requireAuth, deleteProduct);

// module ekleme
router.post('/add-module', requireAuth, addModule);

// module silme
router.delete('/remove-module/:productId/:moduleId', requireAuth, removeModule);

module.exports = router;
