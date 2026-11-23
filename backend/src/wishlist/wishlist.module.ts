import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { WishlistItem, WishlistItemSchema } from './schemas/wishlist.schema.js';
import { Product, ProductSchema } from '../products/schemas/products.schema.js';
import { WishlistService } from './wishlist.service.js';
import { WishlistController } from './wishlist.controller.js';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: WishlistItem.name, schema: WishlistItemSchema },
      { name: Product.name, schema: ProductSchema },
    ]),
  ],
  controllers: [WishlistController],
  providers: [WishlistService],
  exports: [WishlistService],
})
export class WishlistModule {}
