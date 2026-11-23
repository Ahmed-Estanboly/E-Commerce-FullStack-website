import axios from 'axios'
import type { FulfilmentMethod, PaymentMethod } from '../../types/checkout'
import type { PaginatedResult } from '../../types/product'
import { backendClient, unwrap, type ApiEnvelope } from './client'

export type OrderStatus =
  | 'pending'
  | 'confirmed'
  | 'preparing'
  | 'ready'
  | 'shipped'
  | 'delivered'
  | 'cancelled'

export interface OrderStatusHistoryEntry {
  status: OrderStatus
  at: string
  by?: string
  note?: string
}

export interface OrderItemPayload {
  productId: number
  title: string
  price: number
  quantity: number
}

export interface CreateOrderPayload {
  email: string
  phone: string
  customerName: string
  items: OrderItemPayload[]
  subtotal: number
  shippingFee: number
  total?: number
  fulfilment: FulfilmentMethod
  branch: { branchId: string }
  deliveryAddress?: string
  paymentMethod: PaymentMethod
  cardLast4?: string
}

export interface BackendOrder {
  _id: string
  orderNumber: string
  userId?: number
  email: string
  phone: string
  customerName: string
  items: OrderItemPayload[]
  subtotal: number
  shippingFee: number
  total: number
  fulfilment: FulfilmentMethod
  branch: {
    _id: string
    name: string
    address: string
    phone: string
    workingHours?: string
    isActive?: boolean
  }
  deliveryAddress?: string
  paymentMethod: PaymentMethod
  cardLast4?: string
  status: OrderStatus
  statusHistory?: OrderStatusHistoryEntry[]
  allowedTransitions?: OrderStatus[]
  createdAt: string
  updatedAt: string
}

export type OrdersResponse = BackendOrder[] | PaginatedResult<BackendOrder>

export interface OrderQueryParams {
  page?: number
  limit?: number
}

function isPaginated(data: OrdersResponse): data is PaginatedResult<BackendOrder> {
  return !Array.isArray(data)
}

function normalizeOrders(data: OrdersResponse): BackendOrder[] {
  return isPaginated(data) ? data.items : data
}

export const ordersService = {
  async createOrder(payload: CreateOrderPayload, signal?: AbortSignal): Promise<BackendOrder> {
    const response = await backendClient.post<ApiEnvelope<BackendOrder>>('/orders', payload, { signal })
    return unwrap(response.data)
  },

  async getMyOrders(params?: OrderQueryParams, signal?: AbortSignal): Promise<OrdersResponse> {
    const response = await backendClient.get<ApiEnvelope<OrdersResponse>>('/orders/me', {
      params,
      signal,
    })
    return unwrap(response.data)
  },

  async getMyOrder(id: string, signal?: AbortSignal): Promise<BackendOrder> {
    const response = await backendClient.get<ApiEnvelope<BackendOrder>>(`/orders/me/${id}`, { signal })
    return unwrap(response.data)
  },

  async getBranchOrders(branchId: string, params?: OrderQueryParams, signal?: AbortSignal): Promise<OrdersResponse> {
    const response = await backendClient.get<ApiEnvelope<OrdersResponse>>(
      `/orders/branch/${branchId}`,
      { params, signal },
    )
    return unwrap(response.data)
  },

  async getAllOrders(params?: OrderQueryParams, signal?: AbortSignal): Promise<OrdersResponse> {
    const response = await backendClient.get<ApiEnvelope<OrdersResponse>>('/orders', {
      params,
      signal,
    })
    return unwrap(response.data)
  },

  async getOrder(id: string, signal?: AbortSignal): Promise<BackendOrder> {
    const response = await backendClient.get<ApiEnvelope<BackendOrder>>(`/orders/${id}`, { signal })
    return unwrap(response.data)
  },

  async updateOrderStatus(id: string, status: OrderStatus, note?: string): Promise<BackendOrder> {
    const response = await backendClient.patch<ApiEnvelope<BackendOrder>>(
      `/orders/${id}/status`,
      { status, ...(note ? { note } : {}) },
    )
    return unwrap(response.data)
  },
}

export { normalizeOrders }

export function getOrderRequestError(error: unknown, fallback: string): string {
  if (!axios.isAxiosError(error)) return fallback

  const message: unknown = error.response?.data?.message
  if (typeof message === 'string') return message
  if (Array.isArray(message)) return message.join(', ')
  return error.message || fallback
}
