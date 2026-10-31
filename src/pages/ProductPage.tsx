import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import {
  ArrowRight,
  ArrowUpRight,
  Check,
  Package,
  Plus,
  RotateCcw,
  ShoppingBag,
  Truck,
} from '../components/ui/icons'
import { Button } from '../components/ui/button'
import { buttonStyles } from '../components/ui/button-styles'
import { SmartImage } from '../components/ui/smart-image'
import { SectionHeading } from '../components/ui/section-heading'
import { EmptyState, Skeleton } from '../components/ui/feedback'
import { ProductCard } from '../components/storefront/product-card'
import {
  departmentForCategory,
  presentationForCategory,
} from '../data/home'
import { productsService } from '../lib/api/products.service'
import { useFetch } from '../hooks/useFetch'
import { useStoreProducts } from '../hooks/use-products'
import type { Department } from '../types/home'
import type { Product } from '../types/product'
import { cn, formatPrice, truncate } from '../lib/utils'

const MAX_QUANTITY = 10
const RELATED_LIMIT = 4

export interface ProductPageProps {
  /**
   * Optional cart integration. The cart belongs to another owner; this page
   * never creates a second cart store. The handler receives the selected
   * quantity so the cart owner can add the correct number of units.
   */
  onAddToCart?: (product: Product, quantity: number) => void
}

type Feedback = {
  tone: 'success' | 'info' | 'error'
  message: string
}

const clampQuantity = (value: number) =>
  Math.min(MAX_QUANTITY, Math.max(1, Math.trunc(value)))

function ProductGallery({
  product,
  images,
  department,
  activeIndex,
  onChange,
}: {
  product: Product
  images: string[]
  department?: Department
  activeIndex: number
  onChange: (index: number) => void
}) {
  const imageCount = Math.max(images.length, 1)
  const safeIndex = Math.min(activeIndex, imageCount - 1)
  const activeImage = images[safeIndex]
  const fallbackSrc = department?.image
  const hasMultiple = imageCount > 1

  const move = (direction: 1 | -1) => {
    onChange((safeIndex + direction + imageCount) % imageCount)
  }

  return (
    <div className={cn('grid gap-3', hasMultiple && 'sm:grid-cols-[minmax(0,1fr)_76px]')}>
      <div
        className="relative order-1 aspect-[4/5] overflow-hidden border border-line bg-canvas-alt focus-ring"
        role="group"
        aria-roledescription="carousel"
        aria-label={`${product.title} gallery`}
        tabIndex={hasMultiple ? 0 : undefined}
        onKeyDown={(event) => {
          if (!hasMultiple) return
          if (event.key === 'ArrowRight') {
            event.preventDefault()
            move(1)
          }
          if (event.key === 'ArrowLeft') {
            event.preventDefault()
            move(-1)
          }
        }}
      >
        <div
          key={`${product.id}-${safeIndex}-${activeImage ?? 'fallback'}`}
          className="home-preview-image absolute inset-0"
        >
          <SmartImage
            src={activeImage}
            fallbackSrc={fallbackSrc}
            alt={`${product.title}${hasMultiple ? ` — view ${safeIndex + 1}` : ''}`}
            presentation={presentationForCategory(product.category?.name)}
            fallbackLabel={department?.name ?? 'NOVA'}
            aspect="none"
            priority
            className="h-full w-full"
            sizes="(max-width: 1024px) 100vw, 46vw"
          />
        </div>

        <span className="absolute left-4 top-4 border border-cream/35 bg-charcoal/65 px-2 py-1 font-mono text-[8px] uppercase tracking-[0.18em] text-cream/80 backdrop-blur-sm">
          {department?.name ?? product.category?.name ?? 'The edit'}
        </span>
        <span className="absolute right-4 top-4 bg-accent px-2 py-1 font-mono text-[8px] uppercase tracking-[0.16em] text-accent-ink">
          {String(safeIndex + 1).padStart(2, '0')} / {String(imageCount).padStart(2, '0')}
        </span>

        {hasMultiple ? (
          <div className="absolute bottom-4 left-4 flex gap-1.5">
            <button
              type="button"
              onClick={() => move(-1)}
              className="focus-ring flex h-10 w-10 items-center justify-center border border-cream/40 bg-charcoal/65 text-cream backdrop-blur-sm transition-colors hover:border-accent hover:bg-accent hover:text-accent-ink"
              aria-label="Previous image"
            >
              <ArrowRight className="h-4 w-4 -rotate-180" aria-hidden="true" />
            </button>
            <button
              type="button"
              onClick={() => move(1)}
              className="focus-ring flex h-10 w-10 items-center justify-center border border-cream/40 bg-charcoal/65 text-cream backdrop-blur-sm transition-colors hover:border-accent hover:bg-accent hover:text-accent-ink"
              aria-label="Next image"
            >
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>
        ) : null}

        <span className="sr-only" aria-live="polite">
          Image {safeIndex + 1} of {imageCount}
        </span>
      </div>

      {hasMultiple ? (
        <div
          className="order-2 flex gap-2 overflow-x-auto pb-1 sm:flex-col sm:overflow-visible sm:pb-0"
          aria-label="Choose a product image"
        >
          {Array.from({ length: imageCount }).map((_, index) => {
            const selected = index === safeIndex
            return (
              <button
                key={`${product.id}-thumb-${index}`}
                type="button"
                onClick={() => onChange(index)}
                className={cn(
                  'focus-ring relative h-[76px] w-[62px] shrink-0 overflow-hidden border bg-canvas-alt transition-opacity sm:h-[92px] sm:w-full',
                  selected
                    ? 'border-accent opacity-100'
                    : 'border-line opacity-65 hover:opacity-100',
                )}
                aria-label={`View image ${index + 1} of ${imageCount}`}
                aria-pressed={selected}
              >
                <SmartImage
                  src={images[index]}
                  fallbackSrc={fallbackSrc}
                  alt=""
                  presentation={presentationForCategory(product.category?.name)}
                  fallbackLabel={department?.name ?? 'NOVA'}
                  aspect="none"
                  className="h-full w-full"
                  sizes="92px"
                />
              </button>
            )
          })}
        </div>
      ) : null}
    </div>
  )
}

