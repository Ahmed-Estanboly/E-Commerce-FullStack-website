import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import type { HydratedDocument } from 'mongoose';

@Schema({ timestamps: true })
export class Order {
  @Prop({ required: true, unique: true })
  orderNumber: string;

  @Prop()
  userId?: number;

  @Prop({ required: true })
  email: string;

  @Prop({ required: true })
  phone: string;

  @Prop({ required: true })
  customerName: string;

  @Prop({
    type: [
      {
        productId: { type: Number, required: true },
        title: { type: String, required: true },
        price: { type: Number, required: true },
        quantity: { type: Number, required: true },
      },
    ],
    required: true,
  })
  items: {
    productId: number;
    title: string;
    price: number;
    quantity: number;
  }[];

  @Prop({ required: true })
  subtotal: number;

  @Prop({ required: true, default: 0 })
  shippingFee: number;

  @Prop({ required: true })
  total: number;

  @Prop({ required: true, enum: ['collect', 'deliver'] })
  fulfilment: string;

  @Prop({
    type: {
      _id: String,
      name: String,
      address: String,
      phone: String,
      workingHours: String,
      isActive: Boolean,
    },
    required: true,
  })
  branch: {
    _id: string;
    name: string;
    address: string;
    phone: string;
    workingHours?: string;
    isActive?: boolean;
  };

  @Prop()
  deliveryAddress?: string;

  @Prop({ required: true, enum: ['card', 'apple_pay', 'bancontact'] })
  paymentMethod: string;

  @Prop()
  cardLast4?: string;

  @Prop({ default: 'pending', enum: ['pending', 'confirmed', 'delivered', 'cancelled'] })
  status: string;
}

export type OrderDocument = HydratedDocument<Order>;
export const OrderSchema = SchemaFactory.createForClass(Order);
