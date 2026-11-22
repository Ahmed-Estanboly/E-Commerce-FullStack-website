import { BadRequestException } from '@nestjs/common';
import { getConnectionToken, getModelToken } from '@nestjs/mongoose';
import { Test, TestingModule } from '@nestjs/testing';
import { Branch } from '../branches/schemas/branch.schema.js';
import { BranchInventory } from '../branches/schemas/branch-inventory.schema.js';
import { Product } from '../products/schemas/products.schema.js';
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
  const orderModel = { create: vi.fn() };
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
