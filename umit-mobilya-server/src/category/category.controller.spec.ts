import { Test } from '@nestjs/testing';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CategoryController } from './category.controller';
import { CategoryService } from './category.service';

/*
 * Controller-only: the service is a double, so what is under test is the HTTP
 * surface — which argument reaches which service call, and what comes back.
 * The query behaviour behind those calls has its own spec next door.
 */
describe('CategoryController', () => {
  const service = {
    findAll: jest.fn(),
    filter: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };

  let controller: CategoryController;

  beforeEach(async () => {
    jest.resetAllMocks();

    const moduleRef = await Test.createTestingModule({
      controllers: [CategoryController],
      providers: [{ provide: CategoryService, useValue: service }],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = moduleRef.get(CategoryController);
  });

  it('findAll returns what the service returns', async () => {
    const categories = [{ name: 'Koltuk' }];
    service.findAll.mockResolvedValue(categories);

    await expect(controller.findAll()).resolves.toBe(categories);
  });

  it('filter forwards the name to the service', async () => {
    service.filter.mockResolvedValue([]);

    await controller.filter({ name: 'koltuk' });

    expect(service.filter).toHaveBeenCalledWith({ name: 'koltuk' });
  });

  it('filter defaults to an empty filter when the GET carries no body', async () => {
    service.filter.mockResolvedValue([]);

    await controller.filter();

    expect(service.filter).toHaveBeenCalledWith({});
  });

  it('create forwards the dto', async () => {
    const created = { name: 'Koltuk' };
    service.create.mockResolvedValue(created);

    await expect(controller.create({ name: 'Koltuk' })).resolves.toBe(created);
    expect(service.create).toHaveBeenCalledWith({ name: 'Koltuk' });
  });

  it('update forwards both the id and the dto', async () => {
    const updated = { name: 'Koltuk Takımı' };
    service.update.mockResolvedValue(updated);

    await expect(
      controller.update('abc', { name: 'Koltuk Takımı' }),
    ).resolves.toBe(updated);
    expect(service.update).toHaveBeenCalledWith('abc', {
      name: 'Koltuk Takımı',
    });
  });

  it('remove answers with a message rather than the deleted document', async () => {
    service.remove.mockResolvedValue(undefined);

    await expect(controller.remove('abc')).resolves.toEqual({
      message: 'Kategori başarıyla silindi.',
    });
    expect(service.remove).toHaveBeenCalledWith('abc');
  });
});
