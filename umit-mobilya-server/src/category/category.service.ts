import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import type { FilterQuery, Model } from 'mongoose';

import type { CreateCategoryDto } from './dto/create-category.dto';
import type { FilterCategoryDto } from './dto/filter-category.dto';
import type { UpdateCategoryDto } from './dto/update-category.dto';
import { Category } from './schemas/category.schema';
import type { CategoryDocument } from './schemas/category.schema';


/*
 * A name typed by a user reaches `new RegExp(...)`, so it has to be escaped.
 * The Express version passed it through raw, which meant a search for "3+1"
 * threw and a search for "(a+)+b" could hang the process.
 */
function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

@Injectable()
export class CategoryService {
  constructor(
    @InjectModel(Category.name)
    private readonly categoryModel: Model<Category>,
  ) {}

  async findAll(): Promise<CategoryDocument[]> {
    return this.categoryModel.find().exec();
  }

  async filter(dto: FilterCategoryDto): Promise<CategoryDocument[]> {
    const query: FilterQuery<Category> = {
      ...(dto.name ? { name: new RegExp(escapeRegex(dto.name), 'i') } : {}),
    };

    return this.categoryModel.find(query).exec();
  }

  async create(dto: CreateCategoryDto): Promise<CategoryDocument> {
    return this.categoryModel.create({ name: dto.name });
  }

  async update(
    id: string,
    dto: UpdateCategoryDto,
  ): Promise<CategoryDocument> {
    const updated = await this.categoryModel
      .findByIdAndUpdate(id, { name: dto.name }, { new: true, runValidators: true })
      .exec();

    if (!updated) {
      throw new NotFoundException('Category not found.');
    }

    return updated;
  }

  async remove(id: string): Promise<void> {
    const deleted = await this.categoryModel.findByIdAndDelete(id).exec();

    if (!deleted) {
      throw new NotFoundException('Kategori bulunamadı.');
    }
  }
}
