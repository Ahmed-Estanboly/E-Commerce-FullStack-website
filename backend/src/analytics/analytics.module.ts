import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Order, OrderSchema } from '../orders/schemas/order.schema.js';
import { Branch, BranchSchema } from '../branches/schemas/branch.schema.js';
import { BranchInventory, BranchInventorySchema } from '../branches/schemas/branch-inventory.schema.js';
import { Product, ProductSchema } from '../products/schemas/products.schema.js';
import { AnalyticsService } from './analytics.service.js';
import { AnalyticsController } from './analytics.controller.js';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Order.name, schema: OrderSchema },
      { name: Branch.name, schema: BranchSchema },
      { name: BranchInventory.name, schema: BranchInventorySchema },
      { name: Product.name, schema: ProductSchema },
    ]),
  ],
  controllers: [AnalyticsController],
  providers: [AnalyticsService],
})
export class AnalyticsModule {}
