// routes/productRoutes.js

const express = require('express');
const multer = require('multer');

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
  uploadMultipleImages,
  deleteImage,
} = require('../controllers/product.controller');
const { requireAuth } = require('../middleware/auth.middleware');

const router = express.Router();

// Tüm ürünleri listeleme
router.get('/', getAllProducts);

// ürün detayı
router.get('/:id', getProductById);

// Ürünleri adıyla filtreleme
router.post('/filter', filterProducts);

// Yeni ürün ekleme
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });
router.post('/', requireAuth, upload.single('image'), createProduct);

// Ürün image list ekleme
// router.put('/create-images/:id', requireAuth, upload.single('images'),  uploadMultipleImages);
router.put('/create-images/:id', requireAuth, upload.array('image', 20),  uploadMultipleImages);

// Ürün güncelleme
router.put('/:id', requireAuth, updateProduct);

// Ürün module quantity güncelleme
router.put('/update-modules/:id', requireAuth, updateProductModules);

// Ürün silme
router.delete('/:id', requireAuth, deleteProduct);

// delete image from s3
router.post('/delete-image/:id', requireAuth, deleteImage);

// module ekleme
router.post('/add-module', requireAuth, addModule);

// module silme
router.delete('/remove-module/:productId/:moduleId', requireAuth, removeModule);

module.exports = router;
