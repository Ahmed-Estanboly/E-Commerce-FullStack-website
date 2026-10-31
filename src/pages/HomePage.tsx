import { useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowRight,
  ArrowUpRight,
  Mail,
  Package,
  Plus,
  Sparkles,
  Truck,
} from '../components/ui/icons'
import { Button } from '../components/ui/button'
import { buttonStyles } from '../components/ui/button-styles'
import { SmartImage } from '../components/ui/smart-image'
import { SectionHeading } from '../components/ui/section-heading'
import { EmptyState, Skeleton } from '../components/ui/feedback'
import {
  EDITORIAL_IMAGES,
  HOME_DEPARTMENTS,
  HOME_SERVICES,
  departmentForCategory,
  presentationForCategory,
} from '../data/home'
import { useStoreProducts } from '../hooks/use-products'
import type { Department } from '../types/home'
import type { Product } from '../types/product'
import { cn, formatPrice, pluralise, truncate } from '../lib/utils'

const TWO_DIGITS = (value: number) => String(value).padStart(2, '0')

export interface HomePageProps {
  /**
   * Optional quick-add integration. The cart belongs to another owner, so the
   * homepage never imports a store. Pass a handler and the accent "Add to bag"
   * controls appear; without it the same slots link to the product instead.
   */
  onAddToCart?: (product: Product) => void
}

function AddToBag({ product, onAddToCart }: { product: Product; onAddToCart?: (product: Product) => void }) {
  if (onAddToCart) {
    return (
      <Button
        variant="accent"
        size="sm"
        onClick={() => onAddToCart(product)}
        rightIcon={<Plus className="h-3.5 w-3.5" aria-hidden="true" />}
      >
        Add to bag
      </Button>
    )
  }

  return (
    <Link
      to={`/products/${product.id}`}
      className="inline-flex h-9 items-center gap-2 border border-cream/30 px-4 font-mono text-[9px] uppercase tracking-[0.13em] text-cream transition-colors hover:border-accent hover:bg-accent hover:text-accent-ink"
    >
      View piece <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
    </Link>
  )
}

function SelectionFeature({
  product,
  department,
  onAddToCart,
}: {
  product: Product
  department?: Department
  onAddToCart?: (product: Product) => void
}) {
  return (
    <article className="on-dark-surface group flex flex-col overflow-hidden border border-line bg-charcoal text-cream">
      <div className="relative h-[440px] shrink-0 overflow-hidden sm:h-[530px] lg:h-[560px]">
        <Link
          to={`/products/${product.id}`}
          className="block h-full w-full focus-ring"
          aria-label={`View ${product.title}`}
        >
          <SmartImage
            src={product.images?.[0]}
            fallbackSrc={department?.image}
            alt={product.title}
            presentation={presentationForCategory(product.category?.name)}
            fallbackLabel={department?.name ?? 'NOVA'}
            aspect="none"
            priority
            className="h-full w-full"
            imgClassName="transition-transform duration-[900ms] ease-out group-hover:scale-[1.035]"
            sizes="(max-width: 1024px) 100vw, 58vw"
          />
        </Link>
        <div className="pointer-events-none absolute inset-x-0 top-0 flex items-start justify-between gap-4 p-5">
          <span className="border border-cream/30 bg-charcoal/70 px-2 py-1 font-mono text-[8px] uppercase tracking-[0.18em] text-cream/80 backdrop-blur-sm">
            01 / The feature
          </span>
          <span className="bg-accent px-2 py-1 font-mono text-[8px] uppercase tracking-[0.16em] text-accent-ink">
            {product.category?.name ?? 'The selection'}
          </span>
        </div>
        <div className="absolute bottom-4 left-4 right-4 flex items-end justify-between gap-4">
          <p className="max-w-[240px] text-[11px] leading-relaxed text-cream/70">
            {truncate(product.description, 120)}
          </p>
          <span className="flex h-9 w-9 shrink-0 items-center justify-center border border-cream/40 bg-charcoal/60 text-cream/80 backdrop-blur-sm transition-colors group-hover:border-accent group-hover:bg-accent group-hover:text-accent-ink">
            <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
          </span>
        </div>
      </div>

      <div className="flex flex-1 flex-col border-t border-cream/20 p-5 sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="max-w-md">
            <p className="font-mono text-[9px] uppercase tracking-[0.18em] text-cream/45">
              {department?.name ?? product.category?.name ?? 'The selection'}
            </p>
            <h3 className="mt-2 font-display text-[clamp(2rem,3.4vw,3.1rem)] leading-[0.94] tracking-[-0.04em]">
              <Link to={`/products/${product.id}`} className="transition-colors hover:text-accent">
                {product.title}
              </Link>
            </h3>
          </div>
          <div className="shrink-0 sm:text-right">
            <p className="text-[18px] tabular text-cream">{formatPrice(product.price)}</p>
            <p className="mt-1 font-mono text-[8px] uppercase tracking-[0.14em] text-cream/45">
              Each
            </p>
          </div>
        </div>

        <div className="mt-auto flex flex-wrap items-center justify-between gap-4 border-t border-cream/15 pt-4">
          <p className="text-[10px] uppercase tracking-[0.08em] text-cream/50">
            Available to order
          </p>
          <AddToBag product={product} onAddToCart={onAddToCart} />
        </div>
      </div>
    </article>
  )
}

