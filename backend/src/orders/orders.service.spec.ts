import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { getConnectionToken, getModelToken } from '@nestjs/mongoose';
import { Test, TestingModule } from '@nestjs/testing';
import { Branch } from '../branches/schemas/branch.schema.js';
import { BranchInventory } from '../branches/schemas/branch-inventory.schema.js';
import { Product } from '../products/schemas/products.schema.js';
import { CouponsService } from '../coupons/coupons.service.js';
import { NotificationsService } from '../notifications/notifications.service.js';
import { Order } from './schemas/order.schema.js';
import { OrdersService } from './orders.service.js';

describe('OrdersService branch inventory', () => {
  const branch = {
    _id: 'branch-id',
    name: 'Latakia Central',
    address: 'Latakia',
    phone: '+963 41 000 000',
    isActive: true,
  };
  const product = {
    _id: 'product-id',
    id: 21,
    title: 'Demo product',
    price: 25,
    stock: 100,
  };
  const order = { orderNumber: 'NOVA-1234-test' };
  const branchModel = { findById: vi.fn() };
  const productModel = { find: vi.fn() };
  const branchInventoryModel = { findOneAndUpdate: vi.fn() };
  const orderModel = { create: vi.fn(), findById: vi.fn(), findByIdAndUpdate: vi.fn() };
  const session = {
    withTransaction: vi.fn(async (work: () => Promise<void>) => work()),
    endSession: vi.fn(),
  };
  const connection = { startSession: vi.fn(async () => session) };
  let service: OrdersService;

  const dto = {
    email: 'buyer@example.com',
    phone: '555-0100',
    customerName: 'Demo Buyer',
    items: [{ productId: 21, title: 'Client title', price: 1, quantity: 2 }],
    shippingFee: 0,
    fulfilment: 'collect' as const,
    branch: { branchId: 'branch-id' },
    paymentMethod: 'card' as const,
  };

  beforeEach(async () => {
    vi.clearAllMocks();
    branchModel.findById.mockReturnValue({
      session: () => ({ exec: async () => branch }),
    });
    productModel.find.mockReturnValue({
      session: () => ({ exec: async () => [product] }),
    });
    branchInventoryModel.findOneAndUpdate.mockReturnValue({
      exec: async () => ({ quantity: 8 }),
    });
    orderModel.create.mockResolvedValue([order]);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrdersService,
        { provide: getModelToken(Order.name), useValue: orderModel },
        { provide: getModelToken(Product.name), useValue: productModel },
        { provide: getModelToken(Branch.name), useValue: branchModel },
        { provide: getModelToken(BranchInventory.name), useValue: branchInventoryModel },
        { provide: getConnectionToken(), useValue: connection },
        { provide: CouponsService, useValue: { applyForOrder: vi.fn() } },
        { provide: NotificationsService, useValue: { create: vi.fn().mockResolvedValue({}) } },
      ],
    }).compile();
    service = module.get(OrdersService);
  });

  it('creates an order and decrements stock for that branch transactionally', async () => {
    await expect(service.create(dto)).resolves.toBe(order);

    expect(session.withTransaction).toHaveBeenCalledOnce();
    expect(branchInventoryModel.findOneAndUpdate).toHaveBeenCalledWith(
      {
        branch: branch._id,
        product: product._id,
        quantity: { $gte: 2 },
      },
      { $inc: { quantity: -2 } },
      expect.objectContaining({ new: true, session }),
    );
    expect(orderModel.create).toHaveBeenCalledWith(
      [expect.objectContaining({ total: 50, branch: expect.objectContaining({ name: branch.name }) })],
      { session },
    );
    expect(session.endSession).toHaveBeenCalledOnce();
  });

  it('rejects inactive branches before changing inventory', async () => {
    branchModel.findById.mockReturnValue({
      session: () => ({ exec: async () => ({ ...branch, isActive: false }) }),
    });

    await expect(service.create(dto)).rejects.toThrow(BadRequestException);
    expect(branchInventoryModel.findOneAndUpdate).not.toHaveBeenCalled();
    expect(orderModel.create).not.toHaveBeenCalled();
  });

  it('rejects unavailable branch inventory and does not create an order', async () => {
    branchInventoryModel.findOneAndUpdate.mockReturnValue({
      exec: async () => null,
    });

    await expect(service.create(dto)).rejects.toThrow(BadRequestException);
    expect(orderModel.create).not.toHaveBeenCalled();
  });

  it('aggregates duplicate product requests before reserving stock', async () => {
    const duplicateItems = {
      ...dto,
      items: [
        { ...dto.items[0], quantity: 2 },
        { ...dto.items[0], quantity: 3 },
      ],
    };

    await service.create(duplicateItems);

    expect(branchInventoryModel.findOneAndUpdate).toHaveBeenCalledOnce();
    expect(branchInventoryModel.findOneAndUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ quantity: { $gte: 5 } }),
      { $inc: { quantity: -5 } },
      expect.objectContaining({ session }),
    );
  });
});

