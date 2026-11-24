import { useCallback, useState } from 'react'
import { Link } from 'react-router-dom'
import { SmartImage } from '../components/ui/smart-image'
import { useFetch } from '../hooks/useFetch'
import { wishlistService, type WishlistEntry } from '../lib/api/wishlist.service'
import { wishlistCacheRemove } from '../lib/wishlist'
import { Skeleton } from '../components/ui/feedback'
import { presentationForCategory } from '../data/home'

const currency = new Intl.NumberFormat('en-IE', { style: 'currency', currency: 'EUR', maximumFractionDigits: 2 })

export default function WishlistPage() {
  const [removed, setRemoved] = useState<Set<string>>(new Set())
  const [busy, setBusy] = useState<string | null>(null)
  const request = useCallback((signal: AbortSignal) => wishlistService.list(signal), [])
  const { data, isLoading, error, refetch } = useFetch<WishlistEntry[]>(request)

  const entries = (data ?? []).filter((entry) => !removed.has(entry._id))

  const remove = async (entry: WishlistEntry) => {
    setBusy(entry._id)
    try {
      await wishlistService.remove(entry.productId)
      wishlistCacheRemove(entry.productId)
      setRemoved((current) => new Set(current).add(entry._id))
    } finally {
      setBusy(null)
    }
  }

  return (
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        <div className="mb-8 flex items-end justify-between gap-4">
          <div>
            <p className="eyebrow">Your account</p>
            <h1 className="mt-1 font-display text-4xl tracking-[-0.03em]">Wish<em>list.</em></h1>
          </div>
          <Link to="/account" className="font-mono text-[10px] uppercase tracking-[0.12em] text-muted transition-colors hover:text-ink">← Back to account</Link>
        </div>

        {error ? (
          <div className="mb-6 flex items-center justify-between border border-danger/40 bg-danger/5 px-4 py-3 text-sm text-danger" role="alert">
            <span>{error}</span>
            <button type="button" onClick={() => void refetch()} className="font-mono text-[10px] uppercase tracking-widest underline">Retry</button>
          </div>
        ) : null}

        {isLoading && !data ? (
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3" role="status" aria-label="Loading your wishlist">
            {Array.from({ length: 6 }).map((_, index) => (
              <li key={index} className="border border-line bg-surface">
                <Skeleton className="aspect-square w-full" />
                <div className="p-4">
                  <Skeleton className="h-3 w-24" />
                  <Skeleton className="mt-2 h-5 w-3/4" />
                  <Skeleton className="mt-2 h-4 w-1/3" />
                </div>
              </li>
            ))}
          </ul>
        ) : !entries.length ? (
          <div className="border border-line bg-surface p-10 text-center">
            <p className="font-display text-2xl">Nothing saved yet.</p>
            <p className="mt-2 text-sm text-muted">Tap the heart on any product to keep it here for later.</p>
            <Link to="/shop" className="mt-5 inline-block border border-ink px-5 py-2.5 font-mono text-[10px] uppercase tracking-[0.12em] text-ink transition-colors hover:bg-ink hover:text-white">Browse the shop</Link>
          </div>
        ) : (
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {entries.map((entry) => {
              const product = entry.product
              if (!product) return null
              return (
                <li key={entry._id} className="group border border-line bg-surface">
                  <Link to={`/products/${product.id}`} className="block">
                    <div className="aspect-square overflow-hidden bg-canvas">
                      <SmartImage
                        src={product.images[0]}
                        alt={product.title}
                        presentation={presentationForCategory(product.category?.name)}
                        fallbackLabel={product.category?.name ?? 'NOVA'}
                        aspect="none"
                        className="h-full w-full"
                        imgClassName="transition-transform duration-500 group-hover:scale-105"
                        sizes="(max-width: 640px) 100vw, 33vw"
                      />
                    </div>
                    <div className="p-4">
                      <p className="text-[10px] uppercase tracking-[0.12em] text-muted">{product.category.name}</p>
                      <h2 className="mt-1 line-clamp-1 font-display text-lg">{product.title}</h2>
                      <p className="mt-2 font-mono text-sm tabular text-ink">{currency.format(product.price)}</p>
                    </div>
                  </Link>
                  <div className="flex gap-2 border-t border-line p-3">
                    <button
                      type="button"
                      onClick={() => void remove(entry)}
                      disabled={busy === entry._id}
                      className="flex-1 border border-line px-3 py-2 font-mono text-[9px] uppercase tracking-widest text-muted transition-colors hover:border-danger hover:text-danger disabled:opacity-40"
                    >
                      {busy === entry._id ? 'Removing…' : 'Remove'}
                    </button>
                    <Link
                      to={`/products/${product.id}`}
                      className="flex-1 border border-accent bg-accent px-3 py-2 text-center font-mono text-[9px] uppercase tracking-widest text-accent-ink transition-colors hover:bg-transparent hover:text-accent"
                    >
                      View
                    </Link>
                  </div>
                </li>
              )
            })}
          </ul>
        )}
      </div>
  )
}