function SelectionRow({
  product,
  department,
  onAddToCart,
}: {
  product: Product
  department?: Department
  onAddToCart?: (product: Product) => void
}) {
  return (
    <article className="group grid grid-cols-[86px_minmax(0,1fr)] gap-x-4 border-b border-line py-5 sm:grid-cols-[104px_minmax(0,1fr)_auto] sm:gap-x-5">
      <Link
        to={`/products/${product.id}`}
        className="relative row-span-2 block aspect-[4/5] overflow-hidden bg-canvas-alt focus-ring sm:row-span-1"
        aria-label={`View ${product.title}`}
      >
        <SmartImage
          src={product.images?.[0]}
          fallbackSrc={department?.image}
          alt={product.title}
          presentation={presentationForCategory(product.category?.name)}
          fallbackLabel={department?.name ?? 'NOVA'}
          aspect="none"
          className="h-full w-full"
          imgClassName="transition-transform duration-700 ease-out group-hover:scale-[1.04]"
          sizes="104px"
        />
      </Link>

      <div className="min-w-0 self-center">
        <p className="eyebrow truncate">{product.category?.name ?? department?.name ?? 'NOVA'}</p>
        <h3 className="mt-1.5 font-display text-[clamp(1.25rem,1.8vw,1.65rem)] leading-[1.02] tracking-[-0.03em]">
          <Link to={`/products/${product.id}`} className="transition-colors hover:text-ink-soft">
            {product.title}
          </Link>
        </h3>
        <p className="mt-2 text-[9px] uppercase tracking-[0.08em] text-ink-soft">
          Available to order
        </p>
      </div>

      <div className="col-start-2 mt-3 flex items-center justify-between gap-3 sm:col-start-3 sm:mt-0 sm:flex-col sm:items-end sm:justify-center">
        <p className="text-[13px] tabular text-ink">{formatPrice(product.price)}</p>
        {onAddToCart ? (
          <button
            type="button"
            onClick={() => onAddToCart(product)}
            className="focus-ring flex h-8 w-8 items-center justify-center border border-line text-ink-soft transition-colors hover:border-accent hover:bg-accent hover:text-accent-ink"
            aria-label={`Quick add ${product.title} to bag`}
          >
            <Plus className="h-3.5 w-3.5" aria-hidden="true" />
          </button>
        ) : (
          <Link
            to={`/products/${product.id}`}
            className="focus-ring flex h-8 w-8 items-center justify-center border border-line text-ink-soft transition-colors hover:border-ink hover:text-ink"
            aria-label={`View ${product.title}`}
          >
            <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
          </Link>
        )}
      </div>
    </article>
  )
}

