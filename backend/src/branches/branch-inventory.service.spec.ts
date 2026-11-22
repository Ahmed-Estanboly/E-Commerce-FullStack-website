import { BranchInventoryService } from './branch-inventory.service.js';

describe('BranchInventoryService demo inventory seeding', () => {
  const branchIds = ['branch-one', 'branch-two', 'branch-three'];
  const branches = branchIds.map((id) => ({ _id: id, name: id, isActive: true }));
  const products = [
    { _id: 'product-one', id: 1, categoryId: 1 },
    { _id: 'product-two', id: 2, categoryId: 2 },
    { _id: 'product-three', id: 3, categoryId: 3 },
    { _id: 'product-four', id: 4, categoryId: 4 },
    { _id: 'product-five', id: 5, categoryId: 5 },
  ];
  const branchModel = {
    find: vi.fn(() => ({ sort: () => ({ lean: () => ({ exec: async () => branches }) }) })),
  };
  const productModel = {
    find: vi.fn(() => ({ sort: () => ({ lean: () => ({ exec: async () => products }) }) })),
  };
  const inventoryModel = {
    bulkWrite: vi.fn(async () => ({ upsertedCount: 6 })),
  };
  const service = new BranchInventoryService(
    branchModel as never,
    productModel as never,
    inventoryModel as never,
    {} as never,
  );

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('creates varied branch assignments with insert-only quantities', async () => {
    await service.seedDemoInventory();

    expect(inventoryModel.bulkWrite).toHaveBeenCalledOnce();
    const [operations] = inventoryModel.bulkWrite.mock.calls[0];
    expect(operations.length).toBeGreaterThan(0);
    expect(operations.every((operation) => operation.updateOne.upsert)).toBe(true);
    expect(operations.every((operation) => '$setOnInsert' in operation.updateOne.update)).toBe(true);
    const quantities = operations.map((operation) => operation.updateOne.update.$setOnInsert.quantity);
    expect(quantities).toContain(0);
    expect(new Set(quantities).size).toBeGreaterThan(1);
  });
});
