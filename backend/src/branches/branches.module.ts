import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { BranchesController } from './branches.controller.js';
import { BranchesService } from './branches.service.js';
import { Branch, BranchSchema } from './schemas/branch.schema.js';
import { BranchInventory, BranchInventorySchema } from './schemas/branch-inventory.schema.js';
import { BranchInventoryService } from './branch-inventory.service.js';
import { Product, ProductSchema } from '../products/schemas/products.schema.js';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Branch.name, schema: BranchSchema },
      { name: BranchInventory.name, schema: BranchInventorySchema },
      { name: Product.name, schema: ProductSchema },
    ]),
  ],
  controllers: [BranchesController],
  providers: [BranchesService, BranchInventoryService],
  exports: [BranchesService, BranchInventoryService],
})
export class BranchesModule {}
