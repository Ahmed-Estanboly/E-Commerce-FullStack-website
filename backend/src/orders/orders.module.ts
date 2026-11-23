import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Order, OrderSchema } from './schemas/order.schema.js';
import { Product, ProductSchema } from '../products/schemas/products.schema.js';
import { Branch, BranchSchema } from '../branches/schemas/branch.schema.js';
import { BranchInventory, BranchInventorySchema } from '../branches/schemas/branch-inventory.schema.js';
import { OrdersService } from './orders.service.js';
import { OrdersController } from './orders.controller.js';
import { BranchesModule } from '../branches/branches.module.js';
import { CouponsModule } from '../coupons/coupons.module.js';
import { NotificationsModule } from '../notifications/notifications.module.js';

@Module({
  imports: [
    BranchesModule,
    CouponsModule,
    NotificationsModule,
    MongooseModule.forFeature([
      { name: Order.name, schema: OrderSchema },
      { name: Product.name, schema: ProductSchema },
      { name: Branch.name, schema: BranchSchema },
      { name: BranchInventory.name, schema: BranchInventorySchema },
    ]),
  ],
  controllers: [OrdersController],
  providers: [OrdersService],
})
export class OrdersModule {}