describe('OrdersService status lifecycle', () => {
  const branchId = '507f1f77bcf86cd799439011';
  const existingOrder = {
    _id: '507f1f77bcf86cd799439012',
    status: 'confirmed',
    branch: { _id: branchId, name: 'Latakia Central' },
    items: [{ productId: 21, title: 'Demo product', price: 25, quantity: 2 }],
    toObject() {
      return { ...this, status: 'preparing' };
    },
  };
  const orderModel = { findById: vi.fn(), findByIdAndUpdate: vi.fn() };
  const productModel = { find: vi.fn() };
  const branchInventoryModel = { findOneAndUpdate: vi.fn() };
  const session = {
    withTransaction: vi.fn(async (work: () => Promise<void>) => work()),
    endSession: vi.fn(),
  };
  const connection = { startSession: vi.fn(async () => session) };
  let service: OrdersService;

  const adminActor = { id: 1, role: 'master admin', label: 'master admin:1' };

  beforeEach(async () => {
    vi.clearAllMocks();
    orderModel.findById.mockReturnValue({ exec: async () => existingOrder });
    orderModel.findByIdAndUpdate.mockReturnValue({
      exec: async () => ({ toObject: () => ({ _id: existingOrder._id, status: 'preparing' }) }),
    });

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrdersService,
        { provide: getModelToken(Order.name), useValue: orderModel },
        { provide: getModelToken(Product.name), useValue: productModel },
        { provide: getModelToken(Branch.name), useValue: {} },
        { provide: getModelToken(BranchInventory.name), useValue: branchInventoryModel },
        { provide: getConnectionToken(), useValue: connection },
        { provide: CouponsService, useValue: { applyForOrder: vi.fn() } },
        { provide: NotificationsService, useValue: { create: vi.fn().mockResolvedValue({}) } },
      ],
    }).compile();
    service = module.get(OrdersService);
  });

  it('moves an order to an allowed next status and records history', async () => {
    const result = await service.updateStatus(
      existingOrder._id,
      { status: 'preparing' },
      adminActor,
    );

    expect(result.status).toBe('preparing');
    expect(orderModel.findByIdAndUpdate).toHaveBeenCalledWith(
      existingOrder._id,
      expect.objectContaining({
        $set: { status: 'preparing' },
        $push: expect.objectContaining({
          statusHistory: expect.objectContaining({ status: 'preparing' }),
        }),
      }),
      expect.objectContaining({ new: true, session }),
    );
  });

  it('rejects illegal transitions', async () => {
    await expect(
      service.updateStatus(existingOrder._id, { status: 'delivered' }, adminActor),
    ).rejects.toThrow(BadRequestException);
    expect(orderModel.findByIdAndUpdate).not.toHaveBeenCalled();
  });

  it('rejects updates from branch owners of another branch', async () => {
    await expect(
      service.updateStatus(existingOrder._id, { status: 'preparing' }, {
        id: 9,
        role: 'branch owner',
        branchId: 'different-branch',
      }),
    ).rejects.toThrow(ForbiddenException);
  });

  it('restocks branch inventory when an order is cancelled', async () => {
    productModel.find.mockReturnValue({
      select: () => ({ session: () => ({ exec: async () => [{ _id: 'product-object-id', id: 21 }] }) }),
    });
    branchInventoryModel.findOneAndUpdate.mockReturnValue({ exec: async () => ({}) });

    await service.updateStatus(existingOrder._id, { status: 'cancelled' }, adminActor);

    // confirmed -> cancelled is allowed; restock happens inside the transaction
    expect(branchInventoryModel.findOneAndUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ product: 'product-object-id' }),
      { $inc: { quantity: 2 } },
      expect.objectContaining({ upsert: true, session }),
    );
  });

  it('returns 404-style NotFound for missing orders', async () => {
    orderModel.findById.mockReturnValue({ exec: async () => null });
    await expect(
      service.updateStatus('507f1f77bcf86cd799439099', { status: 'preparing' }, adminActor),
    ).rejects.toThrow(NotFoundException);
  });
});
