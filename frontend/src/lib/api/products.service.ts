import type { Product, ProductCategory, GetProductsParams } from '../../types/product'
import { backendClient, unwrap, type ApiEnvelope } from './client'

export const productsService = {
  async getProducts(
    params?: GetProductsParams,
    signal?: AbortSignal,
  ): Promise<Product[]> {
    const response = await backendClient.get<ApiEnvelope<Product[]>>('/products', {
      params,
      signal,
    })
    const products = unwrap(response.data)
    const offset = params?.offset ?? 0

    if (typeof params?.limit === 'number') {
      return products.slice(offset, offset + params.limit)
    }

    return products.slice(offset)
  },

  /** Fetches a single product without downloading the whole catalogue. */
  async getProduct(id: string | number, signal?: AbortSignal): Promise<Product> {
    const response = await backendClient.get<ApiEnvelope<Product>>(`/products/${id}`, { signal })
    return unwrap(response.data)
  },

  async getCategories(signal?: AbortSignal): Promise<ProductCategory[]> {
    const response = await backendClient.get<ApiEnvelope<ProductCategory[]>>('/category', { signal })
    return unwrap(response.data)
  },
}
