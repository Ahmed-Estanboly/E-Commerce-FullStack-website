import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectConnection, InjectModel } from '@nestjs/mongoose';
import { randomUUID } from 'node:crypto';
import type { ClientSession, Connection, Model } from 'mongoose';
import { Product, ProductDocument } from '../products/schemas/products.schema.js';
import { CreateOrderDto } from './dto/create-order.dto.js';
import { Order, OrderDocument } from './schemas/order.schema.js';
import { Branch, BranchDocument } from '../branches/schemas/branch.schema.js';
import { BranchInventory, BranchInventoryDocument } from '../branches/schemas/branch-inventory.schema.js';

@Injectable()
export class OrdersService {
  constructor(
    @InjectModel(Order.name) private readonly orderModel: Model<OrderDocument>,
    @InjectModel(Product.name) private readonly productModel: Model<ProductDocument>,
    @InjectModel(Branch.name) private readonly branchModel: Model<BranchDocument>,
    @InjectModel(BranchInventory.name)
    private readonly branchInventoryModel: Model<BranchInventoryDocument>,
    @InjectConnection() private readonly connection: Connection,
  ) {}

  async create(createOrderDto: CreateOrderDto, userId?: number) {
    if (!createOrderDto.items.length) {
      throw new BadRequestException('An order must contain at least one item.');
    }

    const requestedQuantities = new Map<number, number>();
    for (const item of createOrderDto.items) {
      requestedQuantities.set(
        item.productId,
        (requestedQuantities.get(item.productId) ?? 0) + item.quantity,
      );
    }

    const session = await this.connection.startSession();
    try {
      let createdOrder: OrderDocument | undefined;
      await session.withTransaction(async () => {
        const branch = await this.branchModel
          .findById(createOrderDto.branch.branchId)
          .session(session)
          .exec();
        if (!branch || !branch.isActive) {
          throw new BadRequestException('The selected branch is not active.');
        }

        const products = await this.productModel
          .find({ id: { $in: Array.from(requestedQuantities.keys()) } })
          .session(session)
          .exec();
        const productsById = new Map(products.map((product) => [product.id, product]));

        for (const [productId, quantity] of requestedQuantities) {
          const product = productsById.get(productId);
          if (!product) {
            throw new BadRequestException(`Product ${productId} was not found.`);
          }

          const reservation = await this.branchInventoryModel.findOneAndUpdate(
            {
              branch: branch._id,
              product: product._id,
              quantity: { $gte: quantity },
            },
            { $inc: { quantity: -quantity } },
            { new: true, session },
          ).exec();
          if (!reservation) {
            throw new BadRequestException(
              `Product "${product.title}" is unavailable or has insufficient stock at this branch.`,
            );
          }
        }

        const orderItems = createOrderDto.items.map((item) => {
          const product = productsById.get(item.productId)!;
          return {
            productId: product.id,
            title: product.title,
            price: product.price,
            quantity: item.quantity,
          };
        });
        const subtotal = orderItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
        const branchSnapshot = {
          _id: branch._id.toString(),
          name: branch.name,
          address: branch.address,
          phone: branch.phone,
          workingHours: branch.workingHours,
          isActive: branch.isActive,
        };

        const orderData = {
          orderNumber: '',
          userId,
          email: createOrderDto.email.toLowerCase(),
          phone: createOrderDto.phone,
          customerName: createOrderDto.customerName,
          items: orderItems,
          subtotal,
          shippingFee: createOrderDto.shippingFee,
          total: subtotal + createOrderDto.shippingFee,
          fulfilment: createOrderDto.fulfilment,
          branch: branchSnapshot,
          deliveryAddress: createOrderDto.deliveryAddress,
          paymentMethod: createOrderDto.paymentMethod,
          cardLast4: createOrderDto.cardLast4,
          status: 'confirmed',
        };

        createdOrder = await this.createWithUniqueOrderNumber(orderData, session);
      });

      if (!createdOrder) {
        throw new Error('Order transaction completed without creating an order.');
      }
      return createdOrder;
    } finally {
      await session.endSession();
    }
  }

  async findAll(): Promise<Order[]> {
    return this.orderModel.find().sort({ createdAt: -1 }).lean().exec();
  }

  async findByBranch(branchId: string): Promise<Order[]> {
    return this.orderModel
      .find({ 'branch._id': branchId })
      .sort({ createdAt: -1 })
      .lean()
      .exec();
  }

  async findMine(userId: number): Promise<Order[]> {
    return this.orderModel
      .find({ userId })
      .sort({ createdAt: -1 })
      .lean()
      .exec();
  }

  async findOne(id: string): Promise<Order | null> {
    return this.orderModel.findById(id).lean().exec();
  }

  private async createWithUniqueOrderNumber(orderData: Record<string, unknown>, session: ClientSession) {
    const orderNumber = `NOVA-${randomUUID().replaceAll('-', '').slice(0, 12).toUpperCase()}`;
    const [created] = await this.orderModel.create([{ ...orderData, orderNumber }], { session });
    return created;
  }
}
