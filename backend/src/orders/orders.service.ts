import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Product, ProductDocument } from '../products/schemas/products.schema.js';
import { CreateOrderDto } from './dto/create-order.dto.js';
import { Order, OrderDocument } from './schemas/order.schema.js';

@Injectable()
export class OrdersService {
  constructor(
    @InjectModel(Order.name) private readonly orderModel: Model<OrderDocument>,
    @InjectModel(Product.name) private readonly productModel: Model<ProductDocument>,
  ) {}

  async create(createOrderDto: CreateOrderDto) {
    // 1. Check stock and deduct quantities atomically for each item in the cart
    for (const item of createOrderDto.items) {
      const updatedProduct = await this.productModel.findOneAndUpdate(
        {
          _id: item.productId,
          stock: { $gte: item.quantity }, 
        },
        {
          $inc: { stock: -item.quantity },
        },
        { new: true },
      );

      if (!updatedProduct) {
        throw new BadRequestException(
          `Product "${item.title}" not found or insufficient stock.`,
        );
      }
    }

    // 2. Generate a unique order number in NOVA-XXXX format
    const orderNumber = `NOVA-${Math.floor(1000 + Math.random() * 9000)}`;

    const newOrderData = {
      ...createOrderDto,
      orderNumber,
    };

    // 3. Create and save the new order
    return await this.orderModel.create(newOrderData);
  }

  async findAll(): Promise<Order[]> {
    return this.orderModel.find().lean().exec();
  }

  async findOne(id: string): Promise<Order | null> {
    return this.orderModel.findById(id).lean().exec();
  }
}