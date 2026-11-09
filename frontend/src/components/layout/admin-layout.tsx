import { useDeferredValue, useState, type FormEvent, type ReactNode } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowUpRight, Menu, Package, Search, Shirt, ShoppingBag, Store, Users, X } from '../ui/icons'
import { Logo } from '../ui/logo'
import { useStoreProducts } from '../../hooks/use-products'
import { ThemeToggle } from './theme-toggle'

type AdminPage = 'dashboard' | 'analytics' | 'branches'

const navigation = [
  { label: 'Dashboard', icon: Store, path: '/admin/dashboard', page: 'dashboard' as AdminPage },
  { label: 'Analytics', icon: ArrowUpRight, path: '/admin/analytics', page: 'analytics' as AdminPage },
  { label: 'Branches', icon: Store, path: '/admin/branches', page: 'branches' as AdminPage },
  { label: 'Orders', icon: ShoppingBag, path: '/admin/dashboard' },
  { label: 'Inventory', icon: Package, path: '/admin/dashboard' },
  { label: 'Customers', icon: Users, path: '/admin/dashboard' },
  { label: 'Products', icon: Shirt, path: '/shop' },
  { label: 'Categories', icon: Store, path: '/#universes' },
]

export function AdminLayout({ children, activePage, searchPlaceholder = 'Search orders, products, people' }: { children: ReactNode; activePage: AdminPage; searchPlaceholder?: string }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [query, setQuery] = useState('')
  const deferredQuery = useDeferredValue(query.trim().toLowerCase())
  const navigate = useNavigate()
  const { products, isLoading } = useStoreProducts()
  const searchResults = deferredQuery.length >= 2
    ? products.filter((product) => `${product.title} ${product.description} ${product.category?.name ?? ''}`.toLowerCase().includes(deferredQuery)).slice(0, 5)
    : []

  const closeSidebar = () => setSidebarOpen(false)
  const submitSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const value = query.trim()
    if (value) navigate(`/shop?q=${encodeURIComponent(value)}`)
  }

  return (
    <div className="admin-shell">
      <aside className={`admin-sidebar${sidebarOpen ? ' is-open' : ''}`}>
        <div className="admin-sidebar-top">
          <Logo className="text-inverse-ink" brandName="NOVA" to="/" />
          <button className="admin-close-button" type="button" onClick={closeSidebar} aria-label="Close navigation"><X /></button>
          <span className="admin-console-label">Console</span>
        </div>
        <nav className="admin-nav" aria-label="Admin navigation">
          <p className="admin-nav-label">Overview</p>
          {navigation.slice(0, 3).map(({ label, icon: Icon, path, page }) => (
            <Link className={`admin-nav-item${page === activePage ? ' is-active' : ''}`} key={label} to={path} onClick={closeSidebar}>
              <Icon aria-hidden="true" /><span>{label}</span>
            </Link>
          ))}
          <p className="admin-nav-label">Operations</p>
          {navigation.slice(3, 6).map(({ label, icon: Icon, path }) => (
            <Link className="admin-nav-item" key={label} to={path} onClick={closeSidebar}><Icon aria-hidden="true" /><span>{label}</span>{label === 'Orders' ? <small>84</small> : null}</Link>
          ))}
          <p className="admin-nav-label">Catalogue</p>
          {navigation.slice(6).map(({ label, icon: Icon, path }) => <Link className="admin-nav-item" key={label} to={path} onClick={closeSidebar}><Icon aria-hidden="true" /><span>{label}</span></Link>)}
        </nav>
        <div className="admin-sidebar-bottom">
          <Link className="admin-store-link" to="/"><ArrowUpRight aria-hidden="true" /><span>View storefront</span></Link>
          <div className="admin-sidebar-meta">NOVA OPERATIONS CONSOLE<br />LIVE CATALOGUE · LOCAL SESSION</div>
        </div>
      </aside>
      {sidebarOpen ? <button className="admin-backdrop" type="button" onClick={closeSidebar} aria-label="Close navigation" /> : null}
      <main className="admin-main">
        <header className="admin-topbar">
          <button className="admin-menu-button" type="button" onClick={() => setSidebarOpen(true)} aria-label="Open navigation"><Menu /></button>
          <form className="admin-search" onSubmit={submitSearch} role="search">
            <Search aria-hidden="true" />
            <input type="search" value={query} onChange={(event) => setQuery(event.target.value)} aria-label="Search admin area" placeholder={searchPlaceholder} />
            {deferredQuery.length >= 2 ? <div className="admin-search-results">
              {isLoading && products.length === 0 ? <p className="admin-search-status">Searching catalogue...</p> : searchResults.length ? searchResults.map((product) => <Link key={product.id} to={`/products/${product.id}`} className="admin-search-result"><span>{product.title}</span><small>{product.category.name}</small></Link>) : <p className="admin-search-status">No matching products</p>}
            </div> : null}
          </form>
          <div className="admin-topbar-actions">

            <ThemeToggle />
            <span className="admin-profile"><span className="admin-avatar">A</span><span className="admin-profile-copy"><strong>Admin</strong><small>Owner</small></span></span>
          </div>
        </header>
        {children}
      </main>
    </div>
  )
}
