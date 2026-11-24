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
import { CouponsService } from '../coupons/coupons.service.js';
import { NotificationsService } from '../notifications/notifications.service.js';

export interface OrderActor {
  id?: number;
  role?: string;
  branchId?: string;
  label?: string;
}

const ADMIN_ROLE = 'master admin';
const BRANCH_OWNER_ROLES = ['branch owner', 'central owner', 'south owner'];
const DELIVERY_SHIPPING_FEE = 6.5;

@Injectable()
export class OrdersService {
  constructor(
    @InjectModel(Order.name) private readonly orderModel: Model<OrderDocument>,
    @InjectModel(Product.name) private readonly productModel: Model<ProductDocument>,
    @InjectModel(Branch.name) private readonly branchModel: Model<BranchDocument>,
    @InjectModel(BranchInventory.name)
    private readonly branchInventoryModel: Model<BranchInventoryDocument>,
    @InjectConnection() private readonly connection: Connection,
    private readonly couponsService: CouponsService,
    private readonly notificationsService: NotificationsService,
  ) {}

  async create(createOrderDto: CreateOrderDto, userId?: number) {
    if (!createOrderDto.items.length) {
      throw new BadRequestException('An order must contain at least one item.');
    }
    const fallbackBranchId =
      createOrderDto.branch?.branchId ?? createOrderDto.branches?.[0]?.branchId;
    if (!fallbackBranchId) {
      const hasLineBranch = createOrderDto.items.some((item) => Boolean(item.branchId));
      if (!hasLineBranch) {
        throw new BadRequestException('At least one branch must be provided.');
      }
    }

    const branchItems = new Map<string, typeof createOrderDto.items>();
    for (const item of createOrderDto.items) {
      const branchId = item.branchId ?? fallbackBranchId;
      if (!branchId) {
        throw new BadRequestException(`A branch is required for product ${item.productId}.`);
      }
      branchItems.set(branchId, [...(branchItems.get(branchId) ?? []), item]);
    }

    const session = await this.connection.startSession();
    try {
      let createdOrder: OrderDocument | undefined;
      await session.withTransaction(async () => {
        const allProductIds = Array.from(new Set(createOrderDto.items.map((item) => item.productId)));
        const products = await this.productModel
          .find({ id: { $in: allProductIds } })
          .session(session)
          .exec();
        const productsById = new Map(products.map((product) => [product.id, product]));
        const branchSnapshots: Array<{
          _id: string;
          name: string;
          address: string;
          phone: string;
          workingHours?: string;
          isActive?: boolean;
        }> = [];

        for (const [branchId, branchItemsForBranch] of branchItems) {
          const branch = await this.branchModel.findById(branchId).session(session).exec();
          if (!branch || !branch.isActive) {
            throw new BadRequestException('One or more selected branches are not active.');
          }
          branchSnapshots.push({
            _id: branch._id.toString(),
            name: branch.name,
            address: branch.address,
            phone: branch.phone,
            workingHours: branch.workingHours,
            isActive: branch.isActive,
          });

          const requestedQuantities = new Map<number, number>();
          for (const item of branchItemsForBranch) {
            requestedQuantities.set(
              item.productId,
              (requestedQuantities.get(item.productId) ?? 0) + item.quantity,
            );
          }

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
                `Product "${product.title}" is unavailable or has insufficient stock at ${branch.name}.`,
              );
            }
          }
        }

        const orderItems = createOrderDto.items.map((item) => {
          const product = productsById.get(item.productId)!;
          const itemBranchId = item.branchId ?? fallbackBranchId!;
          const branchSnapshot = branchSnapshots.find((branch) => branch._id === itemBranchId);
          return {
            productId: product.id,
            title: product.title,
            price: product.price,
            quantity: item.quantity,
            branchId: itemBranchId,
            branchName: item.branchName ?? branchSnapshot?.name,
          };
        });
        const subtotal = orderItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
        const shippingFee =
          createOrderDto.fulfilment === 'deliver' ? DELIVERY_SHIPPING_FEE : 0;

        let discount = 0;
        let couponCode: string | undefined;
        if (createOrderDto.couponCode) {
          const coupon = await this.couponsService.applyForOrder(
            createOrderDto.couponCode,
            subtotal,
          );
          discount = coupon.discount;
          couponCode = coupon.code;
        }

        const branchSnapshot = branchSnapshots[0];
        if (!branchSnapshot) {
          throw new BadRequestException('At least one active branch is required.');
        }

        const orderData = {
          orderNumber: '',
          userId,
          email: createOrderDto.email.toLowerCase(),
          phone: createOrderDto.phone,
          customerName: createOrderDto.customerName,
          items: orderItems,
          subtotal,
          shippingFee,
          total: Math.max(0, subtotal + shippingFee - discount),
          discount,
          couponCode,
          fulfilment: createOrderDto.fulfilment,
          branch: branchSnapshot,
          branches: branchSnapshots,
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
      this.orderModel.find({
        $or: [
          { 'branch._id': branchId },
          { 'branches._id': branchId },
          { 'items.branchId': branchId },
        ],
      }).sort({ createdAt: -1 }),
      query,
    );
  }

