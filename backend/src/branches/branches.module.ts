import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { BranchesController } from './branches.controller.js';
import { BranchesService } from './branches.service.js';
import { Branch, BranchSchema } from './schemas/branch.schema.js';
import { BranchInventory, BranchInventorySchema } from './schemas/branch-inventory.schema.js';
import { BranchInventoryService } from './branch-inventory.service.js';
import { Product, ProductSchema } from '../products/schemas/products.schema.js';
import { UsersModule } from '../users/users.module.js';
import { ProductsModule } from '../products/products.module.js';
import { Order, OrderSchema } from '../orders/schemas/order.schema.js';

@Module({
  imports: [
    UsersModule,
    ProductsModule,
    MongooseModule.forFeature([
      { name: Branch.name, schema: BranchSchema },
      { name: BranchInventory.name, schema: BranchInventorySchema },
      { name: Product.name, schema: ProductSchema },
      { name: Order.name, schema: OrderSchema },
    ]),
  ],
  controllers: [BranchesController],
  providers: [BranchesService, BranchInventoryService],
  exports: [BranchesService, BranchInventoryService],
})
export class BranchesModule {}
