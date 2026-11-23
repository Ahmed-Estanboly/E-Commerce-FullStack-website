import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectConnection, InjectModel } from '@nestjs/mongoose';
import { randomUUID } from 'node:crypto';
import { isValidObjectId, type ClientSession, type Connection, type Model, Types } from 'mongoose';
import { Product, ProductDocument } from '../products/schemas/products.schema.js';
import { CreateOrderDto } from './dto/create-order.dto.js';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto.js';
import {
  Order,
  OrderDocument,
  ORDER_STATUS_TRANSITIONS,
  type OrderStatus,
} from './schemas/order.schema.js';
import { Branch, BranchDocument } from '../branches/schemas/branch.schema.js';
import { BranchInventory, BranchInventoryDocument } from '../branches/schemas/branch-inventory.schema.js';
import {
  resolvePagination,
  toPaginatedResult,
  type PaginatedResult,
  type PaginationQueryDto,
} from '../common/dto/pagination.dto.js';

export interface OrderActor {
  id?: number;
  role?: string;
  branchId?: string;
  label?: string;
}

const ADMIN_ROLE = 'master admin';
const BRANCH_OWNER_ROLES = ['branch owner', 'central owner', 'south owner'];

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
          status: 'confirmed' as OrderStatus,
          statusHistory: [
            {
              status: 'confirmed' as OrderStatus,
              at: new Date(),
              by: userId ? `user:${userId}` : 'guest',
              note: 'Order placed',
            },
          ],
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

  async findAll(query: PaginationQueryDto = {}): Promise<Order[] | PaginatedResult<Order>> {
    return this.paginatedFind(this.orderModel.find().sort({ createdAt: -1 }), query);
  }

  async findByBranch(branchId: string, query: PaginationQueryDto = {}): Promise<Order[] | PaginatedResult<Order>> {
    if (!isValidObjectId(branchId)) {
      throw new NotFoundException('Branch not found');
    }
    return this.paginatedFind(
      this.orderModel.find({ 'branch._id': branchId }).sort({ createdAt: -1 }),
      query,
    );
  }

  async findMine(userId: number, query: PaginationQueryDto = {}): Promise<Order[] | PaginatedResult<Order>> {
    return this.paginatedFind(
      this.orderModel.find({ userId }).sort({ createdAt: -1 }),
      query,
    );
  }

  async findOne(id: string): Promise<(Order & { allowedTransitions: OrderStatus[] }) | null> {
    const order = await this.orderModel.findById(id).lean().exec();
    return order ? this.withTransitions(order) : null;
  }

  /** Order lookup for the customer who placed it (JWT `sub` must match `userId`). */
  async findOneForCustomer(
    id: string,
    userId: number,
  ): Promise<(Order & { allowedTransitions: OrderStatus[] }) | null> {
    if (!isValidObjectId(id)) {
      throw new NotFoundException('Order not found');
    }
    const order = await this.orderModel.findOne({ _id: id, userId }).lean().exec();
    return order ? this.withTransitions(order) : null;
  }

  /**
   * Moves an order to a new status, recording history. Cancelling returns the
   * reserved branch stock. Branch owners may only update orders belonging to
   * their own branch; master admin may update any order.
   */
  async updateStatus(id: string, dto: UpdateOrderStatusDto, actor: OrderActor) {
    if (!isValidObjectId(id)) {
      throw new NotFoundException('Order not found');
    }
    const order = await this.orderModel.findById(id).exec();
    if (!order) {
      throw new NotFoundException('Order not found');
    }

    this.assertCanManage(actor, order);

    const current = order.status as OrderStatus;
    const next = dto.status;
    if (next === current) {
      throw new BadRequestException(`Order is already ${next}.`);
    }
    const allowed = ORDER_STATUS_TRANSITIONS[current] ?? [];
    if (!allowed.includes(next)) {
      throw new BadRequestException(
        `Cannot move an order from "${current}" to "${next}".`,
      );
    }

    const session = await this.connection.startSession();
    try {
      const result: { order?: OrderDocument | null } = {};
      await session.withTransaction(async () => {
        if (next === 'cancelled') {
          await this.restockOrderItems(order, session);
        }
        result.order = await this.orderModel.findByIdAndUpdate(
          order._id,
          {
            $set: { status: next },
            $push: {
              statusHistory: {
                status: next,
                at: new Date(),
                by: actor.label ?? (actor.id ? `user:${actor.id}` : actor.role ?? 'system'),
                ...(dto.note ? { note: dto.note } : {}),
              },
            },
          },
          { new: true, session },
        ).exec();
      });
      if (!result.order) {
        throw new NotFoundException('Order not found');
      }
      return this.withTransitions(result.order.toObject());
    } finally {
      await session.endSession();
    }
  }

  private assertCanManage(actor: OrderActor, order: OrderDocument) {
    if (actor.role === ADMIN_ROLE) return;
    if (BRANCH_OWNER_ROLES.includes(actor.role ?? '') && actor.branchId) {
      const orderBranchId = order.branch?._id;
      if (orderBranchId && orderBranchId === actor.branchId) return;
    }
    throw new ForbiddenException('You can only update orders for your own branch.');
  }

  /** Returns reserved stock to the order's branch when an order is cancelled. */
  private async restockOrderItems(order: OrderDocument, session: ClientSession) {
    const productIds = order.items.map((item) => item.productId);
    const products = await this.productModel
      .find({ id: { $in: productIds } })
      .select('_id id')
      .session(session)
      .exec();
    const objectIdByProductId = new Map(products.map((product) => [product.id, product._id]));
    const branchObjectId = new Types.ObjectId(order.branch._id);

    for (const item of order.items) {
      const productObjectId = objectIdByProductId.get(item.productId);
      if (!productObjectId) continue;
      await this.branchInventoryModel.findOneAndUpdate(
        { branch: branchObjectId, product: productObjectId },
        { $inc: { quantity: item.quantity } },
        { upsert: true, session, setDefaultsOnInsert: true },
      ).exec();
    }
  }

  private withTransitions<T extends { status: string }>(order: T) {
    return {
      ...order,
      allowedTransitions: ORDER_STATUS_TRANSITIONS[order.status as OrderStatus] ?? [],
    };
  }

  private async paginatedFind(
    query: ReturnType<Model<OrderDocument>['find']>,
    pagination: PaginationQueryDto,
  ): Promise<Order[] | PaginatedResult<Order>> {
    const params = resolvePagination(pagination);
    if (!params) {
      return query.lean().exec();
    }
    const [items, total] = await Promise.all([
      query.clone().skip(params.skip).limit(params.limit).lean().exec(),
      this.orderModel.countDocuments(query.getFilter()).exec(),
    ]);
    return toPaginatedResult(items as Order[], total, params);
  }

  private async createWithUniqueOrderNumber(orderData: Record<string, unknown>, session: ClientSession) {
    const orderNumber = `NOVA-${randomUUID().replaceAll('-', '').slice(0, 12).toUpperCase()}`;
    const [created] = await this.orderModel.create([{ ...orderData, orderNumber }], { session });
    return created;
  }
}
