import { Test } from '@nestjs/testing';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ProductController } from './product.controller';
import { ProductService } from './product.service';

describe('ProductController', () => {
  const service = {
    findAll: jest.fn(),
    findById: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
    removeImage: jest.fn(),
    appendImages: jest.fn(),
    addModule: jest.fn(),
    removeModule: jest.fn(),
    replaceModules: jest.fn(),
  };

  let controller: ProductController;

  beforeEach(async () => {
    jest.resetAllMocks();

    const moduleRef = await Test.createTestingModule({
      controllers: [ProductController],
      providers: [{ provide: ProductService, useValue: service }],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = moduleRef.get(ProductController);
  });

  const file = {
    buffer: Buffer.from('x'),
    originalname: 'a.jpg',
    mimetype: 'image/jpeg',
  } as Express.Multer.File;

  it('findAll asks for every product with no filter', async () => {
    service.findAll.mockResolvedValue([]);

    await controller.findAll();

    expect(service.findAll).toHaveBeenCalledWith({});
  });

  it('filter forwards name and category', async () => {
    service.findAll.mockResolvedValue([]);

    await controller.filter({ name: 'koltuk', category: 'cat-1' });

    expect(service.findAll).toHaveBeenCalledWith({
      name: 'koltuk',
      category: 'cat-1',
    });
  });

  /*
   * The parameter must stay annotated as the DTO itself, never as
   * `FilterProductDto | undefined`. Nest reads the metatype to decide whether
   * to validate, and a union resolves to Object — which silently turns the
   * global ValidationPipe off for this endpoint.
   */
  it('filter defaults to an empty filter when no body is sent', async () => {
    service.findAll.mockResolvedValue([]);

    await controller.filter();

    expect(service.findAll).toHaveBeenCalledWith({});
  });

  it('findById forwards the id', async () => {
    service.findById.mockResolvedValue({});

    await controller.findById('p-1');

    expect(service.findById).toHaveBeenCalledWith('p-1');
  });

  it('create passes both the dto and the uploaded file', async () => {
    service.create.mockResolvedValue({});
    const dto = { name: 'Koltuk', price: 1000, category: 'cat-1' };

    await controller.create(dto, file);

    expect(service.create).toHaveBeenCalledWith(dto, file);
  });

  it('update forwards the id and the dto', async () => {
    service.update.mockResolvedValue({});

    await controller.update('p-1', { name: 'X' });

    expect(service.update).toHaveBeenCalledWith('p-1', { name: 'X' });
  });

  it('uploadImages answers with the message and the new key list', async () => {
    service.appendImages.mockResolvedValue(['a', 'b']);

    await expect(controller.uploadImages('p-1', [file])).resolves.toEqual({
      message: 'Product images updated successfully',
      imageNameList: ['a', 'b'],
    });
  });

  it('uploadImages treats a missing file list as an empty one', async () => {
    service.appendImages.mockResolvedValue([]);

    await controller.uploadImages('p-1', undefined);

    expect(service.appendImages).toHaveBeenCalledWith('p-1', []);
  });

  it('remove answers with a message rather than the deleted document', async () => {
    service.remove.mockResolvedValue(undefined);

    await expect(controller.remove('p-1')).resolves.toEqual({
      message: 'Ürün silindi',
    });
  });

  it('deleteImage forwards the key from the body', async () => {
    service.removeImage.mockResolvedValue(undefined);

    await expect(
      controller.deleteImage('p-1', { imageName: 'k' }),
    ).resolves.toEqual({ message: 'Görüntü başarıyla silindi' });
    expect(service.removeImage).toHaveBeenCalledWith('p-1', 'k');
  });

});
