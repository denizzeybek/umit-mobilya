import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { getModelToken } from '@nestjs/mongoose';
import { Test } from '@nestjs/testing';
import mongoose from 'mongoose';
import type { Model } from 'mongoose';

import { Category } from '../category/schemas/category.schema';
import { CategorySchema } from '../category/schemas/category.schema';
import { ObjectStorageService } from '../storage/object-storage.service';
import {
  clearCollections,
  connectTestMongo,
  disconnectTestMongo,
} from '../../test/mongo-memory';
import { ProductService } from './product.service';
import type { Product } from './schemas/product.schema';
import { ProductSchema } from './schemas/product.schema';

describe('ProductService', () => {
  let service: ProductService;
  let productModel: Model<Product>;
  let categoryModel: Model<Category>;

  const storage = {
    publicUrl: jest.fn((key?: string | null) =>
      key ? `https://img.test/${encodeURIComponent(key)}` : null,
    ),
    buildKey: jest.fn(() => 'generated-key'),
    upload: jest.fn(),
    remove: jest.fn(),
    removeMany: jest.fn(),
  };

  beforeAll(async () => {
    await connectTestMongo();
    productModel = mongoose.connection.model('Product', ProductSchema);
    categoryModel = mongoose.connection.model('Category', CategorySchema);

    const moduleRef = await Test.createTestingModule({
      providers: [
        ProductService,
        { provide: getModelToken('Product'), useValue: productModel },
        { provide: getModelToken('Category'), useValue: categoryModel },
        { provide: ObjectStorageService, useValue: storage },
      ],
    }).compile();

    service = moduleRef.get(ProductService);
  });

  afterAll(async () => {
    await disconnectTestMongo();
  });

  beforeEach(async () => {
    await clearCollections();
    storage.upload.mockClear();
    storage.remove.mockClear();
    storage.removeMany.mockClear();
  });

  const seedCategory = async (name = 'Koltuk'): Promise<string> =>
    (await categoryModel.create({ name })).id as string;

  const seedProduct = async (
    overrides: Partial<Product> = {},
  ): Promise<string> => {
    const category = await seedCategory();
    const created = await productModel.create({
      name: 'Üçlü Koltuk',
      price: 1000,
      category: new mongoose.Types.ObjectId(category),
      ...overrides,
    });
    return created.id as string;
  };

  describe('findAll — the read shape', () => {
    it('composes imageUrl from the stored key', async () => {
      await seedProduct({ imageName: 'main-key' });

      const [product] = await service.findAll({});

      expect(product?.imageUrl).toBe('https://img.test/main-key');
    });

    it('reports imageUrl as null when there is no key', async () => {
      await seedProduct();

      const [product] = await service.findAll({});

      expect(product?.imageUrl).toBeNull();
    });

    it('keeps the raw keys alongside the composed urls', async () => {
      await seedProduct({ imageNameList: ['one', 'two'] });

      const [product] = await service.findAll({});

      expect(product?.imageNameList).toEqual(['one', 'two']);
      expect(product?.imageUrlList).toEqual([
        'https://img.test/one',
        'https://img.test/two',
      ]);
    });

    it('populates the category instead of returning a bare id', async () => {
      await seedProduct();

      const [product] = await service.findAll({});

      expect((product?.category as { name?: string })?.name).toBe('Koltuk');
    });

    it('flattens each module into the read shape, not the stored shape', async () => {
      const moduleId = await seedProduct({
        name: 'Puf',
        price: 250,
        imageName: 'puf-key',
      });
      await seedProduct({
        name: 'Set',
        modules: [
          { productId: new mongoose.Types.ObjectId(moduleId), quantity: 2 },
        ],
      });

      const set = (await service.findAll({})).find((p) => p.name === 'Set');

      expect(set?.modules[0]?._id?.toString()).toBe(moduleId);
      expect(set?.modules[0]).toEqual(
        expect.objectContaining({
          name: 'Puf',
          price: 250,
          quantity: 2,
          imageUrl: 'https://img.test/puf-key',
        }),
      );
    });

    it('totals the base price plus price times quantity of every module', async () => {
      const moduleId = await seedProduct({ name: 'Puf', price: 250 });
      await seedProduct({
        name: 'Set',
        price: 1000,
        modules: [
          { productId: new mongoose.Types.ObjectId(moduleId), quantity: 3 },
        ],
      });

      const set = (await service.findAll({})).find((p) => p.name === 'Set');

      expect(set?.totalPrice).toBe(1750);
    });

    it('reports totalPrice as the base price when there are no modules', async () => {
      await seedProduct({ price: 1000 });

      const [product] = await service.findAll({});

      expect(product?.totalPrice).toBe(1000);
    });
  });

  describe('findAll — filtering', () => {
    it('matches the name case-insensitively as a substring', async () => {
      await seedProduct({ name: 'Üçlü Koltuk' });
      await seedProduct({ name: 'Yatak' });

      expect(await service.findAll({ name: 'koltuk' })).toHaveLength(1);
    });

    it('treats regex metacharacters in the name as literal text', async () => {
      await seedProduct({ name: 'Koltuk' });

      expect(await service.findAll({ name: 'K.ltuk' })).toEqual([]);
    });

    it('restricts to a category', async () => {
      await seedProduct();
      const other = await seedCategory('Yatak');

      expect(await service.findAll({ category: other })).toEqual([]);
    });
  });

  describe('findById', () => {
    it('returns the read shape for one product', async () => {
      const id = await seedProduct();

      expect((await service.findById(id))._id.toString()).toBe(id);
    });

    it('throws NotFoundException when nothing matches', async () => {
      const unknownId = new mongoose.Types.ObjectId().toString();

      await expect(service.findById(unknownId)).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });
  });

  describe('create', () => {
    const file = {
      buffer: Buffer.from('image-bytes'),
      originalname: 'sofa.jpg',
      mimetype: 'image/jpeg',
    } as Express.Multer.File;

    it('stores the generated key, never a URL', async () => {
      const category = await seedCategory();

      const created = await service.create(
        { name: 'Koltuk', price: 1000, category },
        file,
      );

      expect(created.imageName).toBe('generated-key');
    });

    /*
     * Order matters. The Express version uploaded first and validated the
     * category afterwards, so every create with a bad category id left an
     * object in the bucket that nothing would ever reference or clean up.
     */
    it('rejects an unknown category WITHOUT uploading anything', async () => {
      const unknownCategory = new mongoose.Types.ObjectId().toString();

      await expect(
        service.create({ name: 'Koltuk', price: 1000, category: unknownCategory }, file),
      ).rejects.toBeInstanceOf(NotFoundException);
      expect(storage.upload).not.toHaveBeenCalled();
    });

    it('requires a file', async () => {
      const category = await seedCategory();

      await expect(
        service.create({ name: 'Koltuk', price: 1000, category }, undefined),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('starts the gallery list empty', async () => {
      const category = await seedCategory();

      const created = await service.create(
        { name: 'Koltuk', price: 1000, category },
        file,
      );

      expect(created.imageNameList).toEqual([]);
    });
  });

  describe('update', () => {
    it('leaves fields that were not sent untouched', async () => {
      const id = await seedProduct({ price: 1000, sizes: '200x90' });

      const updated = await service.update(id, { name: 'Dörtlü Koltuk' });

      expect(updated.name).toBe('Dörtlü Koltuk');
      expect(updated.price).toBe(1000);
      expect(updated.sizes).toBe('200x90');
    });

    it('throws NotFoundException for an unknown id', async () => {
      const unknownId = new mongoose.Types.ObjectId().toString();

      await expect(
        service.update(unknownId, { name: 'X' }),
      ).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  describe('remove', () => {
    it('deletes the record and every image key it owns', async () => {
      const id = await seedProduct({
        imageName: 'main-key',
        imageNameList: ['gallery-1', 'gallery-2'],
      });

      await service.remove(id);

      expect(storage.removeMany).toHaveBeenCalledWith([
        'main-key',
        'gallery-1',
        'gallery-2',
      ]);
      expect(await productModel.countDocuments()).toBe(0);
    });

    it('refuses to delete a product another product uses as a module', async () => {
      const moduleId = await seedProduct({ name: 'Puf' });
      await seedProduct({
        name: 'Set',
        modules: [
          { productId: new mongoose.Types.ObjectId(moduleId), quantity: 1 },
        ],
      });

      await expect(service.remove(moduleId)).rejects.toThrow(
        'Bu ürün Set içerisinde kullanıldığı için silinemez',
      );
    });

    it('leaves the record in place when the delete was refused', async () => {
      const moduleId = await seedProduct({ name: 'Puf' });
      await seedProduct({
        name: 'Set',
        modules: [
          { productId: new mongoose.Types.ObjectId(moduleId), quantity: 1 },
        ],
      });

      await expect(service.remove(moduleId)).rejects.toBeDefined();
      expect(await productModel.countDocuments()).toBe(2);
    });

    it('throws NotFoundException for an unknown id', async () => {
      const unknownId = new mongoose.Types.ObjectId().toString();

      await expect(service.remove(unknownId)).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });
  });

  describe('removeImage', () => {
    it('drops the key from the gallery list and from the bucket', async () => {
      const id = await seedProduct({ imageNameList: ['keep', 'drop'] });

      await service.removeImage(id, 'drop');

      const stored = await productModel.findById(id).exec();
      expect(stored?.imageNameList).toEqual(['keep']);
      expect(storage.remove).toHaveBeenCalledWith('drop');
    });

    /*
     * The Express version deleted from R2 first and checked membership after,
     * so passing another product's key destroyed that object and then answered
     * 404 — a delete that "failed" but had already happened.
     */
    it('does NOT touch the bucket when the key is not in this product gallery', async () => {
      const id = await seedProduct({ imageNameList: ['keep'] });

      await expect(
        service.removeImage(id, 'belongs-to-another-product'),
      ).rejects.toBeInstanceOf(NotFoundException);
      expect(storage.remove).not.toHaveBeenCalled();
    });
  });

  describe('addModule', () => {
    it('stores the module as { productId, quantity }', async () => {
      const setId = await seedProduct({ name: 'Set' });
      const moduleId = await seedProduct({ name: 'Puf' });

      const updated = await service.addModule(setId, {
        productId: moduleId,
        quantity: 2,
      });

      expect(updated.modules).toHaveLength(1);
      expect(updated.modules[0]?.quantity).toBe(2);
    });

    it('refuses to add a product to itself', async () => {
      const id = await seedProduct();

      await expect(
        service.addModule(id, { productId: id, quantity: 1 }),
      ).rejects.toThrow('Aynı ürünü ekleyemezsiniz');
    });

    it('refuses to add the same module twice', async () => {
      const moduleId = await seedProduct({ name: 'Puf' });
      const setId = await seedProduct({
        name: 'Set',
        modules: [
          { productId: new mongoose.Types.ObjectId(moduleId), quantity: 1 },
        ],
      });

      await expect(
        service.addModule(setId, { productId: moduleId, quantity: 1 }),
      ).rejects.toBeInstanceOf(ConflictException);
    });

    it('refuses a module product that does not exist', async () => {
      const setId = await seedProduct({ name: 'Set' });
      const unknownId = new mongoose.Types.ObjectId().toString();

      await expect(
        service.addModule(setId, { productId: unknownId, quantity: 1 }),
      ).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  describe('removeModule', () => {
    it('drops the module', async () => {
      const moduleId = await seedProduct({ name: 'Puf' });
      const setId = await seedProduct({
        name: 'Set',
        modules: [
          { productId: new mongoose.Types.ObjectId(moduleId), quantity: 1 },
        ],
      });

      expect((await service.removeModule(setId, moduleId)).modules).toEqual([]);
    });

    it('throws NotFoundException when the module is not part of the product', async () => {
      const setId = await seedProduct({ name: 'Set' });
      const strangerId = new mongoose.Types.ObjectId().toString();

      await expect(
        service.removeModule(setId, strangerId),
      ).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  describe('replaceModules', () => {
    it('replaces the whole list', async () => {
      const moduleId = await seedProduct({ name: 'Puf' });
      const setId = await seedProduct({ name: 'Set' });

      const updated = await service.replaceModules(setId, [
        { productId: moduleId, quantity: 5 },
      ]);

      expect(updated.modules).toHaveLength(1);
      expect(updated.modules[0]?.quantity).toBe(5);
    });

    it('empties the list when given an empty array', async () => {
      const moduleId = await seedProduct({ name: 'Puf' });
      const setId = await seedProduct({
        name: 'Set',
        modules: [
          { productId: new mongoose.Types.ObjectId(moduleId), quantity: 1 },
        ],
      });

      expect((await service.replaceModules(setId, [])).modules).toEqual([]);
    });
  });

  describe('appendImages', () => {
    it('appends the new keys after the existing ones', async () => {
      const id = await seedProduct({ imageNameList: ['already-here'] });
      const files = [
        {
          buffer: Buffer.from('a'),
          originalname: 'a.jpg',
          mimetype: 'image/jpeg',
        },
        {
          buffer: Buffer.from('b'),
          originalname: 'b.jpg',
          mimetype: 'image/jpeg',
        },
      ] as Express.Multer.File[];

      const result = await service.appendImages(id, files);

      expect(result).toHaveLength(3);
      expect(result[0]).toBe('already-here');
      expect(storage.upload).toHaveBeenCalledTimes(2);
    });

    it('rejects an empty upload', async () => {
      const id = await seedProduct();

      await expect(service.appendImages(id, [])).rejects.toBeInstanceOf(
        BadRequestException,
      );
    });
  });
});