function ProductBreadcrumb({
  product,
  department,
}: {
  product: Product
  department?: Department
}) {
  return (
    <nav
      aria-label="Breadcrumb"
      className="flex items-center gap-2 overflow-hidden font-mono text-[8px] uppercase tracking-[0.14em] text-muted"
    >
      <Link to="/" className="shrink-0 transition-colors hover:text-ink">
        Home
      </Link>
      <span aria-hidden="true">/</span>
      <Link to="/shop" className="shrink-0 transition-colors hover:text-ink">
        Shop
      </Link>
      <span aria-hidden="true">/</span>
      <span className="shrink-0">{department?.name ?? 'Brands'}</span>
      <span aria-hidden="true">/</span>
      <span className="truncate text-ink" aria-current="page">
        {truncate(product.title, 42)}
      </span>
    </nav>
  )
}

function ProductSkeleton() {
  return (
    <div className="container-nova py-6 lg:py-10">
      <Skeleton className="h-3 w-56" />
      <div className="mt-8 grid gap-10 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)] lg:gap-16">
        <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_76px]">
          <Skeleton className="aspect-[4/5] w-full" />
          <div className="hidden gap-2 sm:flex sm:flex-col">
            {[0, 1, 2].map((item) => (
              <Skeleton key={item} className="h-[92px] w-full" />
            ))}
          </div>
        </div>
        <div className="space-y-4 lg:pt-10">
          <Skeleton className="h-3 w-32" />
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-7 w-28" />
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-14 w-full" />
          <Skeleton className="h-[52px] w-full" />
        </div>
      </div>
    </div>
  )
}

function ProductUnavailable({
  error,
  onRetry,
}: {
  error: string | null
  onRetry: () => void
}) {
  const notFound = error?.includes('400') || error?.includes('404')
  const description = notFound
    ? 'The live catalogue did not return this piece. It may have moved or been removed from the edit.'
    : error?.toLowerCase().includes('network')
      ? 'The catalogue could not be reached. Check your connection, then try again.'
      : 'The catalogue returned an unexpected response. Please try again in a moment.'

  return (
    <div className="container-nova py-6 lg:py-10">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line pb-3">
        <nav
          aria-label="Breadcrumb"
          className="flex items-center gap-2 font-mono text-[8px] uppercase tracking-[0.14em] text-muted"
        >
          <Link to="/" className="transition-colors hover:text-ink">
            Home
          </Link>
          <span aria-hidden="true">/</span>
          <Link to="/shop" className="transition-colors hover:text-ink">
            Shop
          </Link>
          <span aria-hidden="true">/</span>
          <span className="text-ink" aria-current="page">
            This piece
          </span>
        </nav>
        <Link to="/shop" className={buttonStyles('outline', 'sm')}>
          Back to shop
        </Link>
      </div>

      <EmptyState
        className="mt-10"
        icon={Package}
        title={notFound ? 'This piece has left the edit.' : 'The piece could not be loaded.'}
        description={description}
        action={
          <div className="flex flex-wrap gap-2">
            <Button variant="accent" size="sm" onClick={onRetry}>
              Try again
            </Button>
            <Link to="/brands" className={buttonStyles('outline', 'sm')}>
              Browse the houses
            </Link>
          </div>
        }
      />
    </div>
  )
}

