import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import type { Model } from 'mongoose';
import { Order, OrderDocument, type OrderStatus } from '../orders/schemas/order.schema.js';
import { Branch, BranchDocument } from '../branches/schemas/branch.schema.js';
import { BranchInventory, BranchInventoryDocument } from '../branches/schemas/branch-inventory.schema.js';
import { Product, ProductDocument } from '../products/schemas/products.schema.js';

const DAY_MS = 24 * 60 * 60 * 1000;

@Injectable()
export class AnalyticsService {
  constructor(
    @InjectModel(Order.name) private readonly orderModel: Model<OrderDocument>,
    @InjectModel(Branch.name) private readonly branchModel: Model<BranchDocument>,
    @InjectModel(BranchInventory.name) private readonly inventoryModel: Model<BranchInventoryDocument>,
    @InjectModel(Product.name) private readonly productModel: Model<ProductDocument>,
  ) {}

  /** Sales analytics for the admin dashboard: totals, status mix, daily revenue, top products, per-branch. */
  async sales(days = 30) {
    const since = new Date(Date.now() - days * DAY_MS);
    const validStatuses = ['confirmed', 'preparing', 'ready', 'shipped', 'delivered'] as OrderStatus[];

    const periodStart = new Date(since.getTime() - days * DAY_MS);
    const [totals, itemsTotals, byStatus, byDay, topProducts, byBranch, branches, previousTotals] = await Promise.all([
      this.orderModel.aggregate<{ revenue: number; orders: number }>([
        { $match: { createdAt: { $gte: since }, status: { $ne: 'cancelled' } } },
        { $group: { _id: null, revenue: { $sum: '$total' }, orders: { $sum: 1 } } },
      ]),
      this.orderModel.aggregate<{ itemsSold: number; productsSold: number }>([
        { $match: { createdAt: { $gte: since }, status: { $in: validStatuses } } },
        { $unwind: '$items' },
        {
          $group: {
            _id: null,
            itemsSold: { $sum: '$items.quantity' },
            productsSold: { $addToSet: '$items.productId' },
          },
        },
        { $project: { itemsSold: 1, productsSold: { $size: '$productsSold' } } },
      ]),
      this.orderModel.aggregate<{ _id: string; count: number; revenue: number }>([
        { $match: { createdAt: { $gte: since } } },
        { $group: { _id: '$status', count: { $sum: 1 }, revenue: { $sum: '$total' } } },
      ]),
      this.orderModel.aggregate<{ _id: { $dateToString: { format: string; date: Date } }; revenue: number; orders: number }>([
        { $match: { createdAt: { $gte: since }, status: { $in: validStatuses } } },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
            revenue: { $sum: '$total' },
            orders: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ]),
      this.orderModel.aggregate<{ _id: number; title: string; quantity: number; revenue: number }>([
        { $match: { createdAt: { $gte: since }, status: { $in: validStatuses } } },
        { $unwind: '$items' },
        {
          $group: {
            _id: '$items.productId',
            title: { $first: '$items.title' },
            quantity: { $sum: '$items.quantity' },
            revenue: { $sum: { $multiply: ['$items.price', '$items.quantity'] } },
          },
        },
        { $sort: { revenue: -1 } },
        { $limit: 10 },
      ]),
      this.orderModel.aggregate<{ _id: string; name: string; revenue: number; orders: number }>([
        { $match: { createdAt: { $gte: since }, status: { $in: validStatuses } } },
        {
          $group: {
            _id: '$branch._id',
            name: { $first: '$branch.name' },
            revenue: { $sum: '$total' },
            orders: { $sum: 1 },
          },
        },
        { $sort: { revenue: -1 } },
      ]),
      this.branchModel.find().select('name isActive').lean().exec(),
      this.orderModel.aggregate<{ revenue: number; orders: number }>([
        { $match: { createdAt: { $gte: periodStart, $lt: since }, status: { $ne: 'cancelled' } } },
        { $group: { _id: null, revenue: { $sum: '$total' }, orders: { $sum: 1 } } },
      ]),
    ]);

    const [lowStock, outOfStock] = await Promise.all([
      this.inventoryModel.aggregate<{ _id: string; count: number }>([
        { $match: { quantity: { $gt: 0, $lt: 5 } } },
        { $group: { _id: '$branch', count: { $sum: 1 } } },
      ]),
      this.inventoryModel.aggregate<{ _id: string; count: number }>([
        { $match: { quantity: 0 } },
        { $group: { _id: '$branch', count: { $sum: 1 } } },
      ]),
    ]);

    const branchName = new Map(branches.map((branch) => [String(branch._id), branch.name]));
    const lowByBranch = new Map(lowStock.map((row) => [String(row._id), row.count]));
    const outByBranch = new Map(outOfStock.map((row) => [String(row._id), row.count]));

    return {
      periodDays: days,
      revenue: totals[0]?.revenue ?? 0,
      orders: totals[0]?.orders ?? 0,
      averageOrderValue: totals[0]?.orders ? Math.round((totals[0].revenue / totals[0].orders) * 100) / 100 : 0,
      itemsSold: itemsTotals[0]?.itemsSold ?? 0,
      productsSold: itemsTotals[0]?.productsSold ?? 0,
      previousPeriod: {
        revenue: previousTotals[0]?.revenue ?? 0,
        orders: previousTotals[0]?.orders ?? 0,
      },
      byStatus,
      daily: byDay.map((row) => ({ date: row._id, revenue: row.revenue, orders: row.orders })),
      topProducts,
      byBranch: byBranch.map((row) => ({
        branchId: row._id,
        name: row.name || branchName.get(row._id) || 'Unknown',
        revenue: row.revenue,
        orders: row.orders,
      })),
      inventoryAlerts: branches.map((branch) => ({
        branchId: String(branch._id),
        name: branch.name,
        lowStock: lowByBranch.get(String(branch._id)) ?? 0,
        outOfStock: outByBranch.get(String(branch._id)) ?? 0,
      })),
    };
  }
}
