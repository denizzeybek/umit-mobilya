// controllers/productController.js
const mongoose = require('mongoose');
const Product = require('../models/product.model');
const crypto = require('crypto');
const sharp = require('sharp');
const dotenv = require('dotenv');

const {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
} = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');

dotenv.config(); // En üstte olmalı!

const getProducts = async (payload) => {
  try {
    // Build query object from payload
    const { id, name, category } = payload || {};
    const query = {
      ...(id && { _id: id }),
      ...(name && { name: new RegExp(name, 'i') }),
      ...(category && { category }),
    };

    // Fetch products with necessary population
    const products = await Product.find(query)
      .populate({
        path: 'modules.productId',
        populate: { path: 'category' },
      })
      .populate('category');

    // Helper function to generate signed URLs
    const generateImageUrl = async (key) => {
      if (!key) return null;
      const params = { Bucket: process.env.BUCKET_NAME, Key: key };
      const command = new GetObjectCommand(params);
      return await getSignedUrl(s3, command, { expiresIn: 3600 });
    };

    // Process products and modules
    const result = await Promise.all(
      products.map(async (product) => {
        const imageUrl = await generateImageUrl(product.imageName);
        const imageListUrls = await Promise.all(
          product.imageNameList.map(async (imageName) => {
            return await generateImageUrl(imageName); // await the async function
          })
        );

        const modules = await Promise.all(
          product.modules.map(async (module) => {
            const moduleImageUrl = await generateImageUrl(
              module.productId?.imageName,
            );

            return {
              _id: module.productId?._id,
              name: module.productId?.name,
              price: module.productId?.price,
              currency: module.productId?.currency,
              imageUrl: moduleImageUrl,
              quantity: module.quantity,
              sizes: module.productId?.sizes,
              description: module.productId?.description,
              category: module.productId?.category,
            };
          }),
        );

        // Calculate total price
        const moduleTotalPrice = modules.reduce(
          (sum, module) => sum + (module.price || 0) * (module.quantity || 1),
          0,
        );
        const totalPrice = (product.price || 0) + moduleTotalPrice;

        return {
          _id: product._id,
          name: product.name,
          price: product.price,
          currency: product.currency,
          imageUrl,
          imageListUrls,
          sizes: product.sizes,
          description: product.description,
          category: product.category,
          quantity: product.quantity,
          modules,
          totalPrice,
          imageNameList: product.imageNameList,
        };
      }),
    );

    return result;
  } catch (error) {
    console.error('Error in getProducts:', error);
    throw new Error('Failed to fetch products');
  }
};

