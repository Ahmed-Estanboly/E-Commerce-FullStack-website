import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import type { Model } from 'mongoose';
import { Notification, NotificationDocument } from './schemas/notification.schema.js';

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
  constructor(@InjectModel(Notification.name) private readonly notificationModel: Model<NotificationDocument>) {}

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
}
