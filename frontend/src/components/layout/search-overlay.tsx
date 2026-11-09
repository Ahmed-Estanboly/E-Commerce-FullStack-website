import { useDeferredValue, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowRight, Search } from '../ui/icons'
import { Dialog } from '../ui/dialog'
import { SmartImage } from '../ui/smart-image'
import { Skeleton } from '../ui/feedback'
import {
  HOME_DEPARTMENTS,
  departmentForCategory,
  presentationForCategory,
} from '../../data/home'
import { useStoreProducts } from '../../hooks/use-products'
import { formatPrice } from '../../lib/utils'

export interface SearchOverlayProps {
  open: boolean
  onClose: () => void
}

/**
 * Search interaction from NOVA's header.
 *
 * NOVA searched its own catalogue service. This version reads the team's
 * products endpoint through `useStoreProducts` and filters on the client, so the
 * header needs no new API surface. Results link to `/products/:id`.
 */
export function SearchOverlay({ open, onClose }: SearchOverlayProps) {
  const [query, setQuery] = useState('')
  const deferredQuery = useDeferredValue(query.trim())
  const navigate = useNavigate()
  const { products, isLoading, error } = useStoreProducts()
  const term = deferredQuery.toLowerCase()
  const active = term.length >= 2

  const close = () => {
    setQuery('')
    onClose()
  }

  const results = active
    ? products
        .filter((product) =>
          `${product.title} ${product.description} ${product.category?.name ?? ''}`
            .toLowerCase()
            .includes(term),
        )
        .slice(0, 6)
    : []
  const featured = products.slice(0, 3)

  const submit = (event: React.FormEvent) => {
    event.preventDefault()
    const value = query.trim()
    if (!value) return
    navigate(`/shop?q=${encodeURIComponent(value)}`)
    close()
  }

  return (
    <Dialog open={open} onClose={close} title="Search the edit" size="lg">
      <form onSubmit={submit} role="search" className="relative">
        <Search
          className="pointer-events-none absolute left-0 top-1/2 h-5 w-5 -translate-y-1/2 text-muted"
          strokeWidth={1.5}
          aria-hidden="true"
        />
        <input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search products, materials, categories…"
          aria-label="Search products"
          data-autofocus
          className="h-14 w-full border-b border-line bg-transparent pl-8 pr-4 text-[17px] tracking-[-0.01em] text-ink outline-none placeholder:text-muted/70 focus:border-ink"
        />
      </form>

      <div className="mt-5 min-h-[220px]">
        {active ? (
          <div>
            <div className="flex items-center justify-between">
              <p className="eyebrow">{isLoading ? 'Searching' : `${results.length} results`}</p>
              <span className="hidden font-mono text-[9px] uppercase tracking-[0.14em] text-muted sm:block">
                Enter to view all
              </span>
            </div>

            {isLoading && products.length === 0 ? (
              <div className="mt-3 space-y-3">
                {[0, 1, 2].map((item) => (
                  <div key={item} className="flex items-center gap-3">
                    <Skeleton className="h-16 w-14" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-3 w-2/3" />
                      <Skeleton className="h-3 w-1/3" />
                    </div>
                  </div>
                ))}
              </div>
            ) : results.length > 0 ? (
              <ul className="mt-3 divide-y divide-line">
                {results.map((product) => (
                  <li key={product.id}>
                    <Link
                      to={`/products/${product.id}`}
                      onClick={close}
                      className="group flex items-center gap-4 py-3"
                    >
                      <SmartImage
                        src={product.images?.[0]}
                        fallbackSrc={departmentForCategory(product.category?.name)?.image}
                        alt={product.title}
                        presentation={presentationForCategory(product.category?.name)}
                        fallbackLabel={product.category?.name ?? 'NOVA'}
                        className="h-[62px] w-[50px] shrink-0"
                        sizes="50px"
                      />
                      <span className="min-w-0 flex-1">
                        <span className="eyebrow block">
                          {product.category?.name ?? 'Product'}
                        </span>
                        <span className="mt-0.5 block truncate text-[14px] text-ink group-hover:underline group-hover:underline-offset-4">
                          {product.title}
                        </span>
                      </span>
                      <span className="shrink-0 text-[12px] tabular text-ink-soft">
                        {formatPrice(product.price)}
                      </span>
                      <ArrowRight
                        className="h-3.5 w-3.5 shrink-0 text-muted opacity-0 transition-opacity group-hover:opacity-100"
                        aria-hidden="true"
                      />
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="mt-6 border border-dashed border-line-strong/70 px-5 py-8 text-center">
                <p className="font-display text-xl">
                  {error ? 'The catalogue could not be reached.' : `Nothing matches “${deferredQuery}”.`}
                </p>
                <p className="mt-1.5 text-[12px] text-muted">
                  {error
                    ? 'Check the API connection, or browse the departments below.'
                    : 'Try a broader term, or browse the departments below.'}
                </p>
              </div>
            )}

            <div className="mt-5">
              <p className="eyebrow mb-2">Browse departments</p>
              <div className="flex flex-wrap gap-1.5">
                {HOME_DEPARTMENTS.map((department) => (
                  <Link
                    key={department.id}
                    to={`/shop?category=${department.slug}`}
                    onClick={close}
                    className="focus-ring border border-line px-3 py-1.5 text-[11px] text-ink-soft transition-colors hover:border-ink hover:text-ink"
                  >
                    {department.name}
                  </Link>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div>
            <p className="eyebrow">Start with a department</p>
            <div className="mt-3 grid gap-px overflow-hidden border border-line bg-line sm:grid-cols-2">
              {HOME_DEPARTMENTS.slice(0, 4).map((department) => (
                <Link
                  key={department.id}
                  to={`/shop?category=${department.slug}`}
                  onClick={close}
                  className="group flex items-center justify-between gap-3 bg-surface px-4 py-3 transition-colors hover:bg-canvas-alt"
                >
                  <span>
                    <span className="block text-[13px] text-ink">{department.name}</span>
                    <span className="mt-0.5 block text-[11px] text-muted">{department.caption}</span>
                  </span>
                  <ArrowRight
                    className="h-3.5 w-3.5 shrink-0 text-muted transition-transform group-hover:translate-x-0.5"
                    aria-hidden="true"
                  />
                </Link>
              ))}
            </div>

            {featured.length ? (
              <div className="mt-6">
                <p className="eyebrow mb-2">In the current edit</p>
                <ul className="divide-y divide-line border-y border-line">
                  {featured.map((product) => (
                    <li key={product.id}>
                      <Link
                        to={`/products/${product.id}`}
                        onClick={close}
                        className="flex items-center justify-between gap-3 py-2.5 text-[13px] text-ink-soft transition-colors hover:text-ink"
                      >
                        <span className="truncate">{product.title}</span>
                        <span className="tabular text-[11px] text-muted">
                          {formatPrice(product.price)}
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ) : isLoading ? (
              <div className="mt-6 space-y-2">
                {[0, 1, 2].map((item) => (
                  <Skeleton key={item} className="h-9 w-full" />
                ))}
              </div>
            ) : null}
          </div>
        )}
      </div>
    </Dialog>
  )
}
