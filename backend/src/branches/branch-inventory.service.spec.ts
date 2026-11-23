import { BranchInventoryService } from './branch-inventory.service.js';

describe('BranchInventoryService demo inventory seeding', () => {
  const branchIds = ['branch-one', 'branch-two', 'branch-three'];
  const branches = branchIds.map((id) => ({ _id: id, name: id, isActive: true }));
  const products = [
    { _id: 'product-one', id: 1, categoryId: 1, stock: 7 },
    { _id: 'product-two', id: 2, categoryId: 2 },
    { _id: 'product-three', id: 3, categoryId: 3, stock: 0 },
    { _id: 'product-four', id: 4, categoryId: 4, stock: 12 },
    { _id: 'product-five', id: 5, categoryId: 5, stock: 3 },
  ];
  const branchModel = {
    find: vi.fn(() => ({ sort: () => ({ lean: () => ({ exec: async () => branches }) }) })),
  };
  const productModel = {
    find: vi.fn(() => ({ sort: () => ({ lean: () => ({ exec: async () => products }) }) })),
  };
  const inventoryModel = {
    bulkWrite: vi.fn(async (_operations: { updateOne: { update: Record<string, unknown> & { $setOnInsert: { quantity?: number } }; upsert: boolean } }[]) => ({
      upsertedCount: 15,
    })),
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

  it('assigns every product to every active branch with insert-only stock quantities', async () => {
    await service.seedDemoInventory();

    expect(inventoryModel.bulkWrite).toHaveBeenCalledOnce();
    const [operations] = inventoryModel.bulkWrite.mock.calls[0];
    expect(operations).toHaveLength(branches.length * products.length);
    expect(operations.every((operation) => operation.updateOne.upsert)).toBe(true);
    expect(operations.every((operation) => '$setOnInsert' in operation.updateOne.update)).toBe(true);

    const branchCoverage = new Set(
      operations.map((operation) => String(operation.updateOne.filter.branch)),
    );
    expect(branchCoverage.size).toBe(branches.length);

    const productCoverage = new Set(
      operations.map((operation) => String(operation.updateOne.filter.product)),
    );
    expect(productCoverage.size).toBe(products.length);

    const quantities = operations.map((operation) => operation.updateOne.update.$setOnInsert.quantity);
    expect(quantities).toContain(0);
    expect(quantities).toContain(10);
    expect(new Set(quantities).size).toBeGreaterThan(1);
  });
});
