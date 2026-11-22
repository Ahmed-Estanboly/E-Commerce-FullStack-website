import { Prop, Schema as NestSchema, SchemaFactory } from '@nestjs/mongoose';
import { Types } from 'mongoose';
import type { HydratedDocument } from 'mongoose';
import { Branch } from './branch.schema.js';

@NestSchema({ timestamps: true })
export class BranchInventory {
  @Prop({ type: Types.ObjectId, ref: Branch.name, required: true })
  branch: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Product', required: true })
  product: Types.ObjectId;

  @Prop({ required: true, min: 0, default: 0 })
  quantity: number;
}

export type BranchInventoryDocument = HydratedDocument<BranchInventory>;
export const BranchInventorySchema = SchemaFactory.createForClass(BranchInventory);
BranchInventorySchema.index({ branch: 1, product: 1 }, { unique: true });
