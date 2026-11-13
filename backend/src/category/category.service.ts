import { Injectable } from '@nestjs/common';
import { CreateCategoryDto } from './dto/create-category.dto.js';
import { UpdateCategoryDto } from './dto/update-category.dto.js';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Category, CategoryDocument } from './schemas/category.schema.js';
import { categorySeed } from './category.seed.js';
import { ProductsService } from '../products/products.service.js';

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

  async nextId(){
    return await this.categoryModel.countDocuments() + 1;
  }

  async create(createCategoryDto: CreateCategoryDto) {
    const id = await this.nextId();
    const newData = {...createCategoryDto, id, slug:createCategoryDto.name.toLowerCase().replace(/ /g, '-')}
    return this.categoryModel.create(newData);
  }

  findAll() {
    return this.categoryModel.find().exec();
  }

  findOne(id: number) {
    return this.categoryModel.findOne({ id }).exec();
  }

  update(id: number, updateCategoryDto: UpdateCategoryDto) {
    return this.categoryModel.findOneAndUpdate({ id }, updateCategoryDto, {new: true}).exec();
  }

  remove(id: number) {
    return this.categoryModel.findOneAndDelete({ id }).exec();
  }

  getBySlug(slug: string) {
    return this.categoryModel.findOne({ slug }).exec();
  }

  getProductsByCategory(id:number){
    return this.productsService.findByCategoryId(id);
  }
}
