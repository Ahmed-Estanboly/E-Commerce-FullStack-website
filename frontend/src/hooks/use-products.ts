import { useCallback } from 'react'
import { useFetch } from './useFetch'
import { productsService } from '../lib/api/products.service'
import type { Product } from '../types/product'

/** One request feeds the hero, the selection and the search dialog. */
export const HOME_PRODUCT_LIMIT = 50

/**
 * Reads products through the team's existing `productsService`.
 * No new API layer, no global cache: just the shared `useFetch` hook.
 */
export function useStoreProducts(limit = HOME_PRODUCT_LIMIT) {
  const request = useCallback(
    (signal: AbortSignal) => productsService.getProducts({ offset: 0, limit }, signal),
    [limit],
  )
  const { data, isLoading, error, refetch } = useFetch<Product[]>(request)

  return {
    products: data ?? [],
    isLoading,
    error,
    refetch,
  }
}
