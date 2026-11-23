import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowUpRight } from '../ui/icons'
import { SmartImage } from '../ui/smart-image'
import {
  departmentForCategory,
  presentationForCategory,
} from '../../data/home'
import type { Product } from '../../types/product'
import { cn, formatPrice } from '../../lib/utils'
import { getStoredSession } from '../../lib/auth'
import { wishlistService } from '../../lib/api/wishlist.service'

export interface ProductCardProps {
  product: Product
  /** Optional override for the small line above the title. */
  eyebrow?: string
  className?: string
  priority?: boolean
  sizes?: string
}

/**
 * Shared editorial product card used by the brands directory and related
 * pieces. It follows the homepage's image treatment, fallback behaviour and
 * link pattern without importing a second data or styling layer.
 */
export function ProductCard({
  product,
  eyebrow,
  className,
  priority = false,
  sizes = '(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw',
}: ProductCardProps) {
  const department = departmentForCategory(product.category?.name)
  const label =
    eyebrow ?? product.category?.name ?? department?.name ?? 'The edit'
  const navigate = useNavigate()
  const [wishlisted, setWishlisted] = useState(false)
  const [wishBusy, setWishBusy] = useState(false)
  const canWishlist = Boolean(getStoredSession()?.user)

  const toggleWishlist = async (event: React.MouseEvent) => {
    event.preventDefault()
    event.stopPropagation()
    if (!canWishlist) {
      navigate('/login')
      return
    }
    setWishBusy(true)
    try {
      if (wishlisted) {
        await wishlistService.remove(product.id)
        setWishlisted(false)
      } else {
        await wishlistService.add(product.id)
        setWishlisted(true)
      }
    } finally {
      setWishBusy(false)
    }
  }

  return (
    <article className={cn('product-media group min-w-0', className)}>
      <Link
        to={`/products/${product.id}`}
        className="focus-ring block"
        aria-label={`View ${product.title}`}
      >
        <div className="relative aspect-[4/5] overflow-hidden border border-line bg-canvas-alt">
          <SmartImage
            src={product.images?.[0]}
            fallbackSrc={department?.image}
            alt={product.title}
            presentation={presentationForCategory(product.category?.name)}
            fallbackLabel={department?.name ?? 'NOVA'}
            aspect="none"
            priority={priority}
            className="absolute inset-0 h-full w-full"
            imgClassName="transition-transform duration-[800ms] ease-out group-hover:scale-[1.035]"
            sizes={sizes}
            primary
          />
          <span className="absolute left-3 top-3 border border-cream/30 bg-charcoal/65 px-2 py-1 font-mono text-[8px] uppercase tracking-[0.16em] text-cream/80 backdrop-blur-sm">
            {label}
          </span>
          {product.stock <= 0 ? (
            <span className="absolute right-3 top-3 border border-cream/30 bg-charcoal/75 px-2 py-1 font-mono text-[8px] uppercase tracking-[0.12em] text-cream/90">
              Out of stock
            </span>
          ) : null}
          <button
            type="button"
            onClick={(event) => void toggleWishlist(event)}
            disabled={wishBusy}
            aria-label={wishlisted ? `Remove ${product.title} from wishlist` : `Save ${product.title} to wishlist`}
            aria-pressed={wishlisted}
            className={cn(
              'absolute right-3 top-3 flex h-9 w-9 items-center justify-center border backdrop-blur-sm transition-colors disabled:opacity-40',
              product.stock <= 0 ? 'top-14' : '',
              wishlisted
                ? 'border-accent bg-accent text-accent-ink'
                : 'border-cream/40 bg-charcoal/65 text-cream/80 hover:border-accent hover:text-accent',
            )}
          >
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill={wishlisted ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
              <path d="M12 20.5C7 16.5 3 13.3 3 9.3 3 6.4 5.2 4.5 7.7 4.5c1.7 0 3.3.9 4.3 2.4 1-1.5 2.6-2.4 4.3-2.4 2.5 0 4.7 1.9 4.7 4.8 0 4-4 7.2-9 11.2Z" />
            </svg>
          </button>
          <span className="absolute bottom-3 right-3 flex h-9 w-9 items-center justify-center border border-cream/40 bg-charcoal/65 text-cream/80 backdrop-blur-sm transition-colors group-hover:border-accent group-hover:bg-accent group-hover:text-accent-ink">
            <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
          </span>
        </div>

        <div className="pt-4">
          <p className="eyebrow truncate">
            {product.category?.name ?? department?.name ?? 'NOVA'}
          </p>
          <div className="mt-1.5 flex items-start justify-between gap-4">
            <h3 className="font-display text-[clamp(1.2rem,1.7vw,1.55rem)] leading-[1.03] tracking-[-0.03em] transition-colors group-hover:text-ink-soft">
              {product.title}
            </h3>
            <p className="shrink-0 pt-0.5 text-[13px] tabular text-ink">
              {formatPrice(product.price)}
            </p>
          </div>
          <p className={cn(
            'mt-2 font-mono text-[8px] uppercase tracking-[0.1em]',
            product.stock > 0 ? 'text-muted' : 'text-danger',
          )}>
            {product.stock > 0 ? `${product.stock} available at this branch` : 'Unavailable at this branch'}
          </p>
          {product.ratingCount ? (
            <p className="mt-1 font-mono text-[8px] uppercase tracking-[0.1em] text-muted">
              <span className="text-accent">★</span> {product.ratingAverage?.toFixed(1)} · {product.ratingCount}{' '}
              {product.ratingCount === 1 ? 'review' : 'reviews'}
            </p>
          ) : null}
        </div>
      </Link>
    </article>
  )
}
