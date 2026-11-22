import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectConnection, InjectModel } from '@nestjs/mongoose';
import { randomUUID } from 'node:crypto';
import { isValidObjectId, Types } from 'mongoose';
import type { ClientSession, Connection, Model } from 'mongoose';
import { Product, ProductDocument } from '../products/schemas/products.schema.js';
import { CreateOrderDto } from './dto/create-order.dto.js';
import { Order, OrderDocument } from './schemas/order.schema.js';
import { OrderStatus } from './dto/update-order-status.dto.js';
import { Branch, BranchDocument } from '../branches/schemas/branch.schema.js';
import {
  BranchInventory,
  BranchInventoryDocument,
} from '../branches/schemas/branch-inventory.schema.js';

const DELIVERY_SHIPPING_FEE = 6.5;

export const ORDER_MANAGER_ROLES = [
  'master admin',
  'branch owner',
  'central owner',
  'south owner',
];

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
        const shippingFee =
          createOrderDto.fulfilment === 'deliver' ? DELIVERY_SHIPPING_FEE : 0;
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
          shippingFee,
          total: subtotal + shippingFee,
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

  async findMine(userId: number, email?: string): Promise<Order[]> {
    const filter: Record<string, unknown> = email
      ? { $or: [{ userId }, { email: email.toLowerCase() }] }
      : { userId };
    return this.orderModel
      .find(filter)
      .sort({ createdAt: -1 })
      .lean()
      .exec();
  }

  async findOne(id: string): Promise<Order | null> {
    if (!isValidObjectId(id)) {
      throw new NotFoundException('Order not found');
    }
    return this.orderModel.findById(id).lean().exec();
  }

  async updateStatus(
    id: string,
    status: OrderStatus,
    user: { role?: string; branchId?: string },
  ): Promise<Order> {
    if (!isValidObjectId(id)) {
      throw new NotFoundException('Order not found');
    }
    return this.runInTransaction(async (session) => {
      const order = await this.orderModel.findById(id).session(session).exec();
      if (!order) {
        throw new NotFoundException('Order not found');
      }
      if (user.role !== 'master admin' && order.branch?._id !== user.branchId) {
        throw new ForbiddenException('This order belongs to another branch.');
      }
      if (status === 'cancelled' && order.status !== 'cancelled') {
        await this.restoreBranchInventory(order, session);
      }
      order.status = status;
      await order.save({ session });
      return order.toObject();
    });
  }

  private async restoreBranchInventory(order: OrderDocument, session: ClientSession) {
    const productIds = order.items.map((item) => item.productId);
    const products = await this.productModel
      .find({ id: { $in: productIds } })
      .select('_id id')
      .session(session)
      .exec();
    const objectIdByProductId = new Map(products.map((product) => [product.id, product._id]));
    const branchId = new Types.ObjectId(order.branch._id);

    for (const item of order.items) {
      const productObjectId = objectIdByProductId.get(item.productId);
      if (!productObjectId) {
        continue;
      }
      await this.branchInventoryModel.updateOne(
        { branch: branchId, product: productObjectId },
        { $inc: { quantity: item.quantity } },
        { session },
      );
    }
  }

  private async createWithUniqueOrderNumber(
    orderData: Record<string, unknown>,
    session: ClientSession,
  ) {
    const orderNumber = `NOVA-${randomUUID().replaceAll('-', '').slice(0, 12).toUpperCase()}`;
    const [created] = await this.orderModel.create([{ ...orderData, orderNumber }], { session });
    return created;
  }

  private async runInTransaction<T>(fn: (session: ClientSession) => Promise<T>): Promise<T> {
    const session = await this.connection.startSession();
    try {
      let result!: T;
      await session.withTransaction(async () => {
        result = await fn(session);
      });
      return result;
    } finally {
      await session.endSession();
    }
  }
}
