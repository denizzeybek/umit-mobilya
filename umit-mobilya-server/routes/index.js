// routes/index.js
const express = require('express');
const router = express.Router();
const productRoutes = require('./product.route');  // Ürün API rotalarını içe aktar

// Ürün API'lerini yönlendir
router.use('/api/products', productRoutes);

module.exports = router;