export function HomePage({ onAddToCart }: HomePageProps) {
  const rootRef = useRef<HTMLDivElement>(null)
  const [activeDepartmentId, setActiveDepartmentId] = useState<string>(HOME_DEPARTMENTS[0].id)
  const [activeServiceId, setActiveServiceId] = useState<string>(HOME_SERVICES[0].id)
  const { products, isLoading, error, refetch } = useStoreProducts()

  const activeDepartment =
    HOME_DEPARTMENTS.find((department) => department.id === activeDepartmentId) ?? HOME_DEPARTMENTS[0]
  const activeDepartmentIndex = HOME_DEPARTMENTS.findIndex(
    (department) => department.id === activeDepartment.id,
  )
  const activeService =
    HOME_SERVICES.find((service) => service.id === activeServiceId) ?? HOME_SERVICES[0]
  const activeServiceIndex = HOME_SERVICES.findIndex((service) => service.id === activeService.id)
  const ActiveServiceIcon = activeService.icon

  const selection = useMemo(
    () => products.filter((product) => Boolean(product.images?.length)).slice(0, 6),
    [products],
  )
  const featureProduct = selection[0]
  const supportingSelection = selection.slice(1)
  const heroProduct = products[0]
  const secondHeroProduct = products[1]
  const departments = HOME_DEPARTMENTS
  const selectionDepartments = new Set(
    selection.map((product) => product.category?.name).filter(Boolean),
  ).size

  useEffect(() => {
    const root = rootRef.current
    if (!root) return
    const nodes = Array.from(root.querySelectorAll<HTMLElement>('[data-reveal]'))
    if (
      window.matchMedia('(prefers-reduced-motion: reduce)').matches ||
      !('IntersectionObserver' in window)
    ) {
      nodes.forEach((node) => node.setAttribute('data-revealed', 'true'))
      return
    }
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return
          entry.target.setAttribute('data-revealed', 'true')
          observer.unobserve(entry.target)
        })
      },
      { threshold: 0.12, rootMargin: '0px 0px -6% 0px' },
    )
    nodes.forEach((node) => {
      if (node.getAttribute('data-revealed') === 'true') return
      node.setAttribute('data-revealed', 'false')
      observer.observe(node)
    })
    return () => observer.disconnect()
  }, [products.length, isLoading])

  return (
    <div ref={rootRef} className="page-enter">
      {/* Opening frame */}
      <section className="home-hero" aria-labelledby="home-title">
        <div className="home-hero-grid" aria-hidden="true" />
        <div className="container-nova relative py-6 sm:py-8 lg:py-10">
          <div className="flex items-center justify-between gap-4 border-b border-cream/15 pb-3 font-mono text-[8px] uppercase tracking-[0.18em] text-cream/45">
            <p className="home-hero-kicker">NOVA / The living universe</p>
            <p className="hidden sm:block">Edition 01 · Autumn 2026</p>
            <p className="sm:hidden">Ed. 01 / 2026</p>
          </div>

          <div className="grid gap-10 pt-8 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:items-end lg:gap-12 lg:pt-14">
            <div className="flex min-w-0 flex-col">
              <div>
                <p className="home-hero-kicker font-mono text-[9px] uppercase tracking-[0.2em] text-accent">
                  A general store, considered
                </p>
                <h1 id="home-title" className="home-hero-title mt-5">
                  <span className="home-hero-line">
                    <span>The world,</span>
                  </span>
                  <span className="home-hero-line">
                    <span>
                      within <em className="font-light italic text-accent">reach.</em>
                    </span>
                  </span>
                </h1>
                <p className="home-hero-copy mt-6 max-w-[420px] text-[14px] leading-[1.75] text-cream/65 sm:text-[15px]">
                  Things to wear, eat, hear, read, and live with. Six departments, one deliberately
                  short edit — chosen for the way they live, not the season they belong to.
                </p>
              </div>

              <div className="home-hero-actions mt-8 flex flex-wrap items-center gap-x-5 gap-y-3">
                <Link to="/shop" className={cn(buttonStyles('accent', 'lg'), 'group')}>
                  Enter the edit
                  <ArrowRight
                    className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1"
                    aria-hidden="true"
                  />
                </Link>
                <a
                  href="#universes"
                  className="focus-ring inline-flex h-[52px] items-center gap-2 font-mono text-[9px] uppercase tracking-[0.14em] text-cream/65 transition-colors hover:text-accent"
                >
                  Choose a universe
                  <span className="h-px w-6 bg-current" aria-hidden="true" />
                </a>
              </div>

              <div className="home-hero-actions mt-8 flex flex-wrap gap-x-5 gap-y-2">
                {departments.map((department, index) => (
                  <Link
                    key={department.id}
                    to={`/shop?category=${department.slug}`}
                    className="group inline-flex items-baseline gap-1.5 font-mono text-[8px] uppercase tracking-[0.14em] text-cream/45 transition-colors hover:text-cream"
                  >
                    <span className="text-accent/80">{TWO_DIGITS(index + 1)}</span>
                    <span className="border-b border-transparent pb-0.5 transition-colors group-hover:border-cream/40">
                      {department.name.split(' ')[0]}
                    </span>
                  </Link>
                ))}
              </div>

              <div className="home-hero-copy mt-10 grid grid-cols-2 gap-5 border-t border-cream/15 pt-4">
                <a href="#services" className="focus-ring group block">
                  <span className="block font-mono text-[8px] uppercase tracking-[0.16em] text-cream/40">
                    The service
                  </span>
                  <span className="mt-1.5 flex items-center gap-1.5 text-[12px] text-cream/80 transition-colors group-hover:text-accent">
                    <Truck className="h-3 w-3" aria-hidden="true" />
                    Delivery &amp; collection
                  </span>
                </a>
                <div>
                  <span className="block font-mono text-[8px] uppercase tracking-[0.16em] text-cream/40">
                    The edit
                  </span>
                  <span className="mt-1.5 block text-[12px] text-cream/80">
                    {isLoading ? 'Loading pieces' : pluralise(products.length, 'piece')}
                    {' · '}
                    {departments.length} departments
                  </span>
                </div>
              </div>
            </div>

            <div className="home-hero-collage" aria-label="Featured departments">
              <Link
                to="/shop?category=fashion"
                className="home-hero-tile group"
                aria-label="Shop Fashion & Footwear"
              >
                <SmartImage
                  src={EDITORIAL_IMAGES.worldFashion}
                  alt="A woman in a blue coat before Milan Cathedral — illustrative fashion editorial photography"
                  presentation="fashion"
                  fallbackLabel="Fashion & Footwear"
                  aspect="none"
                  priority
                  className="absolute inset-0 h-full w-full"
                  imgClassName="hero-tile-image"
                  sizes="(max-width: 1024px) 55vw, 34vw"
                />
                <span className="hero-tile-index">01 / Style</span>
                <div className="hero-tile-bar">
                  <div className="min-w-0">
                    <p className="truncate font-display text-[17px] leading-none tracking-[-0.02em] sm:text-[20px]">
                      Fashion &amp; Footwear
                    </p>
                    <p className="mt-1 font-mono text-[8px] uppercase tracking-[0.14em] text-cream/50">
                      Enter the wardrobe
                    </p>
                  </div>
                  <ArrowUpRight
                    className="h-4 w-4 shrink-0 text-cream/60 transition-colors group-hover:text-accent"
                    aria-hidden="true"
                  />
                </div>
              </Link>

              <Link
                to={heroProduct ? `/products/${heroProduct.id}` : '/shop?category=pantry-fresh'}
                className="home-hero-tile group"
                aria-label={heroProduct ? `View ${heroProduct.title}` : 'Shop Pantry & Fresh'}
              >
                <SmartImage
                  src={heroProduct?.images?.[0]}
                  fallbackSrc={HOME_DEPARTMENTS[1].image}
                  alt={heroProduct?.title ?? 'Pantry & Fresh — illustrative department photography'}
                  presentation={heroProduct ? presentationForCategory(heroProduct.category?.name) : 'culinary'}
                  fallbackLabel="Pantry & Fresh"
                  aspect="none"
                  priority
                  className="absolute inset-0 h-full w-full"
                  imgClassName="hero-tile-image"
                  sizes="(max-width: 1024px) 40vw, 22vw"
                />
                <span className="hero-tile-index">02 / Pantry</span>
                <div className="hero-tile-bar">
                  <p className="truncate font-mono text-[8px] uppercase tracking-[0.14em] text-cream/55">
                    {heroProduct?.title ?? 'Pantry & Fresh'}
                  </p>
                  <ArrowUpRight
                    className="h-3.5 w-3.5 shrink-0 text-cream/60 transition-colors group-hover:text-accent"
                    aria-hidden="true"
                  />
                </div>
              </Link>

              <Link
                to={secondHeroProduct ? `/products/${secondHeroProduct.id}` : '/shop?category=audio-tech'}
                className="home-hero-tile group"
                aria-label={secondHeroProduct ? `View ${secondHeroProduct.title}` : 'Shop Audio & Tech'}
              >
                <SmartImage
                  src={secondHeroProduct?.images?.[0]}
                  fallbackSrc={HOME_DEPARTMENTS[2].image}
                  alt={
                    secondHeroProduct?.title ?? 'Audio & Tech — illustrative department photography'
                  }
                  presentation={
                    secondHeroProduct ? presentationForCategory(secondHeroProduct.category?.name) : 'electronics'
                  }
                  fallbackLabel="Audio & Tech"
                  aspect="none"
                  priority
                  className="absolute inset-0 h-full w-full"
                  imgClassName="hero-tile-image"
                  sizes="(max-width: 1024px) 40vw, 22vw"
                />
                <span className="hero-tile-index">03 / Audio</span>
                <div className="hero-tile-bar">
                  <p className="truncate font-mono text-[8px] uppercase tracking-[0.14em] text-cream/55">
                    {secondHeroProduct?.title ?? 'Audio & Tech'}
                  </p>
                  <ArrowUpRight
                    className="h-3.5 w-3.5 shrink-0 text-cream/60 transition-colors group-hover:text-accent"
                    aria-hidden="true"
                  />
                </div>
              </Link>
            </div>
          </div>

          <p className="mt-5 text-right font-mono text-[7px] uppercase tracking-[0.16em] text-cream/25">
            Photography is illustrative · Demo catalogue
          </p>
        </div>
      </section>

      {/* Brand strip */}
      <div className="bg-accent text-accent-ink">
        <div className="container-nova flex min-h-[42px] flex-wrap items-center justify-between gap-x-6 gap-y-1 py-2 font-mono text-[8px] uppercase tracking-[0.16em] sm:text-[9px]">
          <span>A short edit</span>
          <span className="hidden sm:inline">Six departments</span>
          <span>Chosen with care</span>
          <span className="hidden sm:inline">One house</span>
          <span className="hidden md:inline">The world, within reach</span>
        </div>
      </div>

      {/* Universe discovery */}
      <section id="universes" className="container-nova scroll-mt-28 pt-16 lg:pt-24">
        <SectionHeading
          eyebrow="01 / Universes"
          title="Choose your universe."
          description="Each department is edited differently. Enter through the one that suits the day — the shelf will change, the standard will not."
          data-reveal
        />

        <div className="mt-10 grid gap-10 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-16">
          <div className="lg:sticky lg:top-[118px] lg:self-start" data-reveal>
            <Link
              to={`/shop?category=${activeDepartment.slug}`}
              className="on-dark-surface group block border border-line bg-charcoal text-cream"
            >
              <div className="relative aspect-[4/5] overflow-hidden">
                <SmartImage
                  key={activeDepartment.id}
                  src={activeDepartment.image}
                  alt={`${activeDepartment.name} — illustrative department photography`}
                  presentation={activeDepartment.presentation}
                  fallbackLabel={activeDepartment.name}
                  aspect="none"
                  className="home-preview-image absolute inset-0 h-full w-full"
                  imgClassName="transition-transform duration-[900ms] ease-out group-hover:scale-[1.025]"
                  sizes="(max-width: 1024px) 100vw, 38vw"
                />
                <span className="absolute left-4 top-4 border border-cream/35 bg-charcoal/65 px-2 py-1 font-mono text-[8px] uppercase tracking-[0.18em] text-cream/80 backdrop-blur-sm">
                  {TWO_DIGITS(activeDepartmentIndex + 1)} / {TWO_DIGITS(departments.length)}
                </span>
              </div>
              <div className="border-t border-cream/20 p-5">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="font-mono text-[8px] uppercase tracking-[0.18em] text-cream/45">
                      {activeDepartment.presentation} department
                    </p>
                    <h3 className="mt-2 font-display text-[clamp(1.8rem,2.6vw,2.5rem)] leading-none tracking-[-0.035em]">
                      {activeDepartment.name}
                    </h3>
                  </div>
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center border border-cream/30 transition-colors group-hover:border-accent group-hover:bg-accent group-hover:text-accent-ink">
                    <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
                  </span>
                </div>
                <p className="mt-3 max-w-sm text-[12px] leading-relaxed text-cream/55">
                  {activeDepartment.caption}
                </p>
              </div>
            </Link>
          </div>

          <div className="border-t border-line" data-reveal>
            {departments.map((department, index) => {
              const active = department.id === activeDepartment.id
              return (
                <Link
                  key={department.id}
                  to={`/shop?category=${department.slug}`}
                  onMouseEnter={() => setActiveDepartmentId(department.id)}
                  onFocus={() => setActiveDepartmentId(department.id)}
                  data-active={active}
                  className="home-category-row group relative flex items-center gap-4 border-b border-line py-5 transition-colors hover:bg-canvas-alt/40 sm:gap-6 sm:py-6"
                >
                  <span
                    className={cn(
                      'font-mono text-[9px] tracking-[0.14em]',
                      active ? 'text-ink' : 'text-muted',
                    )}
                  >
                    {TWO_DIGITS(index + 1)}
                  </span>
                  <SmartImage
                    src={department.image}
                    alt=""
                    presentation={department.presentation}
                    fallbackLabel={department.name}
                    aspect="square"
                    className="h-[58px] w-[46px] shrink-0 lg:hidden"
                    sizes="46px"
                  />
                  <span className="min-w-0 flex-1">
                    <h3 className="font-display text-[clamp(1.55rem,2.5vw,2.5rem)] leading-[0.95] tracking-[-0.04em]">
                      {department.name}
                    </h3>
                    <span className="mt-2 hidden max-w-md text-[11px] leading-relaxed text-muted sm:block">
                      {department.caption}
                    </span>
                  </span>
                  <span className="home-category-arrow flex h-9 w-9 shrink-0 items-center justify-center border border-line text-ink-soft transition-colors">
                    <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
                  </span>
                  <span
                    className="home-category-line absolute bottom-0 left-0 h-[2px] w-full origin-left scale-x-0 bg-accent transition-transform duration-500"
                    aria-hidden="true"
                  />
                </Link>
              )
            })}
          </div>
        </div>
      </section>

      {/* The selection */}
      <section className="container-nova pt-16 lg:pt-24">
        <SectionHeading
          eyebrow="02 / The selection"
          title="The current selection."
          description={
            <>
              {pluralise(selection.length, 'piece')} from{' '}
              {pluralise(selectionDepartments || departments.length, 'department')}, read straight
              from the live catalogue.
            </>
          }
          action={
            <Link
              to="/shop"
              className="link-underline inline-flex items-center gap-2 font-mono text-[9px] uppercase tracking-[0.14em] text-ink-soft transition-colors hover:text-ink"
            >
              View all pieces <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
            </Link>
          }
          data-reveal
        />

        {error ? (
          <EmptyState
            className="mt-8"
            icon={Package}
            title="The edit could not be loaded."
            description={error}
            action={
              <Button variant="outline" size="sm" onClick={refetch}>
                Try again
              </Button>
            }
          />
        ) : isLoading && products.length === 0 ? (
          <div className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)] lg:gap-10">
            <Skeleton className="aspect-[4/5] w-full" />
            <div className="space-y-2">
              {[0, 1, 2, 3].map((item) => (
                <Skeleton key={item} className="h-28 w-full" />
              ))}
            </div>
          </div>
        ) : featureProduct ? (
          <div
            className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)] lg:gap-10"
            data-reveal
          >
            <SelectionFeature
              product={featureProduct}
              department={departmentForCategory(featureProduct.category?.name)}
              onAddToCart={onAddToCart}
            />
            <div>
              {supportingSelection.map((product) => (
                <SelectionRow
                  key={product.id}
                  product={product}
                  department={departmentForCategory(product.category?.name)}
                  onAddToCart={onAddToCart}
                />
              ))}
              <div className="flex items-center justify-between gap-4 pt-5">
                <p className="font-mono text-[8px] uppercase tracking-[0.14em] text-muted">
                  {pluralise(selection.length, 'piece')} · One standard
                </p>
                <Link
                  to="/shop?sort=newest"
                  className="focus-ring inline-flex h-9 items-center gap-2 border border-line px-4 font-mono text-[9px] uppercase tracking-[0.13em] text-ink-soft transition-colors hover:border-ink hover:text-ink"
                >
                  New arrivals <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                </Link>
              </div>
            </div>
          </div>
        ) : (
          <EmptyState
            className="mt-8"
            icon={Sparkles}
            title="The edit is being prepared."
            description="No pieces are available in this demo state. The catalogue refreshes as soon as the API responds."
          />
        )}
      </section>

      {/* The service — replaces NOVA's branch selector */}
      <section
        id="services"
        className="on-dark-surface mt-16 scroll-mt-28 bg-charcoal py-16 text-cream lg:mt-24 lg:py-24"
      >
        <div className="container-nova">
          <div className="grid gap-10 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-16">
            <div data-reveal>
              <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-cream/45">
                03 / The service
              </p>
              <h2 className="mt-4 font-display text-[clamp(2.9rem,5.6vw,5.8rem)] leading-[0.9] tracking-[-0.05em]">
                Chosen well,
                <br />
                <em className="font-light italic text-accent">sent with care.</em>
              </h2>
              <p className="mt-6 max-w-md text-[13px] leading-[1.8] text-cream/60">
                Delivery, collection and returns are handled from the studio. One standard of
                packing, one place to ask a question — whichever way the order reaches you.
              </p>
              <div className="mt-8 flex flex-wrap gap-1.5">
                {HOME_SERVICES.map((service, index) => {
                  const selected = service.id === activeService.id
                  return (
                    <button
                      key={service.id}
                      type="button"
                      onClick={() => setActiveServiceId(service.id)}
                      className={cn(
                        'focus-ring flex items-center gap-2 border px-3 py-2 font-mono text-[9px] uppercase tracking-[0.12em] transition-colors',
                        selected
                          ? 'border-accent bg-accent text-accent-ink'
                          : 'border-cream/25 text-cream/65 hover:border-cream/60 hover:text-cream',
                      )}
                      aria-pressed={selected}
                    >
                      <span className={selected ? 'text-accent-ink/60' : 'text-cream/35'}>
                        {TWO_DIGITS(index + 1)}
                      </span>
                      {service.name}
                    </button>
                  )
                })}
              </div>
            </div>

            <div className="border border-cream/20 bg-cream/[0.035] p-5 sm:p-7 lg:p-8" data-reveal>
              <div className="flex items-center justify-between gap-4 border-b border-cream/15 pb-3 font-mono text-[8px] uppercase tracking-[0.18em] text-cream/40">
                <span>Selected service</span>
                <span>
                  {TWO_DIGITS(activeServiceIndex + 1)} / {TWO_DIGITS(HOME_SERVICES.length)}
                </span>
              </div>
              <div className="mt-8 flex items-end justify-between gap-4">
                <p className="font-display text-[clamp(3rem,7vw,6.6rem)] leading-[0.82] tracking-[-0.055em]">
                  {activeService.name}
                </p>
                <ActiveServiceIcon
                  className="mb-2 h-7 w-7 shrink-0 text-accent"
                  strokeWidth={1.25}
                  aria-hidden="true"
                />
              </div>
              <p className="mt-4 text-[13px] text-cream/60">{activeService.caption}</p>

              <dl className="mt-8 grid gap-x-6 gap-y-5 border-t border-cream/15 pt-5 sm:grid-cols-2">
                {activeService.details.map((detail) => (
                  <div key={detail.label}>
                    <dt className="font-mono text-[8px] uppercase tracking-[0.16em] text-cream/35">
                      {detail.label}
                    </dt>
                    <dd className="mt-1.5 text-[12px] leading-relaxed text-cream/75">
                      {detail.value}
                    </dd>
                  </div>
                ))}
              </dl>

              <p className="mt-6 text-[12px] leading-relaxed text-cream/55">
                {activeService.description}
              </p>

              <div className="mt-8 flex flex-wrap gap-2">
                <Link
                  to="/shop"
                  className="inline-flex h-10 items-center gap-2 bg-accent px-4 font-mono text-[9px] uppercase tracking-[0.13em] text-accent-ink transition-colors hover:bg-accent-strong"
                >
                  Shop the edit <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                </Link>
                <a
                  href="mailto:care@nova.demo"
                  className="inline-flex h-10 items-center gap-2 border border-cream/30 px-4 font-mono text-[9px] uppercase tracking-[0.13em] text-cream/75 transition-colors hover:border-cream hover:text-cream"
                >
                  Ask the studio <Mail className="h-3.5 w-3.5" aria-hidden="true" />
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Closing */}
      <section className="container-nova py-16 lg:py-24">
        <div
          className="grid gap-8 border-t border-line pt-8 lg:grid-cols-[1fr_auto] lg:items-end"
          data-reveal
        >
          <div>
            <p className="eyebrow">04 / Begin</p>
            <h2 className="mt-4 font-display text-[clamp(3rem,7vw,7rem)] leading-[0.86] tracking-[-0.055em]">
              Start <em className="font-light italic">anywhere.</em>
            </h2>
            <p className="mt-5 max-w-md text-[13px] leading-relaxed text-muted">
              The edit is short by design. Choose a department, or let the full catalogue show you
              what is close.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link to="/shop" className={cn(buttonStyles('accent', 'lg'), 'group')}>
              Shop all pieces
              <ArrowRight
                className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1"
                aria-hidden="true"
              />
            </Link>
            <Link to="/#universes" className={buttonStyles('outline', 'lg')}>
              Browse departments
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
