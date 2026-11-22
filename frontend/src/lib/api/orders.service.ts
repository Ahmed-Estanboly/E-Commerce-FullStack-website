import axios from 'axios'
import type { FulfilmentMethod, PaymentMethod } from '../../types/checkout'
import { backendClient, unwrap, type ApiEnvelope } from './client'

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
  status: 'pending' | 'confirmed' | 'delivered' | 'cancelled'
  createdAt: string
  updatedAt: string
}

export const ordersService = {
  async createOrder(payload: CreateOrderPayload, signal?: AbortSignal): Promise<BackendOrder> {
    const response = await backendClient.post<ApiEnvelope<BackendOrder>>('/orders', payload, { signal })
    return unwrap(response.data)
  },

  async getMyOrders(signal?: AbortSignal): Promise<BackendOrder[]> {
    const response = await backendClient.get<ApiEnvelope<BackendOrder[]>>('/orders/me', { signal })
    return unwrap(response.data)
  },

  async getBranchOrders(branchId: string, signal?: AbortSignal): Promise<BackendOrder[]> {
    const response = await backendClient.get<ApiEnvelope<BackendOrder[]>>(
      `/orders/branch/${branchId}`,
      { signal },
    )
    return unwrap(response.data)
  },

  async getAllOrders(signal?: AbortSignal): Promise<BackendOrder[]> {
    const response = await backendClient.get<ApiEnvelope<BackendOrder[]>>('/orders', { signal })
    return unwrap(response.data)
  },
}

export function getOrderRequestError(error: unknown, fallback: string): string {
  if (!axios.isAxiosError(error)) return fallback

  const message: unknown = error.response?.data?.message
  if (typeof message === 'string') return message
  if (Array.isArray(message)) return message.join(', ')
  return error.message || fallback
}
