// app.js

const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./configs/database');  // Veritabanı bağlantısını içe aktar
const routes = require('./routes');   
const cookieParser = require('cookie-parser');

// env file yükleyin
dotenv.config();

// Express uygulaması başlat
const app = express();

// MongoDB bağlantısını yap
connectDB();

// JSON verilerini işlemek için middleware
app.use(express.json());

app.use(cookieParser());


// Eğer belirli bir frontend domainine izin vermek istiyorsanız:
const allowedOrigins = [
  'http://localhost:3001', // Lokal geliştirme için
  'http://umit-mobilya-client.s3-website-us-east-1.amazonaws.com', // Deploy edilen Vue uygulaması için (IP'n)
  // Eğer ileride domain alırsan mesela:
  // 'https://www.seninwebsiten.com'
];

app.use(cors({
  origin: function(origin, callback) {
    // Eğer istek Postman gibi origin'siz geliyorsa da izin verelim
    if (!origin) return callback(null, true);

    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    } else {
      return callback(new Error('CORS policy: This origin is not allowed.'));
    }
  },
  credentials: true,
}));


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
