import { BadRequestException } from '@nestjs/common';
import { CouponsService } from './coupons.service.js';

function makeService(coupon: Record<string, unknown> | null) {
  const couponModel = {
    findOne: vi.fn(() => ({ exec: async () => coupon })),
    create: vi.fn(async (doc: unknown) => doc),
    findByIdAndUpdate: vi.fn(),
    findByIdAndDelete: vi.fn(),
    find: vi.fn(() => ({ sort: () => ({ lean: () => ({ exec: async () => [] }) }) })),
    updateOne: vi.fn(() => ({ exec: async () => ({ acknowledged: true }) })),
  };
  return { service: new CouponsService(couponModel as never), couponModel };
}

const baseCoupon = {
  _id: 'c1',
  code: 'SAVE10',
  kind: 'percent',
  value: 10,
  minSubtotal: 0,
  active: true,
  usedCount: 0,
};

describe('CouponsService', () => {
  it('calculates percent and fixed discounts capped at the subtotal', () => {
    const { service } = makeService(null);
    expect(service.discountFor({ kind: 'percent', value: 10 }, 100)).toBe(10);
    expect(service.discountFor({ kind: 'fixed', value: 25 }, 20)).toBe(20);
    expect(service.discountFor({ kind: 'fixed', value: 5 }, 100)).toBe(5);
  });

  it('rejects percent coupons above 100 on create', async () => {
    const { service } = makeService(null);
    expect(() =>
      service.create({ code: 'BIG', kind: 'percent', value: 150 }),
    ).toThrow(BadRequestException);
  });

  it('validates an active coupon and returns the discount', async () => {
    const { service } = makeService(baseCoupon);
    const result = await service.validate({ code: 'save10', subtotal: 80 });
    expect(result.code).toBe('SAVE10');
    expect(result.discount).toBe(8);
  });

  it('rejects expired, inactive, over-limit and below-minimum coupons', async () => {
    const expired = { ...baseCoupon, expiresAt: new Date(Date.now() - 1000) };
    await expect(makeService(expired).service.validate({ code: 'SAVE10', subtotal: 80 }))
      .rejects.toBeInstanceOf(BadRequestException);

    const inactive = { ...baseCoupon, active: false };
    await expect(makeService(inactive).service.validate({ code: 'SAVE10', subtotal: 80 }))
      .rejects.toBeInstanceOf(BadRequestException);

    const limited = { ...baseCoupon, usageLimit: 3, usedCount: 3 };
    await expect(makeService(limited).service.validate({ code: 'SAVE10', subtotal: 80 }))
      .rejects.toBeInstanceOf(BadRequestException);

    const min = { ...baseCoupon, minSubtotal: 100 };
    await expect(makeService(min).service.validate({ code: 'SAVE10', subtotal: 80 }))
      .rejects.toBeInstanceOf(BadRequestException);
  });

  it('applyForOrder increments usedCount and returns the discount', async () => {
    const { service, couponModel } = makeService(baseCoupon);
    const result = await service.applyForOrder('SAVE10', 50);
    expect(result.discount).toBe(5);
    expect(couponModel.updateOne).toHaveBeenCalledWith(
      { _id: 'c1' },
      { $inc: { usedCount: 1 } },
    );
  });
});
