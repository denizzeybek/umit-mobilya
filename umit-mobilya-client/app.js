// app.js

const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const productRoutes = require('./routes/product.route');

// Çevre değişkenlerini yükle
dotenv.config();

// Uygulama başlatma
const app = express();
const port = process.env.PORT || 3000;

// JSON verisini almak için middleware
app.use(express.json());

// MongoDB bağlantısı
d

// Ürün API'leri
app.use('/api/products', productRoutes);

// Ana dizine hoş geldiniz mesajı
app.get('/', (req, res) => {
  res.send('Hoş geldiniz! Express + MongoDB API çalışıyor!');
});

// Sunucu başlatma
app.listen(port, () => {
  console.log(`Sunucu ${port} portunda çalışıyor`);
});
