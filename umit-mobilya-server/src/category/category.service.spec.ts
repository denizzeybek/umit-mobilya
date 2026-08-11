import { NotFoundException } from '@nestjs/common';
import { getModelToken } from '@nestjs/mongoose';
import { Test } from '@nestjs/testing';
import mongoose from 'mongoose';
import type { Model } from 'mongoose';

import {
  clearCollections,
  connectTestMongo,
  disconnectTestMongo,
} from '../../test/mongo-memory';
import { CategoryService } from './category.service';
import type { Category, CategoryDocument } from './schemas/category.schema';
import { CategorySchema } from './schemas/category.schema';

/*
 * Runs against a real in-memory mongod rather than a mocked model, because the
 * behaviour under test *is* the query: the `filter` case-insensitive regex and
 * the null-versus-throw distinction that `findByIdAndUpdate` makes. A mock
 * would just re-state the implementation. See .claude/rules/00-tdd-discipline.md.
 */
describe('CategoryService', () => {
  let service: CategoryService;
  let model: Model<Category>;

  beforeAll(async () => {
    await connectTestMongo();

    model = mongoose.connection.model('Category', CategorySchema);

    const moduleRef = await Test.createTestingModule({
      providers: [
        CategoryService,
        { provide: getModelToken('Category'), useValue: model },
      ],
    }).compile();

    service = moduleRef.get(CategoryService);
  });

  afterAll(async () => {
    await disconnectTestMongo();
  });

  beforeEach(async () => {
    await clearCollections();
  });

  const seed = async (name: string): Promise<CategoryDocument> =>
    model.create({ name });

  describe('findAll', () => {
    it('returns every category', async () => {
      await seed('Koltuk');
      await seed('Yatak');

      const categories = await service.findAll();

      expect(categories.map((c: Category) => c.name).sort()).toEqual([
        'Koltuk',
        'Yatak',
      ]);
    });

    it('returns an empty array when nothing is stored', async () => {
      expect(await service.findAll()).toEqual([]);
    });
  });

  describe('filter', () => {
    it('matches the name case-insensitively as a substring', async () => {
      await seed('Koltuk Takımı');
      await seed('Yatak Odası');

      const categories = await service.filter({ name: 'koltuk' });

      expect(categories).toHaveLength(1);
      expect(categories[0]?.name).toBe('Koltuk Takımı');
    });

    it('returns everything when no name is given', async () => {
      await seed('Koltuk');
      await seed('Yatak');

      expect(await service.filter({})).toHaveLength(2);
    });

    it('treats regex metacharacters in the name as literal text', async () => {
      await seed('Koltuk');

      const categories = await service.filter({ name: 'K.ltuk' });

      expect(categories).toEqual([]);
    });
  });

  describe('create', () => {
    it('stores the category and returns it with an id', async () => {
      const created = await service.create({ name: 'Koltuk' });

      expect(created.name).toBe('Koltuk');
      expect(await model.countDocuments()).toBe(1);
    });

    it('stamps createdAt', async () => {
      const created = await service.create({ name: 'Koltuk' });

      expect(created.createdAt).toBeInstanceOf(Date);
    });
  });

  describe('update', () => {
    it('returns the document as it looks after the change, not before', async () => {
      const category = await seed('Koltuk');

      const updated = await service.update(category.id as string, {
        name: 'Koltuk Takımı',
      });

      expect(updated.name).toBe('Koltuk Takımı');
    });

    it('throws NotFoundException when the id matches nothing', async () => {
      const unknownId = new mongoose.Types.ObjectId().toString();

      await expect(
        service.update(unknownId, { name: 'Koltuk' }),
      ).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  describe('remove', () => {
    it('deletes the document', async () => {
      const category = await seed('Koltuk');

      await service.remove(category.id as string);

      expect(await model.countDocuments()).toBe(0);
    });

    it('throws NotFoundException when the id matches nothing', async () => {
      const unknownId = new mongoose.Types.ObjectId().toString();

      await expect(service.remove(unknownId)).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });
  });
});
