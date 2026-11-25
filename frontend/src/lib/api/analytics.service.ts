import { backendClient, unwrap, type ApiEnvelope } from './client'

export interface SalesAnalytics {
  periodDays: number
  revenue: number
  orders: number
  averageOrderValue: number
  itemsSold: number
  productsSold: number
  previousPeriod: { revenue: number; orders: number }
  byStatus: { _id: string; count: number; revenue: number }[]
  daily: { date: string; revenue: number; orders: number }[]
  topProducts: { _id: number; title: string; quantity: number; revenue: number }[]
  byBranch: { branchId: string; name: string; revenue: number; orders: number }[]
  inventoryAlerts: { branchId: string; name: string; lowStock: number; outOfStock: number }[]
}

export const analyticsService = {
  async sales(days = 30, signal?: AbortSignal): Promise<SalesAnalytics> {
    const response = await backendClient.get<ApiEnvelope<SalesAnalytics>>('/analytics/sales', {
      params: { days },
      signal,
    })
    return unwrap(response.data)
  },
}
