import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import type { HydratedDocument } from 'mongoose';

export const ORDER_STATUSES = [
  'pending',
  'confirmed',
  'preparing',
  'ready',
  'shipped',
  'delivered',
  'cancelled',
] as const;
export type OrderStatus = (typeof ORDER_STATUSES)[number];

/** Allowed forward transitions; cancelled and delivered are terminal. */
export const ORDER_STATUS_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  pending: ['confirmed', 'cancelled'],
  confirmed: ['preparing', 'ready', 'cancelled'],
  preparing: ['ready', 'cancelled'],
  ready: ['shipped', 'delivered'],
  shipped: ['delivered'],
  delivered: [],
  cancelled: [],
};

@Schema({ timestamps: true })
export class OrderStatusHistoryEntry {
  @Prop({ required: true, type: String, enum: ORDER_STATUSES })
  status: OrderStatus;

  @Prop({ required: true, type: Date, default: Date.now })
  at: Date;

  @Prop()
  by?: string;

  @Prop()
  note?: string;
}

export const OrderStatusHistorySchema = SchemaFactory.createForClass(OrderStatusHistoryEntry);

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
        branchId: { type: String },
        branchName: { type: String },
      },
    ],
    required: true,
  })
  items: {
    productId: number;
    title: string;
    price: number;
    quantity: number;
    branchId?: string;
    branchName?: string;
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

  @Prop({
    type: [
      {
        _id: String,
        name: String,
        address: String,
        phone: String,
        workingHours: String,
        isActive: Boolean,
      },
    ],
    default: [],
  })
  branches: {
    _id: string;
    name: string;
    address: string;
    phone: string;
    workingHours?: string;
    isActive?: boolean;
  }[];

  @Prop()
  deliveryAddress?: string;

  @Prop({ required: true, enum: ['card', 'apple_pay', 'bancontact'] })
  paymentMethod: string;

  @Prop()
  cardLast4?: string;

  @Prop({ default: 'confirmed', type: String, enum: ORDER_STATUSES })
  status: OrderStatus;

  @Prop({ type: [OrderStatusHistorySchema], default: [] })
  statusHistory: OrderStatusHistoryEntry[];

  @Prop()
  couponCode?: string;

  @Prop({ default: 0, min: 0 })
  discount: number;
}

export type OrderDocument = HydratedDocument<Order>;
export const OrderSchema = SchemaFactory.createForClass(Order);