  async findMine(
    userId: number,
    email?: string,
    query: PaginationQueryDto = {},
  ): Promise<Order[] | PaginatedResult<Order>> {
    const filter = email
      ? { $or: [{ userId }, { email: email.toLowerCase() }] }
      : { userId };
    return this.paginatedFind(
      this.orderModel.find(filter).sort({ createdAt: -1 }),
      query,
    );
  }

  async findOne(id: string): Promise<(Order & { allowedTransitions: OrderStatus[] }) | null> {
    if (!isValidObjectId(id)) {
      return null;
    }
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
      const updated = this.withTransitions(result.order.toObject());
      if (typeof order.userId === 'number' && next !== 'cancelled') {
        void this.notificationsService
          .create({
            userId: order.userId,
            type: 'order_status',
            title: `Order ${order.orderNumber} is now ${next}`,
            body: `Your order at ${order.branch?.name ?? 'the store'} moved to "${next}".`,
            link: `/account/orders/${order._id.toString()}`,
            meta: { orderId: order._id.toString(), status: next },
          })
          .catch(() => undefined);
      }
      return updated;
    } finally {
      await session.endSession();
    }
  }

  private assertCanManage(actor: OrderActor, order: OrderDocument) {
    if (actor.role === ADMIN_ROLE) return;
    if (BRANCH_OWNER_ROLES.includes(actor.role ?? '') && actor.branchId) {
      const orderBranchIds = new Set([
        order.branch?._id,
        ...(order.branches?.map((branch) => branch._id) ?? []),
        ...order.items.map((item) => item.branchId).filter((branchId): branchId is string => Boolean(branchId)),
      ]);
      if (orderBranchIds.has(actor.branchId)) return;
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
    for (const item of order.items) {
      const productObjectId = objectIdByProductId.get(item.productId);
      if (!productObjectId) continue;
      const itemBranchId = item.branchId ?? order.branches?.[0]?._id ?? order.branch._id;
      if (!itemBranchId) continue;
      const branchObjectId = new Types.ObjectId(itemBranchId);
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

  /** CSV export of all orders (admin reporting). */
  async exportCsv(): Promise<string> {
    const orders = await this.orderModel.find().sort({ createdAt: -1 }).lean().exec();
    const escape = (value: unknown) => `"${String(value ?? '').replaceAll('"', '""')}"`;
    const header = [
      'orderNumber', 'createdAt', 'customerName', 'email', 'phone',
      'branch', 'fulfilment', 'status', 'subtotal', 'shippingFee', 'discount', 'total', 'paymentMethod', 'couponCode',
    ];
    const rows = orders.map((order) => {
      const createdAt = (order as { createdAt?: Date | string }).createdAt;
      return [
        order.orderNumber,
        createdAt instanceof Date ? createdAt.toISOString() : createdAt,
        order.customerName,
        order.email,
        order.phone,
        order.branch?.name,
        order.fulfilment,
        order.status,
        order.subtotal,
        order.shippingFee,
        order.discount ?? 0,
        order.total,
        order.paymentMethod,
        order.couponCode,
      ]
        .map(escape)
        .join(',');
    });
    return [header.join(','), ...rows].join('\n');
  }

  private async createWithUniqueOrderNumber(orderData: Record<string, unknown>, session: ClientSession) {
    const orderNumber = `NOVA-${randomUUID().replaceAll('-', '').slice(0, 12).toUpperCase()}`;
    const [created] = await this.orderModel.create([{ ...orderData, orderNumber }], { session });
    return created;
  }
}
