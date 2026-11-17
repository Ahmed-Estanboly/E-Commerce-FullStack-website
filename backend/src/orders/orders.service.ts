import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Product, ProductDocument } from '../products/schemas/products.schema.js';
import { CreateOrderDto } from './dto/create-order.dto.js';
import { Order, OrderDocument } from './schemas/order.schema.js';
import { BranchesService } from '../branches/branches.service.js';

@Injectable()
export class OrdersService {
  constructor(
    @InjectModel(Order.name) private readonly orderModel: Model<OrderDocument>,
    @InjectModel(Product.name) private readonly productModel: Model<ProductDocument>,
    private readonly branchesService: BranchesService,
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

    const products = await this.productModel
      .find({ id: { $in: Array.from(requestedQuantities.keys()) } })
      .exec();
    const productsById = new Map(products.map((product) => [product.id, product]));

    for (const [productId, quantity] of requestedQuantities) {
      const product = productsById.get(productId);
      if (!product) {
        throw new BadRequestException(`Product ${productId} was not found.`);
      }
      if ((product.stock ?? 0) < quantity) {
        throw new BadRequestException(`Product "${product.title}" has insufficient stock.`);
      }
    }

    for (const [productId, quantity] of requestedQuantities) {
      const updatedProduct = await this.productModel.findOneAndUpdate(
        { id: productId, stock: { $gte: quantity } },
        { $inc: { stock: -quantity } },
        { new: true },
      );
      if (!updatedProduct) {
        const product = productsById.get(productId);
        throw new BadRequestException(
          `Product "${product?.title ?? productId}" has insufficient stock.`,
        );
      }
    }

    const branch = await this.branchesService.findOne(createOrderDto.branch.branchId);
    if (!branch.isActive) {
      throw new BadRequestException('The selected branch is not active.');
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

    return this.createWithUniqueOrderNumber(orderData);
  }

  async findAll(): Promise<Order[]> {
    return this.orderModel.find().sort({ createdAt: -1 }).lean().exec();
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

  private async createWithUniqueOrderNumber(orderData: Record<string, unknown>) {
    for (let attempt = 0; attempt < 5; attempt += 1) {
      const orderNumber = `NOVA-${Math.floor(1000 + Math.random() * 9000)}`;
      try {
        return await this.orderModel.create({ ...orderData, orderNumber });
      } catch (error) {
        if (!this.isDuplicateKeyError(error) || attempt === 4) {
          throw error;
        }
      }
    }
    throw new Error('Unable to allocate an order number.');
  }

  private isDuplicateKeyError(error: unknown): boolean {
    return typeof error === 'object' && error !== null && 'code' in error && error.code === 11000;
  }
}
