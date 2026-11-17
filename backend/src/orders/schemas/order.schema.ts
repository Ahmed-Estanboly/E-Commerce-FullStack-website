import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

@Schema({ timestamps: true })
export class Order {
  @Prop({ required: true, unique: true })
  orderNumber: string;
  
  @Prop({ required: true })
  email: string;

  @Prop({ required: true })
  phone: string;

  @Prop({ required: true })
  customerName: string;

  @Prop({
    type: [
      {
        productId: { type: String, required: true },
        title: { type: String, required: true },
        price: { type: Number, required: true },
        quantity: { type: Number, required: true },
      },
    ],
    required: true,
  })
  items: {
    productId: string;
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
      id: Number,
      name: String,
      city: String,
    },
    required: true,
  })
  branch: {
    id: number;
    name: string;
    city: string;
  };

  @Prop()
  deliveryAddress?: string;

  @Prop({ required: true, enum: ['card', 'apple_pay', 'bancontact'] })
  paymentMethod: string;

  @Prop()
  cardLast4?: string;

  @Prop({ default: 'confirmed', enum: ['pending', 'confirmed', 'delivered', 'cancelled'] })
  status: string;
}

export type OrderDocument = HydratedDocument<Order>;
export const OrderSchema = SchemaFactory.createForClass(Order);