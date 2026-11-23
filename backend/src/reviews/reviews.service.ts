import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import type { Model } from 'mongoose';
import { Product, ProductDocument } from '../products/schemas/products.schema.js';
import { User, UserDocument } from '../users/schemas/users.schema.js';
import { CreateReviewDto } from './dto/create-review.dto.js';
import { Review, ReviewDocument } from './schemas/review.schema.js';

const REVIEWS_LIMIT = 50;

export interface ReviewActor {
  id: number;
  email?: string;
}

@Injectable()
export class ReviewsService {
  constructor(
    @InjectModel(Review.name) private readonly reviewModel: Model<ReviewDocument>,
    @InjectModel(Product.name) private readonly productModel: Model<ProductDocument>,
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
  ) {}

  async list(productId: number, userId?: number) {
    await this.ensureProduct(productId);

    const [reviews, aggregate, myReview] = await Promise.all([
      this.reviewModel
        .find({ productId })
        .sort({ createdAt: -1 })
        .limit(REVIEWS_LIMIT)
        .lean()
        .exec(),
      this.reviewModel
        .aggregate<{ average: number; count: number }>([
          { $match: { productId } },
          { $group: { _id: '$productId', average: { $avg: '$rating' }, count: { $sum: 1 } } },
        ])
        .exec(),
      userId === undefined
        ? Promise.resolve(null)
        : this.reviewModel.findOne({ productId, userId }).lean().exec(),
    ]);

    const stats = aggregate[0];
    return {
      items: reviews,
      average: stats ? Math.round(stats.average * 10) / 10 : 0,
      count: stats?.count ?? 0,
      myReview: myReview ?? null,
    };
  }

  /**
   * Creates the review or updates the caller's existing review for the
   * product (one review per user per product), then resyncs the product's
   * denormalised rating fields.
   */
  async upsert(productId: number, actor: ReviewActor, dto: CreateReviewDto) {
    await this.ensureProduct(productId);
    const userName = await this.resolveUserName(actor);

    const review = await this.reviewModel
      .findOneAndUpdate(
        { productId, userId: actor.id },
        {
          $set: {
            rating: dto.rating,
            title: dto.title?.trim() || undefined,
            comment: dto.comment.trim(),
            userName,
          },
        },
        { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true },
      )
      .exec();

    await this.syncProductRating(productId);
    return review;
  }

  async remove(reviewId: string) {
    if (!/^[a-f0-9]{24}$/i.test(reviewId)) {
      throw new NotFoundException('Review not found');
    }
    const review = await this.reviewModel.findByIdAndDelete(reviewId).exec();
    if (!review) {
      throw new NotFoundException('Review not found');
    }
    await this.syncProductRating(review.productId);
    return review;
  }

  private async ensureProduct(productId: number) {
    const exists = await this.productModel.exists({ id: productId }).exec();
    if (!exists) {
      throw new NotFoundException('Product not found');
    }
  }

  private async resolveUserName(actor: ReviewActor): Promise<string> {
    const user = await this.userModel.findOne({ id: actor.id }).select('name email').lean().exec();
    return user?.name?.trim() || user?.email || actor.email || 'Nova customer';
  }

  private async syncProductRating(productId: number) {
    const [stats] = await this.reviewModel
      .aggregate<{ average: number; count: number }>([
        { $match: { productId } },
        { $group: { _id: '$productId', average: { $avg: '$rating' }, count: { $sum: 1 } } },
      ])
      .exec();

    await this.productModel
      .updateOne(
        { id: productId },
        {
          $set: {
            ratingAverage: stats ? Math.round(stats.average * 10) / 10 : 0,
            ratingCount: stats?.count ?? 0,
          },
        },
      )
      .exec();
  }
}
