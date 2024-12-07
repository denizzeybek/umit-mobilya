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
router.get('/', getCategories);

// Ürünleri adıyla filtreleme
router.get('/filter', filterCategories);

// Yeni ürün ekleme
router.post('/', requireAuth, createCategory);

// Ürün güncelleme
router.put('/:id', requireAuth, updateCategory);

// Ürün silme
router.delete('/:id', requireAuth, deleteCategory);

module.exports = router;
