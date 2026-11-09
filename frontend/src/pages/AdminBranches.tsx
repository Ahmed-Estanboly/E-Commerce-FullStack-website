import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ChevronDown } from '../components/ui/icons'
import { AdminLayout } from '../components/layout/admin-layout'
import { BranchLayout } from '../components/layout/branch-layout'
import { useStoreProducts } from '../hooks/use-products'
import type { Product } from '../types/product'

const currency = new Intl.NumberFormat('en-IE', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 })

const branches = [
  { id: 0, slug: 'north-house', name: 'North House', city: 'Dublin · N01', manager: 'Ava Byrne' },
  { id: 1, slug: 'central-house', name: 'Central House', city: 'Cork · C02', manager: 'Noah Walsh' },
  { id: 2, slug: 'south-house', name: 'South House', city: 'Galway · G03', manager: 'Mia Kelly' },
]

function getBranchProducts(products: Product[], branchId: number) {
  return products.filter((product) => product.id % branches.length === branchId)
}

function getCategoryStats(products: Product[]) {
  const stats = new Map<string, { count: number; total: number }>()
  products.forEach((product) => {
    const current = stats.get(product.category.name) ?? { count: 0, total: 0 }
    stats.set(product.category.name, { count: current.count + 1, total: current.total + product.price })
  })
  return Array.from(stats, ([name, values]) => ({ name, ...values })).sort((a, b) => b.total - a.total)
}

function PanelHeading({ children, action }: { children: string; action?: string }) {
  return (
    <div className="admin-panel-heading">
      <span>{children}</span>
      {action ? <span>{action} <ChevronDown aria-hidden="true" /></span> : null}
    </div>
  )
}

const AdminBranches = () => {
  const { branchName } = useParams<{ branchName?: string }>()
  const routeBranch = branches.find((item) => item.slug === branchName)
  const [selectedBranchId, setSelectedBranchId] = useState(routeBranch?.id ?? 0)
  const { products, isLoading, error, refetch } = useStoreProducts()
  const branch = branches[selectedBranchId]
  const branchProducts = getBranchProducts(products, selectedBranchId)
  const categoryStats = getCategoryStats(branchProducts)
  const totalValue = branchProducts.reduce((sum, product) => sum + product.price, 0)
  const averagePrice = branchProducts.length ? totalValue / branchProducts.length : 0
  const latestProducts = [...branchProducts].sort((a, b) => Date.parse(b.updatedAt) - Date.parse(a.updatedAt)).slice(0, 8)
  const maxCategoryValue = Math.max(...categoryStats.map((category) => category.total), 1)

  const dashboardContent = (
      <div className="admin-content">
        <div className="admin-page-intro">
          <div>
            <p className="eyebrow">{routeBranch ? `${branch.name} owner console` : 'Branch console · temporary assignments'}</p>
            <h1>{branch.name},<br /><em>at a glance.</em></h1>
            <p>Product performance for {branch.city}. The connected API has no branch field yet, so products are temporarily distributed by product ID.</p>
          </div>
          {!routeBranch ? <div className="admin-intro-actions">
            {branches.map((item) => (
              <button className={item.id === selectedBranchId ? 'admin-accent-button' : 'admin-outline-button'} key={item.id} type="button" onClick={() => setSelectedBranchId(item.id)}>{item.name}</button>
            ))}
          </div> : null}
        </div>

        {isLoading && products.length === 0 ? <div className="admin-panel" style={{ padding: '22px', marginTop: '14px' }}>Loading branch catalogue...</div> : <>
          <section className="admin-metrics" aria-label={`${branch.name} product metrics`}>
            <article><span>Products</span><strong>{branchProducts.length}</strong><small className="positive">Temporary branch allocation</small></article>
            <article><span>Categories</span><strong>{categoryStats.length}</strong><small className="positive">Represented here</small></article>
            <article><span>Average price</span><strong>{currency.format(averagePrice)}</strong><small>Branch catalogue average</small></article>
            <article><span>Catalogue value</span><strong>{currency.format(totalValue)}</strong><small>Sum of listed prices</small></article>
          </section>

          {error ? <div className="admin-api-error" role="alert"><span>Could not load branch catalogue: {error}</span><button type="button" onClick={refetch}>Retry</button></div> : null}

          <div className="admin-secondary-grid">
            <section className="admin-panel">
              <PanelHeading action="Branch profile">Location snapshot</PanelHeading>
              <div className="branch-list">
                <div className="branch-row"><div><span>Location</span><small>{branch.city}</small></div><i className="branch-bar branch-lime" style={{ width: '100%' }} /></div>
                <div className="branch-row"><div><span>Branch manager</span><small>{branch.manager}</small></div><i className="branch-bar" style={{ width: '82%' }} /></div>
                <div className="branch-row"><div><span>Catalogue source</span><small>Live API</small></div><i className="branch-bar" style={{ width: '64%' }} /></div>
              </div>
              <p className="panel-footnote">Temporary branch view<br />Ownership will move to API data when available</p>
            </section>
            <section className="admin-panel">
              <PanelHeading action="Total value">Category performance</PanelHeading>
              <div className="analytics-bars">{categoryStats.slice(0, 6).map((category, index) => <div className="analytics-bar-row" key={category.name}><div><span>{category.name}</span><small>{category.count} products · {currency.format(category.total)}</small></div><div className="analytics-bar-track"><i className={index === 0 ? 'branch-lime' : ''} style={{ width: `${category.total / maxCategoryValue * 100}%` }} /></div></div>)}</div>
            </section>
          </div>

          <section className="admin-panel admin-orders-panel">
            <PanelHeading action="Temporary branch allocation">Products in this branch</PanelHeading>
            <div className="admin-table admin-orders-table">
              <div className="admin-table-head"><span>Product ID</span><span>Product</span><span>Category</span><span>Updated</span><span>Price</span><span>Source</span><span /></div>
              {latestProducts.length ? latestProducts.map((product) => <div className="admin-table-row" key={product.id}><span>#{product.id}</span><span>{product.title}</span><span>{product.category.name}</span><span>{new Date(product.updatedAt).toLocaleDateString()}</span><span>{currency.format(product.price)}</span><span><em className="order-status status-complete">API</em></span><Link className="admin-row-action" to={`/products/${product.id}`}>View</Link></div>) : <div className="admin-table-row"><span>No products assigned</span></div>}
            </div>
          </section>
          <footer className="admin-footer"><span>{branch.name.toUpperCase()} · TEMPORARY BRANCH VIEW</span><span>{isLoading ? 'REFRESHING CATALOGUE' : `${branchProducts.length} PRODUCTS ASSIGNED`}</span></footer>
        </>}
      </div>
  )

  return routeBranch
    ? <BranchLayout branchName={branch.name} ownerName={branch.manager} searchPlaceholder="Search branch products">{dashboardContent}</BranchLayout>
    : <AdminLayout activePage="branches" searchPlaceholder="Search branch products">{dashboardContent}</AdminLayout>
}

export default AdminBranches
