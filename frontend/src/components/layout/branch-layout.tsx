import { useDeferredValue, useState, type FormEvent, type ReactNode } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowUpRight, Menu, Package, Search, Shirt, ShoppingBag, Store, X } from '../ui/icons'
import { Logo } from '../ui/logo'
import { useStoreProducts } from '../../hooks/use-products'
import { ThemeToggle } from './theme-toggle'

const navigation = [
  { label: 'Dashboard', icon: Store, path: './' },
  { label: 'Orders', icon: ShoppingBag, path: './' },
  { label: 'Inventory', icon: Package, path: './' },
  { label: 'Products', icon: Shirt, path: '/shop' },
]

export function BranchLayout({ children, branchName, ownerName, searchPlaceholder = 'Search products' }: { children: ReactNode; branchName: string; ownerName: string; searchPlaceholder?: string }) {
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
          <span className="admin-console-label">Branch</span>
        </div>
        <nav className="admin-nav" aria-label={`${branchName} navigation`}>
          <p className="admin-nav-label">{branchName}</p>
          {navigation.slice(0, 1).map(({ label, icon: Icon, path }) => (
            <Link className="admin-nav-item is-active" key={label} to={path} onClick={closeSidebar}><Icon aria-hidden="true" /><span>{label}</span></Link>
          ))}
          <p className="admin-nav-label">Operations</p>
          {navigation.slice(1, 3).map(({ label, icon: Icon, path }) => (
            <Link className="admin-nav-item" key={label} to={path} onClick={closeSidebar}><Icon aria-hidden="true" /><span>{label}</span>{label === 'Orders' ? <small>—</small> : null}</Link>
          ))}
          <p className="admin-nav-label">Catalogue</p>
          {navigation.slice(3).map(({ label, icon: Icon, path }) => <Link className="admin-nav-item" key={label} to={path} onClick={closeSidebar}><Icon aria-hidden="true" /><span>{label}</span></Link>)}
        </nav>
        <div className="admin-sidebar-bottom">
          <Link className="admin-store-link" to="/"><ArrowUpRight aria-hidden="true" /><span>View storefront</span></Link>
          <div className="admin-sidebar-meta">NOVA BRANCH CONSOLE<br />{branchName.toUpperCase()} · LOCAL SESSION</div>
        </div>
      </aside>
      {sidebarOpen ? <button className="admin-backdrop" type="button" onClick={closeSidebar} aria-label="Close navigation" /> : null}
      <main className="admin-main">
        <header className="admin-topbar">
          <button className="admin-menu-button" type="button" onClick={() => setSidebarOpen(true)} aria-label="Open navigation"><Menu /></button>
          <form className="admin-search" onSubmit={submitSearch} role="search">
            <Search aria-hidden="true" />
            <input type="search" value={query} onChange={(event) => setQuery(event.target.value)} aria-label="Search branch products" placeholder={searchPlaceholder} />
            {deferredQuery.length >= 2 ? <div className="admin-search-results">
              {isLoading && products.length === 0 ? <p className="admin-search-status">Searching catalogue...</p> : searchResults.length ? searchResults.map((product) => <Link key={product.id} to={`/products/${product.id}`} className="admin-search-result"><span>{product.title}</span><small>{product.category.name}</small></Link>) : <p className="admin-search-status">No matching products</p>}
            </div> : null}
          </form>
          <div className="admin-topbar-actions">
            <ThemeToggle />
            <span className="admin-profile"><span className="admin-avatar">{ownerName.charAt(0)}</span><span className="admin-profile-copy"><strong>{ownerName}</strong><small>Branch owner</small></span></span>
          </div>
        </header>
        {children}
      </main>
    </div>
  )
}
