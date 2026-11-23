import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateCategoryDto } from './dto/create-category.dto.js';
import { UpdateCategoryDto } from './dto/update-category.dto.js';
import { InjectModel } from '@nestjs/mongoose';
import type { Model } from 'mongoose';
import { Category, CategoryDocument } from './schemas/category.schema.js';
import { categorySeed } from './category.seed.js';
import { ProductsService } from '../products/products.service.js';
import {
  resolvePagination,
  toPaginatedResult,
  type PaginatedResult,
  type PaginationQueryDto,
} from '../common/dto/pagination.dto.js';

@Injectable()
export class CategoryService {
  constructor(
    @InjectModel(Category.name) private categoryModel: Model<CategoryDocument>,
    private readonly productsService: ProductsService,
  ) {}
   // Runs automatically once when NestJS finishes initializing
  async onApplicationBootstrap() {
    await this.seed();
  }

  private async seed() {
    const count = await this.categoryModel.countDocuments();
    if (count > 0) {
      return; // Skip if data already exists
    }

    await this.categoryModel.insertMany(categorySeed);
    console.log(`Seeded ${categorySeed.length} categories on startup.`);
  }

  async nextId() {
    const lastCategory = await this.categoryModel
      .findOne()
      .sort({ id: -1 })
      .select('id')
      .lean()
      .exec();
    return (lastCategory?.id ?? 0) + 1;
  }

  async create(createCategoryDto: CreateCategoryDto) {
    const id = await this.nextId();
    const newData = {
      name: createCategoryDto.name,
      image: createCategoryDto.image,
      id,
      slug: createCategoryDto.name.toLowerCase().replace(/ /g, '-'),
    };
    return this.categoryModel.create(newData);
  }

  async findAll(query: PaginationQueryDto = {}): Promise<CategoryDocument[] | PaginatedResult<CategoryDocument>> {
    const pagination = resolvePagination(query);
    if (!pagination) {
      return this.categoryModel.find().sort({ name: 1 }).exec();
    }
    const [items, total] = await Promise.all([
      this.categoryModel
        .find()
        .sort({ name: 1 })
        .skip(pagination.skip)
        .limit(pagination.limit)
        .exec(),
      this.categoryModel.countDocuments().exec(),
    ]);
    return toPaginatedResult(items, total, pagination);
  }

  async findOne(id: number) {
    const category = await this.categoryModel.findOne({ id }).exec();
    if (!category) {
      throw new NotFoundException('Category not found');
    }
    return category;
  }

  async update(id: number, updateCategoryDto: UpdateCategoryDto) {
    const category = await this.categoryModel.findOneAndUpdate({ id }, updateCategoryDto, { new: true }).exec();
    if (!category) {
      throw new NotFoundException('Category not found');
    }
    return category;
  }

  async remove(id: number) {
    const category = await this.categoryModel.findOneAndDelete({ id }).exec();
    if (!category) {
      throw new NotFoundException('Category not found');
    }
    return category;
  }

  async getBySlug(slug: string) {
    const category = await this.categoryModel.findOne({ slug }).exec();
    if (!category) {
      throw new NotFoundException('Category not found');
    }
    return category;
  }

  getProductsByCategory(id:number){
    return this.productsService.findByCategoryId(id);
  }
}
