import { WishlistService } from './wishlist.service.js';

function makeService(items: { userId: number; productId: number }[], productIds: number[]) {
  const wishlistModel = {
    find: vi.fn(() => ({
      sort: () => ({
        lean: () => ({
          exec: async () => items,
          select: () => ({ lean: () => ({ exec: async () => items }) }),
        }),
      }),
    })),
    updateOne: vi.fn(() => ({ exec: async () => ({ acknowledged: true }) })),
    deleteOne: vi.fn(() => ({ exec: async () => ({ deletedCount: 1 }) })),
  };
  const productModel = {
    find: vi.fn(() => ({ lean: () => ({ exec: async () => productIds.map((id) => ({ id, title: `P${id}` })) }) })),
    exists: vi.fn(() => ({ exec: async () => ({}) })),
  };
  return { service: new WishlistService(wishlistModel as never, productModel as never), wishlistModel, productModel };
}

describe('WishlistService', () => {
  it('lists wishlist entries hydrated with their products', async () => {
    const { service } = makeService(
      [{ userId: 1, productId: 7 }],
      [7],
    );
    const result = await service.list(1);
    expect(result).toHaveLength(1);
    expect(result[0].product?.id).toBe(7);
  });

  it('drops entries whose product no longer exists', async () => {
    const { service } = makeService(
      [{ userId: 1, productId: 99 }],
      [],
    );
    expect(await service.list(1)).toHaveLength(0);
  });

  it('adds with an upsert and removes by user+product', async () => {
    const { service, wishlistModel } = makeService([], [3]);
    await service.add(1, 3);
    expect(wishlistModel.updateOne).toHaveBeenCalledWith(
      { userId: 1, productId: 3 },
      { $setOnInsert: { userId: 1, productId: 3 } },
      { upsert: true },
    );
    await service.remove(1, 3);
    expect(wishlistModel.deleteOne).toHaveBeenCalledWith({ userId: 1, productId: 3 });
  });
});
