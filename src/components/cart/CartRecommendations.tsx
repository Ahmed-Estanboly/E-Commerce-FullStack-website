import { Link } from 'react-router-dom'
import { ArrowRight, Plus } from '../ui/icons'
import { SmartImage } from '../ui/smart-image'
import { Skeleton } from '../ui/feedback'
import { formatPrice, truncate } from '../../lib/utils'
import { presentationForCategory } from '../../data/home'
import type { Product } from '../../types/product'

export interface CartRecommendationsProps {
  products: Product[]
  isLoading: boolean
  error: string | null
  onAdd: (product: Product) => void
  shopHref?: string
}

/** Suggested products for the cart, excluding products already in the selection. */
export function CartRecommendations({
  products,
  isLoading,
  error,
  onAdd,
  shopHref = '/shop',
}: CartRecommendationsProps) {
  return (
    <section className="mt-14 border-t border-line pt-5 sm:mt-16" aria-labelledby="cart-recommendations">
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="font-mono text-[7px] uppercase tracking-[0.18em] text-muted">Complete the room</p>
          <h2 id="cart-recommendations" className="mt-1 font-display text-2xl tracking-[-0.035em]">
            Pieces to <em className="font-light italic text-accent">consider.</em>
          </h2>
        </div>
        <Link
          to={shopHref}
          className="focus-ring inline-flex items-center gap-1 font-mono text-[7px] uppercase tracking-[0.12em] text-muted transition-colors hover:text-accent"
        >
          All pieces <ArrowRight className="h-3 w-3" aria-hidden="true" />
        </Link>
      </div>
      {error ? (
        <p className="mt-5 text-[11px] text-muted" role="status">
          The edit could not be loaded right now. Please try again later.
        </p>
      ) : isLoading && products.length === 0 ? (
        <div className="mt-5 grid grid-cols-2 gap-3 lg:grid-cols-3">
          {[0, 1, 2].map((item) => (
            <Skeleton key={item} className="aspect-[4/5]" />
          ))}
        </div>
      ) : products.length > 0 ? (
        <ul className="mt-5 grid grid-cols-2 gap-3 lg:grid-cols-3 lg:gap-4">
          {products.map((product) => (
            <li key={product.id} className="group min-w-0">
              <div className="relative overflow-hidden bg-canvas-alt">
                <Link
                  to={`/products/${product.id}`}
                  className="block aspect-[4/5] focus-ring"
                  aria-label={`View ${product.title}`}
                >
                  <SmartImage
                    src={product.images[0]}
                    alt={product.title}
                    presentation={presentationForCategory(product.category?.name)}
                    fallbackLabel={product.category?.name ?? 'NOVA'}
                    aspect="none"
                    className="h-full w-full"
                    imgClassName="transition-transform duration-700 group-hover:scale-[1.035]"
                    sizes="(max-width: 1024px) 50vw, 33vw"
                  />
                </Link>
                <button
                  type="button"
                  onClick={() => onAdd(product)}
                  className="focus-ring absolute bottom-2 right-2 flex h-8 w-8 items-center justify-center border border-line-strong bg-surface/90 text-ink transition-colors hover:border-accent hover:bg-accent hover:text-accent-ink"
                  aria-label={`Add ${product.title} to bag`}
                >
                  <Plus className="h-3.5 w-3.5" aria-hidden="true" />
                </button>
              </div>
              <p className="mt-2 font-mono text-[7px] uppercase tracking-[0.12em] text-muted">
                {product.category?.name ?? 'Selected piece'}
              </p>
              <div className="mt-0.5 flex items-start justify-between gap-2">
                <Link
                  to={`/products/${product.id}`}
                  className="line-clamp-2 min-w-0 font-display text-[14px] leading-tight transition-colors hover:text-accent sm:text-[16px]"
                >
                  {truncate(product.title, 48)}
                </Link>
                <span className="shrink-0 pt-0.5 font-mono text-[8px] tabular text-muted">
                  {formatPrice(product.price)}
                </span>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-5 text-[11px] text-muted">There are no other pieces in the edit just yet.</p>
      )}
    </section>
  )
}
