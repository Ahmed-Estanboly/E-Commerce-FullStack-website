import { NotificationsService } from './notifications.service.js';

function makeService() {
  const notificationModel = {
    create: vi.fn(async (doc: unknown) => doc),
    find: vi.fn(() => ({ sort: () => ({ limit: () => ({ lean: () => ({ exec: async () => [] }) }) }) })),
    countDocuments: vi.fn(() => ({ exec: async () => 2 })),
    findOneAndUpdate: vi.fn(() => ({ exec: async () => ({ _id: 'n1', read: true }) })),
    updateMany: vi.fn(() => ({ exec: async () => ({ modifiedCount: 2 }) })),
  };
  return { service: new NotificationsService(notificationModel as never), notificationModel };
}

describe('NotificationsService', () => {
  it('creates a notification for a user', async () => {
    const { service, notificationModel } = makeService();
    await service.create({ userId: 4, type: 'order_status', title: 't', body: 'b' });
    expect(notificationModel.create).toHaveBeenCalledWith(
      expect.objectContaining({ userId: 4, type: 'order_status' }),
    );
  });

  it('counts unread notifications', async () => {
    const { service } = makeService();
    expect(await service.unreadCount(4)).toBe(2);
  });

  it('marks a single notification read scoped to the user', async () => {
    const { service, notificationModel } = makeService();
    await service.markRead(4, 'n1');
    expect(notificationModel.findOneAndUpdate).toHaveBeenCalledWith(
      { _id: 'n1', userId: 4 },
      { $set: { read: true } },
      { new: true },
    );
  });

  it('marks all notifications read', async () => {
    const { service, notificationModel } = makeService();
    await service.markAllRead(4);
    expect(notificationModel.updateMany).toHaveBeenCalledWith(
      { userId: 4, read: false },
      { $set: { read: true } },
    );
  });
});