export function ProductPage({ onAddToCart }: ProductPageProps) {
  const { id } = useParams<{ id: string }>()
  const productId = id ?? ''

  return (
    <ProductDetail key={productId} productId={productId} onAddToCart={onAddToCart} />
  )
}

function ProductDetail({
  productId,
  onAddToCart,
}: {
  productId: string
  onAddToCart?: (product: Product, quantity: number) => void
}) {
  const [activeImageIndex, setActiveImageIndex] = useState(0)
  const [quantity, setQuantity] = useState(1)
  const [feedback, setFeedback] = useState<Feedback | null>(null)

  const request = useCallback(
    (signal: AbortSignal) => productsService.getProduct(productId, signal),
    [productId],
  )
  const { data: product, isLoading, error, refetch } = useFetch<Product>(request)
  const { products: catalogue, isLoading: catalogueLoading } = useStoreProducts(100)

  const currentProduct =
    product && String(product.id) === String(productId) ? product : null
  const department = currentProduct
    ? departmentForCategory(currentProduct.category?.name)
    : undefined

  const images = useMemo(
    () => (currentProduct?.images ?? []).filter((image) => Boolean(image?.trim())),
    [currentProduct],
  )

  const relatedProducts = useMemo(() => {
    if (!currentProduct) return []
    const pool = catalogue.filter((candidate) => candidate.id !== currentProduct.id)
    const sameCategory = pool.filter(
      (candidate) => candidate.category?.id === currentProduct.category?.id,
    )
    const otherCategories = pool.filter(
      (candidate) => candidate.category?.id !== currentProduct.category?.id,
    )
    return [...sameCategory, ...otherCategories].slice(0, RELATED_LIMIT)
  }, [catalogue, currentProduct])

  useEffect(() => {
    if (!currentProduct) return
    const previousTitle = document.title
    document.title = `${currentProduct.title} · NOVA`
    return () => {
      document.title = previousTitle
    }
  }, [currentProduct])

  useEffect(() => {
    if (!feedback) return
    const timer = window.setTimeout(() => setFeedback(null), 7000)
    return () => window.clearTimeout(timer)
  }, [feedback])

  if (isLoading && !currentProduct) return <ProductSkeleton />
  if (error || !currentProduct) {
    return <ProductUnavailable error={error} onRetry={refetch} />
  }

  const handleAddToCart = () => {
    if (!onAddToCart) {
      setFeedback({
        tone: 'info',
        message:
          'The bag is not connected in this demo build. This page is ready for the cart owner’s handler.',
      })
      return
    }

    try {
      onAddToCart(currentProduct, quantity)
      setFeedback({
        tone: 'success',
        message: `${quantity} × ${currentProduct.title} added to your bag.`,
      })
    } catch {
      setFeedback({
        tone: 'error',
        message: 'The bag could not be updated. Please try again.',
      })
    }
  }

  const feedbackTone = {
    success: 'border-success/50 bg-success-soft text-success',
    info: 'border-warning/50 bg-warning-soft text-warning',
    error: 'border-danger/50 bg-danger-soft text-danger',
  }

  return (
    <div className="page-enter">
      <div className="container-nova py-6 lg:py-9">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line pb-3">
          <ProductBreadcrumb product={currentProduct} department={department} />
          <Link
            to="/shop"
            className="focus-ring inline-flex items-center gap-2 font-mono text-[8px] uppercase tracking-[0.14em] text-ink-soft transition-colors hover:text-ink"
          >
            <ArrowRight className="h-3 w-3 -rotate-180" aria-hidden="true" />
            Back to shop
          </Link>
        </div>
      </div>

      <section className="container-nova pb-14 lg:pb-20" aria-labelledby="product-title">
        <div className="grid gap-10 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)] lg:gap-16">
          <ProductGallery
            product={currentProduct}
            images={images}
            department={department}
            activeIndex={activeImageIndex}
            onChange={setActiveImageIndex}
          />

          <div className="lg:sticky lg:top-[118px] lg:self-start">
            <div className="flex flex-wrap items-center gap-2">
              <span className="eyebrow">
                {department?.name ?? currentProduct.category?.name ?? 'The edit'}
              </span>
              <span className="h-1 w-1 bg-accent" aria-hidden="true" />
              <span className="font-mono text-[8px] uppercase tracking-[0.14em] text-muted">
                {currentProduct.category?.name ?? 'Catalogue'}
              </span>
            </div>

            <h1
              id="product-title"
              className="mt-4 font-display text-[clamp(3rem,5.4vw,5.8rem)] leading-[0.88] tracking-[-0.055em]"
            >
              {currentProduct.title}
            </h1>

            <div className="mt-6 flex flex-wrap items-baseline justify-between gap-3 border-b border-line pb-5">
              <p className="font-display text-[clamp(1.8rem,2.7vw,2.5rem)] leading-none tabular tracking-[-0.03em]">
                {formatPrice(currentProduct.price)}
              </p>
              <p className="font-mono text-[8px] uppercase tracking-[0.14em] text-muted">
                Catalogue ref. NOVA-{String(currentProduct.id).padStart(4, '0')}
              </p>
            </div>

            <p className="mt-5 text-[13px] leading-[1.8] text-ink-soft">
              {currentProduct.description}
            </p>

            <dl className="mt-7 grid grid-cols-2 gap-x-6 gap-y-5 border-y border-line py-5">
              <div>
                <dt className="font-mono text-[8px] uppercase tracking-[0.16em] text-muted">
                  House
                </dt>
                <dd className="mt-1.5 text-[12px] text-ink">
                  {department ? department.name : 'The edit'}
                </dd>
              </div>
              <div>
                <dt className="font-mono text-[8px] uppercase tracking-[0.16em] text-muted">
                  Category
                </dt>
                <dd className="mt-1.5 text-[12px] text-ink">
                  {currentProduct.category?.name ?? 'This edit'}
                </dd>
              </div>
              <div>
                <dt className="font-mono text-[8px] uppercase tracking-[0.16em] text-muted">
                  Reference
                </dt>
                <dd className="mt-1.5 text-[12px] tabular text-ink">
                  NOVA-{String(currentProduct.id).padStart(4, '0')}
                </dd>
              </div>
              <div>
                <dt className="font-mono text-[8px] uppercase tracking-[0.16em] text-muted">
                  The service
                </dt>
                <dd className="mt-1.5 text-[12px] text-ink">
                  <Link
                    to="/#services"
                    className="link-underline transition-colors hover:text-ink-soft"
                  >
                    Delivery &amp; returns
                  </Link>
                </dd>
              </div>
            </dl>

            <div className="mt-7">
              <div className="flex items-end justify-between gap-4">
                <p className="eyebrow">Quantity</p>
                <p className="font-mono text-[8px] uppercase tracking-[0.12em] text-muted">
                  Maximum {MAX_QUANTITY}
                </p>
              </div>

              <div className="mt-3 flex flex-wrap gap-2">
                <div className="flex h-[52px] items-stretch border border-line bg-surface">
                  <button
                    type="button"
                    onClick={() => setQuantity((current) => clampQuantity(current - 1))}
                    disabled={quantity <= 1}
                    className="focus-ring flex w-11 items-center justify-center text-ink-soft transition-colors hover:bg-canvas-alt hover:text-ink disabled:pointer-events-none disabled:opacity-35"
                    aria-label="Decrease quantity"
                  >
                    <span className="block h-px w-3.5 bg-current" aria-hidden="true" />
                  </button>
                  <span className="flex w-12 items-center justify-center border-x border-line">
                    <input
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      value={quantity}
                      onChange={(event) => {
                        const next = Number.parseInt(
                          event.target.value.replace(/\D/g, ''),
                          10,
                        )
                        setQuantity(Number.isFinite(next) ? clampQuantity(next) : 1)
                      }}
                      className="w-full bg-transparent text-center font-mono text-[12px] tabular text-ink outline-none"
                      aria-label="Quantity"
                    />
                  </span>
                  <button
                    type="button"
                    onClick={() => setQuantity((current) => clampQuantity(current + 1))}
                    disabled={quantity >= MAX_QUANTITY}
                    className="focus-ring flex w-11 items-center justify-center text-ink-soft transition-colors hover:bg-canvas-alt hover:text-ink disabled:pointer-events-none disabled:opacity-35"
                    aria-label="Increase quantity"
                  >
                    <Plus className="h-4 w-4" aria-hidden="true" />
                  </button>
                </div>

                <Button
                  variant="accent"
                  size="lg"
                  onClick={handleAddToCart}
                  className="min-w-[190px] flex-1"
                  leftIcon={<ShoppingBag className="h-4 w-4" aria-hidden="true" />}
                >
                  Add to bag · {formatPrice(currentProduct.price * quantity)}
                </Button>
              </div>

              <div aria-live="polite" className="min-h-[38px]">
                {feedback ? (
                  <p
                    className={cn(
                      'animate-menu mt-3 flex items-start gap-2 border px-3 py-2 text-[11px] leading-relaxed',
                      feedbackTone[feedback.tone],
                    )}
                  >
                    {feedback.tone === 'success' ? (
                      <Check className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                    ) : (
                      <Package className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                    )}
                    {feedback.message}
                  </p>
                ) : null}
              </div>
            </div>

            <div className="mt-5 grid gap-3 border-t border-line pt-5 sm:grid-cols-2">
              <p className="flex items-start gap-2 text-[11px] leading-relaxed text-muted">
                <Truck className="mt-0.5 h-4 w-4 shrink-0 text-ink-soft" strokeWidth={1.4} aria-hidden="true" />
                Delivery in 2–4 working days, tracked from the studio.
              </p>
              <p className="flex items-start gap-2 text-[11px] leading-relaxed text-muted">
                <RotateCcw className="mt-0.5 h-4 w-4 shrink-0 text-ink-soft" strokeWidth={1.4} aria-hidden="true" />
                Thirty-day returns on unworn pieces in original packaging.
              </p>
            </div>
          </div>
        </div>
      </section>

      {catalogueLoading || relatedProducts.length > 0 ? (
        <section
          className="container-nova pb-16 lg:pb-24"
          aria-labelledby="related-title"
        >
          <SectionHeading
            eyebrow="In the same room"
            title={<span id="related-title">Related pieces.</span>}
            description={`More from ${currentProduct.category?.name ?? 'the wider edit'}, chosen from the same live catalogue.`}
            action={
              <Link
                to={`/shop?category=${department?.slug ?? ''}`}
                className="link-underline inline-flex items-center gap-2 font-mono text-[9px] uppercase tracking-[0.14em] text-ink-soft transition-colors hover:text-ink"
              >
                All pieces <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
              </Link>
            }
          />

          <div className="mt-8 grid gap-x-5 gap-y-9 sm:grid-cols-2 lg:grid-cols-4">
            {catalogueLoading
              ? [0, 1, 2, 3].map((item) => (
                  <div key={item}>
                    <Skeleton className="aspect-[4/5] w-full" />
                    <Skeleton className="mt-4 h-3 w-20" />
                    <Skeleton className="mt-2 h-5 w-4/5" />
                  </div>
                ))
              : relatedProducts.map((related) => (
                  <ProductCard
                    key={related.id}
                    product={related}
                    eyebrow="Related piece"
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                  />
                ))}
          </div>
        </section>
      ) : null}

      <section className="container-nova pb-16">
        <div className="flex flex-col gap-4 border-t border-line pt-6 sm:flex-row sm:items-center sm:justify-between">
          <Link
            to="/shop"
            className="focus-ring inline-flex items-center gap-2 font-mono text-[9px] uppercase tracking-[0.14em] text-ink-soft transition-colors hover:text-ink"
          >
            <ArrowRight className="h-3.5 w-3.5 -rotate-180" aria-hidden="true" />
            Back to shop
          </Link>
          <Link
            to="/shop"
            className="focus-ring inline-flex items-center gap-2 font-mono text-[9px] uppercase tracking-[0.14em] text-ink-soft transition-colors hover:text-ink"
          >
            Explore {department?.name ?? 'the houses'}
            <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
          </Link>
        </div>
      </section>
    </div>
  )
}
