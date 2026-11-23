import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import type { Model } from 'mongoose';
import { Coupon, CouponDocument } from './schemas/coupon.schema.js';
import { CreateCouponDto } from './dto/coupon.dto.js';
import { ValidateCouponDto } from './dto/validate-coupon.dto.js';

export interface CouponDiscount {
  code: string;
  kind: 'percent' | 'fixed';
  value: number;
  discount: number;
}

@Injectable()
export class CouponsService {
  constructor(@InjectModel(Coupon.name) private readonly couponModel: Model<CouponDocument>) {}

  create(dto: CreateCouponDto) {
    if (dto.kind === 'percent' && dto.value > 100) {
      throw new BadRequestException('Percent coupons cannot exceed 100.');
    }
    return this.couponModel.create({
      ...dto,
      code: dto.code.toUpperCase(),
      expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : undefined,
    });
  }

  findAll() {
    return this.couponModel.find().sort({ createdAt: -1 }).lean().exec();
  }

  async update(id: string, dto: Partial<CreateCouponDto>) {
    const coupon = await this.couponModel
      .findByIdAndUpdate(id, { ...dto, ...(dto.code ? { code: dto.code.toUpperCase() } : {}) }, { new: true })
      .exec();
    if (!coupon) throw new NotFoundException('Coupon not found');
    return coupon;
  }

  async remove(id: string) {
    const coupon = await this.couponModel.findByIdAndDelete(id).exec();
    if (!coupon) throw new NotFoundException('Coupon not found');
    return coupon;
  }

  discountFor(coupon: Pick<Coupon, 'kind' | 'value'>, subtotal: number): number {
    const raw = coupon.kind === 'percent' ? (subtotal * coupon.value) / 100 : coupon.value;
    return Math.min(Math.max(0, Math.round(raw * 100) / 100), subtotal);
  }

  private assertUsable(coupon: CouponDocument, subtotal: number) {
    if (!coupon.active) throw new BadRequestException('Coupon is invalid or inactive.');
    if (coupon.expiresAt && coupon.expiresAt.getTime() < Date.now()) {
      throw new BadRequestException('Coupon has expired.');
    }
    if (coupon.usageLimit !== undefined && coupon.usageLimit !== null && coupon.usedCount >= coupon.usageLimit) {
      throw new BadRequestException('Coupon usage limit reached.');
    }
    if (subtotal < coupon.minSubtotal) {
      throw new BadRequestException(`Coupon requires a subtotal of at least ${coupon.minSubtotal}.`);
    }
  }

  async validate(dto: ValidateCouponDto): Promise<CouponDiscount> {
    const coupon = await this.couponModel.findOne({ code: dto.code.toUpperCase() }).exec();
    if (!coupon) throw new BadRequestException('Coupon is invalid or inactive.');
    this.assertUsable(coupon, dto.subtotal);
    return {
      code: coupon.code,
      kind: coupon.kind,
      value: coupon.value,
      discount: this.discountFor(coupon, dto.subtotal),
    };
  }

  /** Validates the coupon and reserves one use (increments usedCount). */
  async applyForOrder(code: string, subtotal: number): Promise<CouponDiscount> {
    const coupon = await this.couponModel.findOne({ code: code.toUpperCase() }).exec();
    if (!coupon) throw new BadRequestException('Coupon is invalid or inactive.');
    this.assertUsable(coupon, subtotal);
    await this.couponModel.updateOne({ _id: coupon._id }, { $inc: { usedCount: 1 } }).exec();
    return {
      code: coupon.code,
      kind: coupon.kind,
      value: coupon.value,
      discount: this.discountFor(coupon, subtotal),
    };
  }
}
