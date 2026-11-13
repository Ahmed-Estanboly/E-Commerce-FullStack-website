import { Module } from '@nestjs/common';
import { CategoryService } from './category.service.js';
import { CategoryController } from './category.controller.js';
import { MongooseModule } from '@nestjs/mongoose';
import { Category } from './entities/category.entity.js';
import { CategorySchema } from './schemas/category.schema.js';
import { ProductsModule } from '../products/products.module.js';

@Module({
  imports: [ProductsModule, MongooseModule.forFeature([{ name: Category.name, schema: CategorySchema }])],
  controllers: [CategoryController],
  providers: [CategoryService],
})
export class CategoryModule {}
