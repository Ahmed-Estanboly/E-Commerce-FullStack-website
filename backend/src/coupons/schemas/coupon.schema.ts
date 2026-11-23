import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import type { HydratedDocument } from 'mongoose';

@Schema({ timestamps: true })
export class Coupon {
  @Prop({ required: true, unique: true, uppercase: true, trim: true })
  code: string;

  @Prop({ required: true, enum: ['percent', 'fixed'] })
  kind: 'percent' | 'fixed';

  @Prop({ required: true, min: 0 })
  value: number;

  @Prop({ min: 0, default: 0 })
  minSubtotal: number;

  @Prop()
  expiresAt?: Date;

  @Prop({ default: true })
  active: boolean;

  @Prop({ min: 0 })
  usageLimit?: number;

  @Prop({ default: 0, min: 0 })
  usedCount: number;
}

export type CouponDocument = HydratedDocument<Coupon>;
export const CouponSchema = SchemaFactory.createForClass(Coupon);
