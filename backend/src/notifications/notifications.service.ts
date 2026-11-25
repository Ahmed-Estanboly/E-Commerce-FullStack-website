import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import type { Model } from 'mongoose';
import { Notification, NotificationDocument } from './schemas/notification.schema.js';
import { User, UserDocument } from '../users/schemas/users.schema.js';

const ADMIN_ROLE = 'master admin';
const BRANCH_OWNER_ROLES = ['branch owner', 'central owner', 'south owner'];

export interface CreateNotificationInput {
  userId: number;
  type: string;
  title: string;
  body: string;
  link?: string;
  meta?: Record<string, unknown>;
}

@Injectable()
export class NotificationsService {
  constructor(
    @InjectModel(Notification.name) private readonly notificationModel: Model<NotificationDocument>,
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
  ) {}

  create(input: CreateNotificationInput) {
    return this.notificationModel.create(input);
  }

  list(userId: number, limit = 20) {
    return this.notificationModel.find({ userId }).sort({ createdAt: -1 }).limit(limit).lean().exec();
  }

  unreadCount(userId: number) {
    return this.notificationModel.countDocuments({ userId, read: false }).exec();
  }

  async markRead(userId: number, id: string) {
    return this.notificationModel
      .findOneAndUpdate({ _id: id, userId }, { $set: { read: true } }, { new: true })
      .exec();
  }

  async markAllRead(userId: number) {
    await this.notificationModel.updateMany({ userId, read: false }, { $set: { read: true } }).exec();
    return { read: true };
  }

  /**
   * Alerts the branch owner(s) and every master admin that a product's stock
   * at a branch dropped below the refill threshold (or hit zero). Branch
   * owners deep-link to their inventory page; admins to the branch inventory.
   */
  async notifyInventoryAlert(input: {
    branchId: string;
    branchName: string;
    productTitle: string;
    quantity: number;
    outOfStock: boolean;
  }) {
    const [owners, admins] = await Promise.all([
      this.userModel
        .find({ branchId: input.branchId, role: { $in: BRANCH_OWNER_ROLES } })
        .select('id')
        .lean()
        .exec(),
      this.userModel.find({ role: ADMIN_ROLE }).select('id').lean().exec(),
    ]);

    const recipients = new Map<number, 'owner' | 'admin'>();
    for (const owner of owners) recipients.set(owner.id, 'owner');
    for (const admin of admins) if (!recipients.has(admin.id)) recipients.set(admin.id, 'admin');
    if (!recipients.size) return;

    const type = input.outOfStock ? 'out_of_stock' : 'low_stock';
    const title = input.outOfStock
      ? `${input.productTitle} is out of stock`
      : `Low stock: ${input.productTitle}`;
    const body = `${input.branchName} has ${input.quantity} unit${input.quantity === 1 ? '' : 's'} left of "${input.productTitle}".`;

    await Promise.all(
      [...recipients.entries()].map(([userId, kind]) =>
        this.create({
          userId,
          type,
          title,
          body,
          link: kind === 'owner' ? `/${input.branchId}/inventory` : `/admin/branches/${input.branchId}/inventory`,
          meta: { branchId: input.branchId, productTitle: input.productTitle, quantity: input.quantity },
        }),
      ),
    );
  }
}
