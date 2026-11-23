import { backendClient, unwrap, type ApiEnvelope } from './client'
import type { Product } from '../../types/product'

export interface WishlistEntry {
  _id: string
  userId: number
  productId: number
  createdAt: string
  product: Product | null
}

export const wishlistService = {
  async list(signal?: AbortSignal): Promise<WishlistEntry[]> {
    const response = await backendClient.get<ApiEnvelope<WishlistEntry[]>>('/wishlist', { signal })
    return unwrap(response.data)
  },

  async ids(signal?: AbortSignal): Promise<number[]> {
    const entries = await this.list(signal)
    return entries.map((entry) => entry.productId)
  },

  async add(productId: number): Promise<{ productId: number; saved: boolean }> {
    const response = await backendClient.post<ApiEnvelope<{ productId: number; saved: boolean }>>('/wishlist', { productId })
    return unwrap(response.data)
  },

  async remove(productId: number): Promise<{ productId: number; saved: boolean }> {
    const response = await backendClient.delete<ApiEnvelope<{ productId: number; saved: boolean }>>(`/wishlist/${productId}`)
    return unwrap(response.data)
  },
}
