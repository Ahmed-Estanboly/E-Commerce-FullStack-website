import { backendClient, unwrap, type ApiEnvelope } from './client'

export interface AppNotification {
  _id: string
  userId: number
  type: string
  title: string
  body: string
  link?: string
  read: boolean
  meta?: Record<string, unknown>
  createdAt: string
}

export const notificationsService = {
  async list(signal?: AbortSignal): Promise<AppNotification[]> {
    const response = await backendClient.get<ApiEnvelope<AppNotification[]>>('/notifications', { signal })
    return unwrap(response.data)
  },

  async unreadCount(): Promise<number> {
    const response = await backendClient.get<ApiEnvelope<number>>('/notifications/unread-count')
    return unwrap(response.data)
  },

  async markRead(id: string): Promise<AppNotification | null> {
    const response = await backendClient.patch<ApiEnvelope<AppNotification>>(`/notifications/${id}/read`)
    return unwrap(response.data)
  },

  async markAllRead(): Promise<{ read: boolean }> {
    const response = await backendClient.post<ApiEnvelope<{ read: boolean }>>('/notifications/read-all')
    return unwrap(response.data)
  },
}
