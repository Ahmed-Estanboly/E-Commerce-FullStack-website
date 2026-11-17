import { Prop, Schema as NestSchema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

@NestSchema({ timestamps: true })
export class Branch {
  @Prop({ required: true, unique: true, trim: true })
  name: string;

  @Prop({ required: true, trim: true })
  address: string;

  @Prop({ required: true, trim: true })
  phone: string;

  @Prop({ default: '09:00 AM - 11:00 PM' })
  workingHours: string;

  @Prop({ default: true })
  isActive: boolean;
}

export type BranchDocument = HydratedDocument<Branch>;
export const BranchSchema = SchemaFactory.createForClass(Branch);
