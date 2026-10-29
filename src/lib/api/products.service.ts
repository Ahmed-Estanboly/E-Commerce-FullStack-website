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
}