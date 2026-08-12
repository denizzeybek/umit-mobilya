import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Types } from 'mongoose';
import type { FilterQuery, Model } from 'mongoose';

import { Category } from '../category/schemas/category.schema';
import { ObjectStorageService } from '../storage/object-storage.service';
import type { CreateProductDto } from './dto/create-product.dto';
import type { FilterProductDto } from './dto/filter-product.dto';
import type { UpdateProductDto } from './dto/update-product.dto';
import { Product } from './schemas/product.schema';
import type { ProductDocument } from './schemas/product.schema';

/** A product as the API returns it. Differs from the stored document. */
export interface ProductView {
  _id: Types.ObjectId;
  name: string;
  imageName: string | undefined;
  imageUrl: string | null;
  imageUrlList: (string | null)[];
  imageNameList: string[];
  sizes: string | undefined;
  description: string | undefined;
  category: unknown;
  configuratorPreset: Record<string, unknown> | undefined;
}

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

@Injectable()
export class ProductService {
  constructor(
    @InjectModel(Product.name)
    private readonly productModel: Model<Product>,
    @InjectModel(Category.name)
    private readonly categoryModel: Model<Category>,
    private readonly storage: ObjectStorageService,
  ) {}

  async findAll(filter: FilterProductDto): Promise<ProductView[]> {
    const query: FilterQuery<Product> = {
      ...(filter.name
        ? { name: new RegExp(escapeRegex(filter.name), 'i') }
        : {}),
      ...(filter.category ? { category: filter.category } : {}),
    };

    const products = await this.productModel
      .find(query)
      .populate('category')
      .exec();

    return products.map((product) => this.toView(product));
  }

  async findById(id: string): Promise<ProductView> {
    const product = await this.productModel
      .findById(id)
      .populate('category')
      .exec();

    if (!product) {
      throw new NotFoundException('Ürün bulunamadı');
    }

    return this.toView(product);
  }

  /**
   * The category is checked **before** anything is uploaded. The Express
   * version uploaded first, so every create with a bad category id left an
   * object in the bucket that nothing referenced and nothing would clean up.
   */
  async create(
    dto: CreateProductDto,
    file: Express.Multer.File | undefined,
  ): Promise<ProductDocument> {
    if (!file) {
      throw new BadRequestException('Ürün görseli zorunludur');
    }

    const category = await this.categoryModel.findById(dto.category).exec();
    if (!category) {
      throw new NotFoundException('Category not found');
    }

    const imageName = this.storage.buildKey(file.originalname);
    await this.storage.upload(file.buffer, imageName, file.mimetype);

    return this.productModel.create({
      name: dto.name,
      ...(dto.sizes ? { sizes: dto.sizes } : {}),
      ...(dto.description ? { description: dto.description } : {}),
      category: new Types.ObjectId(dto.category),
      imageName,
      imageNameList: [],
    });
  }

  async update(id: string, dto: UpdateProductDto): Promise<ProductDocument> {
    const product = await this.requireProduct(id);

    if (dto.name !== undefined) product.name = dto.name;
    if (dto.sizes !== undefined) product.sizes = dto.sizes;
    if (dto.description !== undefined) product.description = dto.description;
    if (dto.category !== undefined) {
      product.category = new Types.ObjectId(dto.category);
    }

    return product.save();
  }

  async remove(id: string): Promise<void> {
    const product = await this.requireProduct(id);

    await this.storage.removeMany([
      product.imageName,
      ...product.imageNameList,
    ]);

    await this.productModel.findByIdAndDelete(id).exec();
  }

  /**
   * Membership is checked **before** the object is deleted. The Express version
   * deleted from R2 first, so passing a key belonging to another product
   * destroyed that object and only then answered 404.
   */
  async removeImage(id: string, imageName: string): Promise<void> {
    const product = await this.requireProduct(id);

    if (!product.imageNameList.includes(imageName)) {
      throw new NotFoundException('Belirtilen görüntü adı bulunamadı');
    }

    await this.storage.remove(imageName);

    product.imageNameList = product.imageNameList.filter(
      (name) => name !== imageName,
    );
    await product.save();
  }

  async appendImages(
    id: string,
    files: Express.Multer.File[],
  ): Promise<string[]> {
    const product = await this.requireProduct(id);

    if (files.length === 0) {
      throw new BadRequestException('No files uploaded');
    }

    const newKeys = await Promise.all(
      files.map(async (file) => {
        const key = this.storage.buildKey(file.originalname);
        await this.storage.upload(file.buffer, key, file.mimetype);
        return key;
      }),
    );

    product.imageNameList = [...product.imageNameList, ...newKeys];
    await product.save();

    return product.imageNameList;
  }

  private async requireProduct(id: string): Promise<ProductDocument> {
    const product = await this.productModel.findById(id).exec();

    if (!product) {
      throw new NotFoundException('Ürün bulunamadı');
    }

    return product;
  }

  private toView(product: ProductDocument): ProductView {
    return {
      _id: product._id,
      name: product.name,
      imageName: product.imageName,
      imageUrl: this.storage.publicUrl(product.imageName),
      imageUrlList: product.imageNameList.map((key) =>
        this.storage.publicUrl(key),
      ),
      imageNameList: product.imageNameList,
      sizes: product.sizes,
      description: product.description,
      category: product.category,
      configuratorPreset: product.configuratorPreset,
    };
  }
}
