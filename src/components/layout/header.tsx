import { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { Menu, Search, ShoppingBag } from '../ui/icons'
import { buttonStyles } from '../ui/button-styles'
import { Drawer } from '../ui/drawer'
import { Logo } from '../ui/logo'
import { SearchOverlay } from './search-overlay'
import { ThemeToggle } from './theme-toggle'
import { HOME_DEPARTMENTS } from '../../data/home'
import type { Department } from '../../types/home'
import { cn } from '../../lib/utils'

export interface HeaderProps {
  /** Store name rendered in the wordmark. Defaults to NOVA. */
  brandName?: string
  /** Top announcement bar copy. */
  announcement?: string
  /** Total units in the cart. Wire this to the shared cart context when ready. */
  cartCount?: number
  /** Defaults to navigating to `/cart`. */
  onCartClick?: () => void
  /** Departments used by the mobile menu links. */
  departments?: Department[]
  /**
   * Optional dashboard destination, e.g. `/admin/dashboard` or
   * `/owner/dashboard`. The Dashboard action renders only when this prop is
   * supplied; the Header performs no role or permission checks.
   */
  dashboardHref?: string
}

/** Navigation mirrors the routes agreed in the team brief. */
const navigation = [
  { to: '/', label: 'Home' },
  { to: '/shop', label: 'Shop' },
  { to: '/#universes', label: 'Departments' },
  { to: '/#contact', label: 'Contact' },
] as const

export function Header({
  brandName = 'NOVA',
  announcement = 'One house, six departments. A deliberately short edit.',
  cartCount = 0,
  onCartClick,
  departments = HOME_DEPARTMENTS,
  dashboardHref,
}: HeaderProps) {
  const location = useLocation()
  const navigate = useNavigate()
  const [searchOpen, setSearchOpen] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)

  const isActive = (to: string) => {
    if (to.includes('#')) return false
    if (to === '/') return location.pathname === '/'
    if (to === '/shop') {
      return location.pathname.startsWith('/shop') || location.pathname.startsWith('/products')
    }
    return location.pathname.startsWith(to)
  }

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault()
        setSearchOpen(true)
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [])

  const openCart = () => {
    if (onCartClick) {
      onCartClick()
      return
    }
    navigate('/cart')
  }

  return (
    <>
      <header className="sticky top-0 z-50">
        <div className="site-topbar bg-bar text-bar-ink">
          <div className="container-nova flex h-[30px] items-center justify-between gap-4">
            <p className="flex items-center gap-2 truncate font-mono text-[8px] uppercase tracking-[0.16em] sm:text-[9px]">
              <span className="h-2 w-2 shrink-0 bg-accent" aria-hidden="true" />
              {announcement}
            </p>
            <p className="hidden shrink-0 font-mono text-[8px] uppercase tracking-[0.16em] text-bar-ink/65 md:block">
              The world, within reach · Six departments
            </p>
          </div>
        </div>

        <div className="border-b border-line bg-[var(--header)] backdrop-blur-xl">
          <div className="container-nova relative flex h-[64px] items-center justify-between gap-4 lg:h-[74px]">
            <div className="flex items-center gap-2.5 lg:gap-4">
              <button
                type="button"
                onClick={() => setMenuOpen(true)}
                className="focus-ring -ml-2 flex h-10 w-10 items-center justify-center text-ink-soft transition-colors hover:bg-canvas-alt hover:text-ink lg:hidden"
                aria-label="Open menu"
                aria-expanded={menuOpen}
              >
                <Menu className="h-5 w-5" strokeWidth={1.5} aria-hidden="true" />
              </button>
              <Logo brandName={brandName} />
              <span className="hidden border-l border-line pl-4 font-mono text-[8px] uppercase leading-relaxed tracking-[0.16em] text-muted xl:block">
                The living
                <br />
                universe
              </span>
            </div>

            <nav
              aria-label="Main navigation"
              className="absolute left-1/2 hidden -translate-x-1/2 items-center gap-8 lg:flex"
            >
              {navigation.map((item) => (
                <Link
                  key={item.to}
                  to={item.to}
                  className="nav-link"
                  data-active={isActive(item.to)}
                  aria-current={isActive(item.to) ? 'page' : undefined}
                >
                  {item.label}
                </Link>
              ))}
              {dashboardHref ? (
                <Link
                  to={dashboardHref}
                  className="nav-link"
                  data-active={isActive(dashboardHref)}
                  aria-current={isActive(dashboardHref) ? 'page' : undefined}
                >
                  Dashboard
                </Link>
              ) : null}
            </nav>

            <div className="flex items-center gap-0.5 sm:gap-1">
              <button
                type="button"
                onClick={() => setSearchOpen(true)}
                className="focus-ring flex h-10 w-10 items-center justify-center border border-transparent text-ink-soft transition-colors hover:border-line hover:bg-canvas-alt hover:text-ink"
                aria-label="Search products"
              >
                <Search className="h-[17px] w-[17px]" strokeWidth={1.5} aria-hidden="true" />
              </button>
              <ThemeToggle />
              <div className="hidden items-center gap-2 pl-1 lg:flex">
                <Link
                  to="/login"
                  className="nav-link text-[11px] tracking-[0.12em]"
                  data-active={isActive('/login')}
                  aria-current={isActive('/login') ? 'page' : undefined}
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  className={cn(
                    'focus-ring border px-3 py-2 font-mono text-[9px] uppercase tracking-[0.12em] transition-colors',
                    isActive('/register')
                      ? 'border-ink text-ink'
                      : 'border-line text-ink-soft hover:border-ink hover:text-ink',
                  )}
                  aria-current={isActive('/register') ? 'page' : undefined}
                >
                  Register
                </Link>
              </div>
              <button
                type="button"
                onClick={openCart}
                className="focus-ring relative ml-0.5 flex h-10 w-10 items-center justify-center border border-transparent text-ink-soft transition-colors hover:border-line hover:bg-canvas-alt hover:text-ink"
                aria-label={`Open bag, ${cartCount} ${cartCount === 1 ? 'item' : 'items'}`}
              >
                <ShoppingBag className="h-[17px] w-[17px]" strokeWidth={1.5} aria-hidden="true" />
                {cartCount > 0 ? (
                  <span className="absolute -right-0.5 top-0 flex h-[17px] min-w-[17px] items-center justify-center bg-accent px-1 font-mono text-[9px] leading-none text-accent-ink">
                    {cartCount > 99 ? '99+' : cartCount}
                  </span>
                ) : null}
              </button>
            </div>
          </div>
        </div>
      </header>

      {searchOpen ? <SearchOverlay open onClose={() => setSearchOpen(false)} /> : null}

      <Drawer
        open={menuOpen}
        onClose={() => setMenuOpen(false)}
        title={brandName}
        eyebrow="Menu"
        side="left"
        className="max-w-[380px]"
        footer={
          <div className="space-y-3">
            <p className="eyebrow">The departments</p>
            <div className="flex flex-wrap gap-1.5">
              {departments.map((department) => (
                <Link
                  key={department.id}
                  to={`/shop?category=${department.slug}`}
                  onClick={() => setMenuOpen(false)}
                  className="border border-line px-2.5 py-1.5 text-[10px] text-ink-soft transition-colors hover:border-ink hover:text-ink"
                >
                  {department.name}
                </Link>
              ))}
            </div>
          </div>
        }
      >
        <nav aria-label="Mobile navigation" className="border-b border-line pb-5">
          {navigation.map((item, index) => (
            <Link
              key={item.to}
              to={item.to}
              className="group flex items-baseline justify-between border-b border-line/60 py-3.5 text-[22px] tracking-[-0.02em] text-ink last:border-0"
              onClick={() => setMenuOpen(false)}
            >
              <span className="font-display">{item.label}</span>
              <span className="font-mono text-[9px] text-muted">0{index + 1}</span>
            </Link>
          ))}
          {dashboardHref ? (
            <Link
              to={dashboardHref}
              className="group flex items-baseline justify-between border-b border-line/60 py-3.5 text-[22px] tracking-[-0.02em] text-ink last:border-0"
              onClick={() => setMenuOpen(false)}
            >
              <span className="font-display">Dashboard</span>
              <span className="font-mono text-[9px] text-muted">0{navigation.length + 1}</span>
            </Link>
          ) : null}
        </nav>

        <div className="mt-6 grid gap-2">
          <Link
            to="/login"
            onClick={() => setMenuOpen(false)}
            className={buttonStyles('primary', 'md', true)}
          >
            Login
          </Link>
          <Link
            to="/register"
            onClick={() => setMenuOpen(false)}
            className={buttonStyles('outline', 'md', true)}
          >
            Register
          </Link>
        </div>

        <div className="mt-6">
          <p className="eyebrow mb-3">The house</p>
          <div className="space-y-1">
            <Link
              to="/shop"
              onClick={() => setMenuOpen(false)}
              className="block py-2 text-[13px] text-ink-soft transition-colors hover:text-ink"
            >
              Shop the full edit
            </Link>
            <Link
              to="/#services"
              onClick={() => setMenuOpen(false)}
              className="block py-2 text-[13px] text-ink-soft transition-colors hover:text-ink"
            >
              Delivery &amp; returns
            </Link>
            <Link
              to="/cart"
              onClick={() => setMenuOpen(false)}
              className="block py-2 text-[13px] text-ink-soft transition-colors hover:text-ink"
            >
              Your bag{cartCount > 0 ? ` (${cartCount})` : ''}
            </Link>
          </div>

          <p className="mt-4 border-t border-line pt-4 text-[10px] leading-relaxed text-muted">
            Demo storefront. No real orders, payments or personal data are processed.
          </p>
        </div>
      </Drawer>
    </>
  )
}
