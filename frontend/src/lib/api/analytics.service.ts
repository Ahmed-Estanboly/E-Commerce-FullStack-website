import { backendClient, unwrap, type ApiEnvelope } from './client'

export interface SalesAnalytics {
  periodDays: number
  revenue: number
  orders: number
  averageOrderValue: number
  itemsSold: number
  productsSold: number
  guestOrders: number
  customers: { registered: number; newCustomers: number; returningCustomers: number }
  previousPeriod: { revenue: number; orders: number }
  byStatus: { _id: string; count: number; revenue: number }[]
  daily: { date: string; revenue: number; orders: number }[]
  topProducts: { _id: number; title: string; quantity: number; revenue: number }[]
  stockRisk: { _id: number; title: string; quantity: number; revenue: number; totalStock: number; coverDays: number | null }[]
  byBranch: { branchId: string; name: string; revenue: number; orders: number }[]
  inventoryAlerts: { branchId: string; name: string; lowStock: number; outOfStock: number }[]
}

export const analyticsService = {
  async sales(days = 30, branchId?: string, signal?: AbortSignal): Promise<SalesAnalytics> {
    const response = await backendClient.get<ApiEnvelope<SalesAnalytics>>('/analytics/sales', {
      params: { days, ...(branchId ? { branchId } : {}) },
      signal,
    })
    return unwrap(response.data)
  },

  async exportCsv(days = 30, branchId?: string): Promise<Blob> {
    const response = await backendClient.get('/analytics/sales/export', {
      params: { days, ...(branchId ? { branchId } : {}) },
      responseType: 'blob',
    })
    return response.data as Blob
  },
}
