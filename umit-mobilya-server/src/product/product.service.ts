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
import type { ModuleEntryDto } from './dto/module.dto';
import type { UpdateProductDto } from './dto/update-product.dto';
import { Product } from './schemas/product.schema';
import type { ProductDocument } from './schemas/product.schema';

/** A module as the API returns it — flattened, not the `{ productId, quantity }` that is stored. */
export interface ProductModuleView {
  _id: Types.ObjectId | undefined;
  name: string | undefined;
  price: number | undefined;
  currency: string | undefined;
  imageUrl: string | null;
  quantity: number;
  sizes: string | undefined;
  description: string | undefined;
  category: unknown;
}

/** A product as the API returns it. Differs from the stored document. */
export interface ProductView {
  _id: Types.ObjectId;
  name: string;
  price: number;
  currency: string;
  imageName: string | undefined;
  imageUrl: string | null;
  imageUrlList: (string | null)[];
  imageNameList: string[];
  sizes: string | undefined;
  description: string | undefined;
  category: unknown;
  quantity: number;
  modules: ProductModuleView[];
  totalPrice: number;
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
      .populate({ path: 'modules.productId', populate: { path: 'category' } })
      .populate('category')
      .exec();

    return products.map((product) => this.toView(product));
  }

  async findById(id: string): Promise<ProductView> {
    const product = await this.productModel
      .findById(id)
      .populate({ path: 'modules.productId', populate: { path: 'category' } })
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
      price: dto.price,
      ...(dto.currency ? { currency: dto.currency } : {}),
      ...(dto.sizes ? { sizes: dto.sizes } : {}),
      ...(dto.description ? { description: dto.description } : {}),
      ...(dto.quantity === undefined ? {} : { quantity: dto.quantity }),
      category: new Types.ObjectId(dto.category),
      imageName,
      imageNameList: [],
      modules: [],
    });
  }

  async update(id: string, dto: UpdateProductDto): Promise<ProductDocument> {
    const product = await this.requireProduct(id);

    if (dto.name !== undefined) product.name = dto.name;
    if (dto.price !== undefined) product.price = dto.price;
    if (dto.currency !== undefined) product.currency = dto.currency;
    if (dto.sizes !== undefined) product.sizes = dto.sizes;
    if (dto.description !== undefined) product.description = dto.description;
    if (dto.quantity !== undefined) product.quantity = dto.quantity;
    if (dto.category !== undefined) {
      product.category = new Types.ObjectId(dto.category);
    }

    return product.save();
  }

  async remove(id: string): Promise<void> {
    const product = await this.requireProduct(id);

    /*
     * One indexed query instead of loading every product with a deep populate
     * just to scan their module lists, which is what the Express version did.
     */
    const usedBy = await this.productModel
      .findOne({ 'modules.productId': new Types.ObjectId(id) })
      .select('name')
      .exec();

    if (usedBy) {
      throw new ConflictException(
        `Bu ürün ${usedBy.name} içerisinde kullanıldığı için silinemez`,
      );
    }

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

  async addModule(
    productId: string,
    entry: ModuleEntryDto,
  ): Promise<ProductDocument> {
    if (productId === entry.productId) {
      throw new BadRequestException('Aynı ürünü ekleyemezsiniz');
    }

    const product = await this.requireProduct(productId);

    const moduleProduct = await this.productModel
      .findById(entry.productId)
      .exec();
    if (!moduleProduct) {
      throw new NotFoundException('Modül olarak eklenecek ürün bulunamadı');
    }

    const already = product.modules.some(
      (module) => module.productId.toString() === entry.productId,
    );
    if (already) {
      throw new ConflictException('Bu modül zaten eklenmiş');
    }

    product.modules.push({
      productId: new Types.ObjectId(entry.productId),
      quantity: entry.quantity,
    });

    return product.save();
  }

  async removeModule(
    productId: string,
    moduleId: string,
  ): Promise<ProductDocument> {
    const product = await this.requireProduct(productId);

    const before = product.modules.length;
    product.modules = product.modules.filter(
      (module) => module.productId.toString() !== moduleId,
    );

    if (product.modules.length === before) {
      throw new NotFoundException(
        'Bu modül ürün içinde bulunamadı veya zaten kaldırılmış',
      );
    }

    return product.save();
  }

  async replaceModules(
    productId: string,
    entries: ModuleEntryDto[],
  ): Promise<ProductDocument> {
    const product = await this.requireProduct(productId);

    product.modules = entries.map((entry) => ({
      productId: new Types.ObjectId(entry.productId),
      quantity: entry.quantity,
    }));

    return product.save();
  }

  private async requireProduct(id: string): Promise<ProductDocument> {
    const product = await this.productModel.findById(id).exec();

    if (!product) {
      throw new NotFoundException('Ürün bulunamadı');
    }

    return product;
  }

  private toView(product: ProductDocument): ProductView {
    const modules = product.modules.map((module) => {
      const source = module.productId as unknown as Partial<Product> & {
        _id?: Types.ObjectId;
      };

      return {
        _id: source?._id,
        name: source?.name,
        price: source?.price,
        currency: source?.currency,
        imageUrl: this.storage.publicUrl(source?.imageName),
        quantity: module.quantity,
        sizes: source?.sizes,
        description: source?.description,
        category: source?.category,
      };
    });

    const moduleTotal = modules.reduce(
      (sum, module) => sum + (module.price ?? 0) * (module.quantity || 1),
      0,
    );

    return {
      _id: product._id,
      name: product.name,
      price: product.price,
      currency: product.currency,
      imageName: product.imageName,
      imageUrl: this.storage.publicUrl(product.imageName),
      imageUrlList: product.imageNameList.map((key) =>
        this.storage.publicUrl(key),
      ),
      imageNameList: product.imageNameList,
      sizes: product.sizes,
      description: product.description,
      category: product.category,
      quantity: product.quantity,
      modules,
      totalPrice: (product.price || 0) + moduleTotal,
    };
  }
}
