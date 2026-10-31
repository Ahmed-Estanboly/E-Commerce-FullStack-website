import type { Product, GetProductsParams } from '../../types/product'
import { apiClient } from './client'

export const productsService = {
  async getProducts(
    params?: GetProductsParams,
    signal?: AbortSignal,
  ): Promise<Product[]> {
    const response = await apiClient.get<Product[]>('/products', {
      params,
      signal,
    })

    return response.data
  },

  /** Fetches a single product without downloading the whole catalogue. */
  async getProduct(id: string | number, signal?: AbortSignal): Promise<Product> {
    const response = await apiClient.get<Product>(`/products/${id}`, { signal })
    return response.data
  },
}