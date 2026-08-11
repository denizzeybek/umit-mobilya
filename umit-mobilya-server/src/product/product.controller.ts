import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Put,
  UploadedFile,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import {
  ApiBearerAuth,
  ApiConsumes,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiTags,
} from '@nestjs/swagger';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { MessageResponseDto } from '../common/dto/message-response.dto';
import { ParseObjectIdPipe } from '../common/pipes/parse-object-id.pipe';
import { CreateProductDto } from './dto/create-product.dto';
import { FilterProductDto } from './dto/filter-product.dto';
import {
  AddModuleDto,
  DeleteImageDto,
  UpdateModulesDto,
} from './dto/module.dto';
import {
  ImageListResponseDto,
  ProductDocumentDto,
  ProductEnvelopeDto,
  ProductResponseDto,
} from './dto/product-response.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { ProductService } from './product.service';
import type { ProductView } from './product.service';
import type { ProductDocument } from './schemas/product.schema';

const MAX_GALLERY_FILES = 20;

/*
 * Declaration order is load-bearing. Nest matches routes in the order the
 * handlers are declared, so `create-images/:id` and `update-modules/:id` must
 * come before `:id` — otherwise `:id` swallows them and the request lands in
 * the wrong handler with id="create-images".
 */
@ApiTags('products')
@Controller('api/products')
export class ProductController {
  constructor(private readonly productService: ProductService) {}

  /**
   * Every product, in the read shape: modules flattened, image URLs composed,
   * totalPrice added.
   *
   * Answers **201**, not 200. That is what the Express version did and the
   * frontend has been living with it; changing it is a separate decision.
   */
  @Get()
  @HttpCode(HttpStatus.CREATED)
  @ApiCreatedResponse({ type: [ProductResponseDto] })
  async findAll(): Promise<ProductView[]> {
    return this.productService.findAll({});
  }

  /**
   * Filters products by name and category.
   *
   * A POST that performs a read, and public — both inherited from the Express
   * version, which the frontend's product list depends on.
   */
  @Post('filter')
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ type: [ProductResponseDto] })
  async filter(@Body() dto: FilterProductDto = {}): Promise<ProductView[]> {
    return this.productService.findAll(dto);
  }

  /** Adds a product. The image is required and is uploaded to R2. */
  @Post()
  @ApiCreatedResponse({ type: ProductDocumentDto })
  @ApiBearerAuth()
  @ApiConsumes('multipart/form-data')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FileInterceptor('image'))
  async create(
    @Body() dto: CreateProductDto,
    @UploadedFile() file: Express.Multer.File | undefined,
  ): Promise<ProductDocument> {
    return this.productService.create(dto, file);
  }

  /**
   * Appends gallery images.
   *
   * The field name is the **singular** `image` even though several files are
   * accepted — inherited from `upload.array('image', 20)`, and the frontend
   * appends every file under that one key.
   */
  @Put('create-images/:id')
  @ApiOkResponse({ type: ImageListResponseDto })
  @ApiBearerAuth()
  @ApiConsumes('multipart/form-data')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FilesInterceptor('image', MAX_GALLERY_FILES))
  async uploadImages(
    @Param('id', ParseObjectIdPipe) id: string,
    @UploadedFiles() files: Express.Multer.File[] | undefined,
  ): Promise<{ message: string; imageNameList: string[] }> {
    const imageNameList = await this.productService.appendImages(
      id,
      files ?? [],
    );

    return {
      message: 'Product images updated successfully',
      imageNameList,
    };
  }

  /** Replaces the whole module list of a product. */
  @Put('update-modules/:id')
  @ApiOkResponse({ type: ProductEnvelopeDto })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  async updateModules(
    @Param('id', ParseObjectIdPipe) id: string,
    @Body() dto: UpdateModulesDto,
  ): Promise<{ message: string; product: ProductDocument }> {
    const product = await this.productService.replaceModules(id, dto.modules);
    return { message: 'Tüm modüller başarıyla güncellendi', product };
  }

  /** Adds one product to another as a module. */
  @Post('add-module')
  @ApiOkResponse({ type: ProductEnvelopeDto })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async addModule(
    @Body() dto: AddModuleDto,
  ): Promise<{ message: string; product: ProductDocument }> {
    const product = await this.productService.addModule(
      dto.productId,
      dto.module,
    );
    return { message: 'Modül başarıyla eklendi', product };
  }

  /** Removes a module from a product. */
  @Delete('remove-module/:productId/:moduleId')
  @ApiOkResponse({ type: ProductEnvelopeDto })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  async removeModule(
    @Param('productId', ParseObjectIdPipe) productId: string,
    @Param('moduleId', ParseObjectIdPipe) moduleId: string,
  ): Promise<{ message: string; product: ProductDocument }> {
    const product = await this.productService.removeModule(productId, moduleId);
    return { message: 'Modül başarıyla kaldırıldı', product };
  }

  /** Removes one gallery image, from both the record and the bucket. */
  @Post('delete-image/:id')
  @ApiOkResponse({ type: MessageResponseDto })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async deleteImage(
    @Param('id', ParseObjectIdPipe) id: string,
    @Body() dto: DeleteImageDto,
  ): Promise<{ message: string }> {
    await this.productService.removeImage(id, dto.imageName);
    return { message: 'Görüntü başarıyla silindi' };
  }

  /** One product in the read shape. Answers **201**, matching `GET /`. */
  @Get(':id')
  @HttpCode(HttpStatus.CREATED)
  @ApiCreatedResponse({ type: ProductResponseDto })
  async findById(
    @Param('id', ParseObjectIdPipe) id: string,
  ): Promise<ProductView> {
    return this.productService.findById(id);
  }

  /** Patches a product. Fields that are not sent keep their stored value. */
  @Put(':id')
  @ApiOkResponse({ type: ProductDocumentDto })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  async update(
    @Param('id', ParseObjectIdPipe) id: string,
    @Body() dto: UpdateProductDto,
  ): Promise<ProductDocument> {
    return this.productService.update(id, dto);
  }

  /** Deletes a product and every image it owns. */
  @Delete(':id')
  @ApiOkResponse({ type: MessageResponseDto })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  async remove(
    @Param('id', ParseObjectIdPipe) id: string,
  ): Promise<{ message: string }> {
    await this.productService.remove(id);
    return { message: 'Ürün silindi' };
  }
}
