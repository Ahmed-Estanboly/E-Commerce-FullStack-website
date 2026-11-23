import { Module } from '@nestjs/common';
import { ProductsService } from './products.service.js';
import { ProductsController } from './products.controller.js';
import { MongooseModule } from '@nestjs/mongoose';
import { Product, ProductSchema } from './schemas/products.schema.js';
import { Category, CategorySchema } from '../category/schemas/category.schema.js';
import { BranchInventory, BranchInventorySchema } from '../branches/schemas/branch-inventory.schema.js';
import { Branch, BranchSchema } from '../branches/schemas/branch.schema.js';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Product.name, schema: ProductSchema },
      { name: Category.name, schema: CategorySchema },
      { name: BranchInventory.name, schema: BranchInventorySchema },
      { name: Branch.name, schema: BranchSchema },
    ]),
  ],
  controllers: [ProductsController],
  providers: [ProductsService],
  exports: [ProductsService],
})
export class ProductsModule {}
