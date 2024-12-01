// configs/database.js

const mongoose = require('mongoose');

// MongoDB bağlantısı
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('MongoDB bağlantısı başarılı');
  } catch (err) {
    console.error('MongoDB bağlantısı başarısız', err);
    process.exit(1);  // Bağlantı hatası durumunda uygulamayı sonlandır
  }
};

module.exports = connectDB;
