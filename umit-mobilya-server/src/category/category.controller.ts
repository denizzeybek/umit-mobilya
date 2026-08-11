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
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ParseObjectIdPipe } from '../common/pipes/parse-object-id.pipe';
import { CategoryService } from './category.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { FilterCategoryDto } from './dto/filter-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import type { CategoryDocument } from './schemas/category.schema';

@ApiTags('categories')
@Controller('api/categories')
export class CategoryController {
  constructor(private readonly categoryService: CategoryService) {}

  /** Every category, unfiltered. Public — the storefront reads it. */
  @Get()
  async findAll(): Promise<CategoryDocument[]> {
    return this.categoryService.findAll();
  }

  /**
   * Filters categories by name.
   *
   * Reads the criteria from the request BODY of a GET, which is unusual and
   * deliberate: that is what the Express version did and what the frontend
   * sends. Changing it to a query parameter is a breaking change for callers.
   */
  @Get('filter')
  async filter(
    @Body() dto: FilterCategoryDto | undefined,
  ): Promise<CategoryDocument[]> {
    return this.categoryService.filter(dto ?? {});
  }

  /** Creates a category. */
  @Post()
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  async create(@Body() dto: CreateCategoryDto): Promise<CategoryDocument> {
    return this.categoryService.create(dto);
  }

  /** Renames a category. */
  @Put(':id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async update(
    @Param('id', ParseObjectIdPipe) id: string,
    @Body() dto: UpdateCategoryDto,
  ): Promise<CategoryDocument> {
    return this.categoryService.update(id, dto);
  }

  /** Deletes a category. Answers with a message, not the deleted document. */
  @Delete(':id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  async remove(@Param('id', ParseObjectIdPipe) id: string): Promise<{ message: string }> {
    await this.categoryService.remove(id);
    return { message: 'Kategori başarıyla silindi.' };
  }
}