// Tüm ürünleri listeleme
exports.getAllProducts = async (req, res) => {
  try {
    const products = await getProducts();
    res.status(201).json(products);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getProductById = async (req, res) => {
  try {
    const id = req.params.id;
    const product = await getProducts({ id });
    if (product?.length) {
      res.status(201).json(product[0]);
    } else {
      res.status(404).json({ message: 'Ürün bulunamadı' });
    }
  } catch (error) {
    console.error('Error fetching product(s):', error);
    throw new Error('Failed to fetch product(s). Please try again.');
  }
};

// API endpoint to get filtered products by name
exports.filterProducts = async (req, res) => {
  try {
    // Get the 'name' query parameter from the request
    const { name, category } = req.body;

    // Call getProducts with the name filter
    const products = await getProducts({ name: name, category: category });

    res.status(200).json(products);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const randomImageName = (bytes = 32) => {
  return crypto.randomBytes(bytes).toString('hex');
};

// Yeni ürün ekleme
const bucketName = process.env.BUCKET_NAME;
const bucketRegion = process.env.BUCKET_REGION;
const accessKey = process.env.ACCESS_KEY;
const secretAccessKey = process.env.SECRET_ACCESS_KEY;

const s3 = new S3Client({
  credentials: {
    accessKeyId: accessKey,
    secretAccessKey: secretAccessKey,
  },
  region: bucketRegion,
});

exports.createProduct = async (req, res) => {
  try {
    const buffer = await sharp(req.file.buffer)
      .resize({ height: 600, width: 900, fit: 'inside' })
      .toBuffer();

    const imageName = randomImageName();

    const command = new PutObjectCommand({
      Bucket: bucketName,
      Key: imageName,
      Body: buffer,
      ContentType: req.file.mimetype,
    });

    await s3.send(command);

    const {
      name,
      price,
      currency,
      sizes,
      description,
      quantity,
      category,
      modules,
    } = req.body;

    // Validate category existence
    const categoryExists = await mongoose.model('Category').findById(category);
    if (!categoryExists) {
      return res.status(404).json({ message: 'Category not found' });
    }

    const product = new Product({
      name,
      price: Number(price),
      currency,
      sizes,
      description,
      imageName,
      category,
      quantity,
      modules,
      imageNameList: [],
    });
    const newProduct = await product.save();
    res.status(201).json(newProduct);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.uploadMultipleImages = async (req, res) => {
  try {
    const { id } = req.params;
    const product = await Product.findById(id);

    if (!product) {
      return res.status(400).json({ message: 'Ürün bulunamadı' });
    }
    // Ensure files are uploaded
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ message: 'No files uploaded' });
    }

    // Process and upload each file
    const imageUploadPromises = req.files.map(async (file) => {
      console.log('file ', file);
      // Resize and format image
      const buffer = await sharp(file.buffer)
        .resize({ height: 600, width: 900, fit: 'inside' })
        .toBuffer()
        .catch((error) => {
          console.error('Error processing image with sharp:', error);
          throw error;
        });

      const imageName = randomImageName();

      // Upload image to S3
      const command = new PutObjectCommand({
        Bucket: bucketName,
        Key: imageName,
        Body: buffer,
        ContentType: file.mimetype,
      });

      await s3.send(command);

      return imageName; // Return uploaded image name
    });

    // Wait for all images to be uploaded
    const newImageNames = await Promise.all(imageUploadPromises);

    // Update the product's imageNameList
    if (!Array.isArray(product.imageNameList)) {
      product.imageNameList = []; // Initialize as an empty array
    }
    product.imageNameList = [...product.imageNameList, ...newImageNames];
    await product.save();

    res.status(200).json({
      message: 'Product images updated successfully',
      imageNameList: product.imageNameList,
    });
  } catch (error) {
    console.error('Error updating product images:', error);
    res.status(500).json({
      message: 'Failed to update product images',
      error: error.message,
    });
  }
};

// Ürün güncelleme
exports.updateProduct = async (req, res) => {
  const { id } = req.params; // Get product ID from the route parameter
  const {
    name,
    price,
    currency,
    sizes,
    description,
    imageUrl,
    quantity,
    category,
  } = req.body;

  try {
    // Find the product by ID
    const product = await Product.findById(id);
    if (!product) {
      return res.status(404).json({ message: 'Ürün bulunamadı' });
    }

    // Update the product fields
    product.name = name ?? product.name;
    product.price = price ?? product.price;
    product.currency = currency ?? product.currency;
    product.sizes = sizes ?? product.sizes;
    product.description = description ?? product.description;
    product.imageUrl = imageUrl ?? product.imageUrl;
    product.quantity = quantity ?? product.quantity;
    product.category = category ?? product.category;
    // product.modules = modules ?? product.modules;

    // Save the updated product
    const updatedProduct = await product.save();

    res.status(200).json(updatedProduct);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Ürün modüllerini topluca güncelleme
exports.updateProductModules = async (req, res) => {
  const { id } = req.params; // Ürün ID'sini al
  const { modules } = req.body; // Yeni modüller dizisini al

  try {
    // Ürünü ID ile bul
    const product = await Product.findById(id);
    if (!product) {
      return res.status(404).json({ message: 'Ürün bulunamadı' });
    }

    // Yeni modülleri doğrula (örneğin, her modülde productId ve quantity olmalı)
    if (
      !Array.isArray(modules) ||
      modules.some(
        (module) =>
          !module.productId ||
          !mongoose.Types.ObjectId.isValid(module.productId) ||
          module.quantity == null,
      )
    ) {
      return res.status(400).json({ message: 'Geçersiz modül listesi' });
    }

    // Ürünün modüllerini güncelle
    product.modules = modules.map((module) => ({
      productId: module.productId,
      quantity: module.quantity,
    }));

    // Güncellenmiş ürünü kaydet
    const updatedProduct = await product.save();

    res.status(200).json({
      message: 'Tüm modüller başarıyla güncellendi',
      product: updatedProduct,
    });
  } catch (error) {
    console.error('Modüller topluca güncelleme hatası:', error);
    res
      .status(500)
      .json({ message: 'Modüller güncellenirken bir hata oluştu' });
  }
};

// Ürün silme
exports.deleteProduct = async (req, res) => {
  try {
    const allProducts = await getProducts();

    // Tüm ürünleri kontrol etme
    for (const product of allProducts) {
      for (const prd of product.modules || []) {
        if (prd._id.toString() === req.params.id) {
          return res.status(500).json({
            message: `Bu ürün ${product.name} içerisinde kullanıldığı için silinemez`,
          });
        }
      }
    }

    // Ürünü bulma
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: 'Ürün bulunamadı' });
    }

    // Burada silme işlemini gerçekleştirebilirsiniz
    await Product.findByIdAndDelete(req.params.id);

    res.json({ message: 'Ürün silindi' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.addModule = async (req, res) => {
  try {
    const { productId, module } = req.body; // Gelen modül: { productId, quantity }

    if (productId.toString() === module.productId) {
      return res.status(400).json({ message: 'Aynı ürünü ekleyemezsiniz' });
    }

    // Ürünü bul
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ message: 'Ürün bulunamadı' });
    }

    // Modül zaten var mı kontrol et
    const existingModule = product.modules.find(
      (m) => m.productId.toString() === module.productId,
    );
    if (existingModule) {
      return res.status(404).json({ message: 'Bu modül zaten eklenmiş' });
    }

    // Yeni modülü ekle
    product.modules.push(module);

    // Güncellenmiş ürünü kaydet
    await product.save();

    res.status(200).json({ message: 'Modül başarıyla eklendi', product });
  } catch (error) {
    console.error('Modül ekleme hatası:', error);
    res.status(500).json({ message: 'Modül eklenirken bir hata oluştu' });
  }
};

exports.removeModule = async (req, res) => {
  try {
    // Ürün ve modül ID'leri
    const { productId, moduleId } = req.params;

    // Ürünü bul
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ message: 'Ürün bulunamadı' });
    }

    // Modülü ürünün modules dizisinden çıkar
    const initialModuleCount = product.modules.length;
    product.modules = product.modules.filter(
      (m) => m.productId.toString() !== moduleId,
    );

    // Eğer modül bulunamadıysa hata döndür
    if (product.modules.length === initialModuleCount) {
      return res.status(404).json({
        message: 'Bu modül ürün içinde bulunamadı veya zaten kaldırılmış',
      });
    }

    // Güncellenmiş ürünü kaydet
    await product.save();

    res.status(200).json({ message: 'Modül başarıyla kaldırıldı', product });
  } catch (error) {
    console.error('Modül kaldırma hatası:', error);
    res.status(500).json({ message: 'Modül kaldırılırken bir hata oluştu' });
  }
};
