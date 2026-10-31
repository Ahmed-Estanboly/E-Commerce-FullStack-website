import { useState, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { ArrowUpRight, Menu, Package, Search, Settings, Shirt, ShoppingBag, Store, Users, X } from '../ui/icons'
import { Logo } from '../ui/logo'
import { ThemeToggle } from './theme-toggle'

type AdminPage = 'dashboard' | 'analytics'

const navigation = [
  { label: 'Dashboard', icon: Store, path: '/admin/dashboard', page: 'dashboard' as AdminPage },
  { label: 'Analytics', icon: ArrowUpRight, path: '/admin/analytics', page: 'analytics' as AdminPage },
  { label: 'Orders', icon: ShoppingBag, path: '/admin/dashboard' },
  { label: 'Inventory', icon: Package, path: '/admin/dashboard' },
  { label: 'Customers', icon: Users, path: '/admin/dashboard' },
  { label: 'Products', icon: Shirt, path: '/admin/dashboard' },
  { label: 'Categories', icon: Store, path: '/admin/dashboard' },
]

export function AdminLayout({ children, activePage, searchPlaceholder = 'Search orders, products, people' }: { children: ReactNode; activePage: AdminPage; searchPlaceholder?: string }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const closeSidebar = () => setSidebarOpen(false)

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
          {navigation.slice(0, 2).map(({ label, icon: Icon, path, page }) => (
            <Link className={`admin-nav-item${page === activePage ? ' is-active' : ''}`} key={label} to={path} onClick={closeSidebar}>
              <Icon aria-hidden="true" /><span>{label}</span>
            </Link>
          ))}
          <p className="admin-nav-label">Operations</p>
          {navigation.slice(2, 5).map(({ label, icon: Icon, path }) => (
            <Link className="admin-nav-item" key={label} to={path} onClick={closeSidebar}><Icon aria-hidden="true" /><span>{label}</span>{label === 'Orders' ? <small>84</small> : null}</Link>
          ))}
          <p className="admin-nav-label">Catalogue</p>
          {navigation.slice(5).map(({ label, icon: Icon, path }) => <Link className="admin-nav-item" key={label} to={path} onClick={closeSidebar}><Icon aria-hidden="true" /><span>{label}</span></Link>)}
        </nav>
        <div className="admin-sidebar-bottom">
          <button className="admin-nav-item" type="button"><Settings aria-hidden="true" /><span>Settings</span></button>
          <Link className="admin-store-link" to="/"><ArrowUpRight aria-hidden="true" /><span>View storefront</span></Link>
          <div className="admin-sidebar-meta">NOVA OPERATIONS CONSOLE<br />LIVE CATALOGUE · LOCAL SESSION</div>
        </div>
      </aside>
      {sidebarOpen ? <button className="admin-backdrop" type="button" onClick={closeSidebar} aria-label="Close navigation" /> : null}
      <main className="admin-main">
        <header className="admin-topbar">
          <button className="admin-menu-button" type="button" onClick={() => setSidebarOpen(true)} aria-label="Open navigation"><Menu /></button>
          <div className="admin-search"><Search aria-hidden="true" /><input aria-label="Search admin area" placeholder={searchPlaceholder} /></div>
          <div className="admin-topbar-actions">
            <Link className="admin-icon-button" to="/admin/dashboard" aria-label="Open dashboard"><ArrowUpRight /></Link>
            <ThemeToggle />
            <span className="admin-profile"><span className="admin-avatar">EV</span><span className="admin-profile-copy"><strong>Elena Voss</strong><small>Owner</small></span></span>
          </div>
        </header>
        {children}
      </main>
    </div>
  )
}
