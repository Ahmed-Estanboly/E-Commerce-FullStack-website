import { Link } from 'react-router-dom'
import { ArrowUpRight } from '../ui/icons'
import { SmartImage } from '../ui/smart-image'
import {
  departmentForCategory,
  presentationForCategory,
} from '../../data/home'
import type { Product } from '../../types/product'
import { cn, formatPrice } from '../../lib/utils'

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
        </div>
      </Link>
    </article>
  )
}
