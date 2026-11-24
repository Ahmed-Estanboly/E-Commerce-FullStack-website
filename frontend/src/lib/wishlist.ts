import { wishlistService } from './api/wishlist.service'

let cache: Set<number> | null = null
let inflight: Promise<Set<number>> | null = null

/** Returns the caller's wishlist product IDs, fetching once and caching. */
export function getWishlistIds(): Promise<Set<number>> {
  if (cache) return Promise.resolve(cache)
  inflight ??= wishlistService
    .ids()
    .then((ids) => {
      cache = new Set(ids)
      return cache
    })
    .catch(() => {
      inflight = null
      return new Set<number>()
    })
  return inflight
}

/** Synchronous read of the cache (empty until loaded). */
export function peekWishlistIds(): Set<number> {
  return cache ?? new Set<number>()
}

export function wishlistCacheAdd(productId: number) {
  cache?.add(productId)
}

export function wishlistCacheRemove(productId: number) {
  cache?.delete(productId)
}

/** Call after the wishlist changes elsewhere (e.g. wishlist page removals). */
export function invalidateWishlistCache() {
  cache = null
  inflight = null
}
