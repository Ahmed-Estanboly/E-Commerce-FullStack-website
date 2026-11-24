import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectConnection, InjectModel } from '@nestjs/mongoose';
import type { Connection, Model } from 'mongoose';
import { Product, ProductDocument } from '../products/schemas/products.schema.js';
import { WishlistItem, WishlistItemDocument } from './schemas/wishlist.schema.js';
import { withCategory } from '../common/with-category.js';

@Injectable()
export class WishlistService {
  constructor(
    @InjectModel(WishlistItem.name) private readonly wishlistModel: Model<WishlistItemDocument>,
    @InjectModel(Product.name) private readonly productModel: Model<ProductDocument>,
    @InjectConnection() private readonly connection: Connection,
  ) {}

  async list(userId: number) {
    const items = await this.wishlistModel.find({ userId }).sort({ createdAt: -1 }).lean().exec();
    const productIds = items.map((item) => item.productId);
    const products = productIds.length
      ? await this.productModel.find({ id: { $in: productIds } }).lean().exec()
      : [];
    const hydrated = await withCategory(
      this.connection,
      products,
    );
    const byId = new Map(hydrated.map((product) => [product.id, product]));
    return items
      .map((item) => Object.assign({}, item, { product: byId.get(item.productId) ?? null }))
      .filter((item) => item.product !== null);
  }

  async ids(userId: number): Promise<number[]> {
    const items = await this.wishlistModel.find({ userId }).select('productId').lean().exec();
    return items.map((item) => item.productId);
  }

  async add(userId: number, productId: number) {
    const product = await this.productModel.exists({ id: productId }).exec();
    if (!product) throw new NotFoundException('Product not found');
    await this.wishlistModel.updateOne(
      { userId, productId },
      { $setOnInsert: { userId, productId } },
      { upsert: true },
    ).exec();
    return { productId, saved: true };
  }

  async remove(userId: number, productId: number) {
    await this.wishlistModel.deleteOne({ userId, productId }).exec();
    return { productId, saved: false };
  }
}
