// app.js

const express = require('express');
const dotenv = require('dotenv');
const connectDB = require('./configs/database');  // Veritabanı bağlantısını içe aktar
const routes = require('./routes');   

// Çevresel değişkenleri yükleyin
dotenv.config();

// Express uygulaması başlat
const app = express();

// MongoDB bağlantısını yap
connectDB();

// JSON verilerini işlemek için middleware
app.use(express.json());


// API'ler ve diğer middleware'ler burada tanımlanabilir
app.use(routes);

// Ana dizine hoş geldiniz mesajı
app.get('/', (req, res) => {
  res.send('Hoş geldiniz! Express + MongoDB API çalışıyor!');
});


// Sunucuyu başlat
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Sunucu ${PORT} portunda çalışıyor`);
});
