// routes/productRoutes.js

const express = require('express');
const {
  getCategories,
  filterCategories,
  createCategory,
  updateCategory,
  deleteCategory,
} = require('../controllers/category.controller');
const { requireAuth } = require('../middleware/auth.middleware');

const router = express.Router();

// Tüm ürünleri listeleme
router.get('/', requireAuth, getCategories);

// Ürünleri adıyla filtreleme
router.get('/filter', requireAuth, filterCategories);

// Yeni ürün ekleme
router.post('/', requireAuth, createCategory);

// Ürün güncelleme
router.put('/:id', requireAuth, updateCategory);

// Ürün silme
router.delete('/:id', requireAuth, deleteCategory);

module.exports = router;
