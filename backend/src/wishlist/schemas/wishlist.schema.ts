import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import type { HydratedDocument } from 'mongoose';

@Schema({ timestamps: true })
export class WishlistItem {
  @Prop({ required: true })
  userId: number;

  /** Numeric product id. */
  @Prop({ required: true })
  productId: number;
}

export type WishlistItemDocument = HydratedDocument<WishlistItem>;
export const WishlistItemSchema = SchemaFactory.createForClass(WishlistItem);
WishlistItemSchema.index({ userId: 1, productId: 1 }, { unique: true });
