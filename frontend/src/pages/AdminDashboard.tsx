import { useCallback } from 'react'
import { Link } from 'react-router-dom'
import { ArrowUpRight } from '../components/ui/icons'
import { AdminLayout } from '../components/layout/admin-layout'
import { Skeleton } from '../components/ui/feedback'
import { useStoreProducts } from '../hooks/use-products'
import { useBranches } from '../hooks/use-branches'
import { useFetch } from '../hooks/useFetch'
import { analyticsService, type SalesAnalytics } from '../lib/api/analytics.service'
import { SalesChart } from '../components/admin/SalesChart'
import type { Product } from '../types/product'
import { SmartImage } from '../components/ui/smart-image'

const currency = new Intl.NumberFormat('en-IE', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 })

function buildChartPoints(values: number[]) {
  const max = Math.max(...values, 1)
  const points = values.map((value, index) => {
    const x = values.length === 1 ? 355 : 24 + (662 / (values.length - 1)) * index
    const y = 188 - (value / max) * 142
    return `${x} ${y}`
  }).join(' L ')
  return `M ${points}`
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
      {action ? <span className="admin-panel-action">{action}</span> : null}
    </div>
  )
}

function AdminDashboardSkeleton() {
  return (
    <div className="admin-dashboard-skeleton" aria-label="Loading catalogue dashboard">
      <section className="admin-metrics" aria-hidden="true">
        {Array.from({ length: 4 }, (_, index) => (
          <article key={index}><Skeleton className="h-2 w-16" /><Skeleton className="mt-3 h-8 w-20" /><Skeleton className="mt-2 h-2 w-24" /></article>
        ))}
      </section>
      <div className="admin-primary-grid">
        <section className="admin-panel"><div className="admin-panel-heading"><Skeleton className="h-2 w-40" /><Skeleton className="h-2 w-24" /></div><div className="admin-chart"><Skeleton className="h-full w-full" /></div></section>
        <section className="admin-panel"><div className="admin-panel-heading"><Skeleton className="h-2 w-32" /><Skeleton className="h-2 w-20" /></div><div className="space-y-5 p-4">{Array.from({ length: 4 }, (_, index) => <Skeleton key={index} className="h-3 w-full" />)}</div></section>
      </div>
      <div className="admin-secondary-grid">
        {Array.from({ length: 2 }, (_, index) => <section className="admin-panel" key={index}><div className="admin-panel-heading"><Skeleton className="h-2 w-32" /><Skeleton className="h-2 w-20" /></div><div className="space-y-5 p-4">{Array.from({ length: 4 }, (_, row) => <Skeleton key={row} className="h-3 w-full" />)}</div></section>)}
      </div>
      <section className="admin-panel"><div className="admin-panel-heading"><Skeleton className="h-2 w-28" /><Skeleton className="h-2 w-20" /></div><div className="space-y-5 p-4">{Array.from({ length: 5 }, (_, index) => <Skeleton key={index} className="h-3 w-full" />)}</div></section>
    </div>
  )
}

const AdminDashboard = () => {
  const { products, isLoading, error, refetch } = useStoreProducts()
  const { branches, isLoading: branchesLoading, error: branchesError, refetch: refetchBranches } = useBranches()
  const salesRequest = useCallback((signal: AbortSignal) => analyticsService.sales(30, signal), [])
  const { data: sales, error: salesError, refetch: refetchSales } = useFetch<SalesAnalytics>(salesRequest)
  const categoryStats = getCategoryStats(products)
  const latestProducts = [...products].sort((a, b) => Date.parse(b.updatedAt) - Date.parse(a.updatedAt)).slice(0, 5)
  const topProducts = [...products].sort((a, b) => b.price - a.price).slice(0, 5)
  const totalCatalogueValue = products.reduce((sum, product) => sum + product.price, 0)
  const averagePrice = products.length ? totalCatalogueValue / products.length : 0
  const chartValues = categoryStats.slice(0, 6).map((category) => category.total)
  const chartPath = buildChartPoints(chartValues.length ? chartValues : [0, 0])
  const chartAreaPath = `${chartPath} L ${chartValues.length === 1 ? 355 : 686} 202 L 24 202 Z`

  return (
    <AdminLayout activePage="dashboard">
        <div className="admin-content">
          <div className="admin-page-intro">
            <div>
              <p className="eyebrow">Catalogue overview · live API data</p>
              <h1>The house,<br /><em>at a glance.</em></h1>
              <p>Live sales, fulfilment and catalogue performance from the connected backend APIs.</p>
            </div>
          </div>

          {salesError ? <div className="admin-api-error mb-4" role="alert"><span>Could not load sales data: {salesError}</span><button type="button" onClick={refetchSales}>Retry</button></div> : null}

          {sales ? (
            <>
              <section className="admin-metrics" aria-label="Sales key performance indicators">
                <article><span>Revenue · 30d</span><strong>{currency.format(sales.revenue)}</strong><small>{sales.orders} orders</small></article>
                <article><span>Avg order value</span><strong>{currency.format(sales.averageOrderValue)}</strong><small>{sales.itemsSold} items sold</small></article>
                <article><span>Products selling</span><strong>{sales.productsSold}<span className="text-muted"> / {isLoading ? '…' : products.length}</span></strong><small>Distinct products with sales</small></article>
                <article><span>Branches selling</span><strong>{sales.byBranch.length}</strong><small>With revenue in period</small></article>
              </section>

              <div className="admin-primary-grid">
                <section className="admin-panel admin-orders-panel">
                  <PanelHeading action="30 days">Revenue &amp; orders</PanelHeading>
                  <SalesChart days={sales.periodDays} data={sales.daily} currency={currency} />
                </section>
                <section className="admin-panel admin-orders-panel">
                  <PanelHeading action="By revenue">Top sellers</PanelHeading>
                  <div className="stock-list">
                    {sales.topProducts.slice(0, 5).map((product, index) => (
                      <div className="stock-row" key={product._id}>
                        <span><b>#{String(index + 1).padStart(2, '0')}</b> {product.title}</span>
                        <small>{product.quantity} sold · {currency.format(product.revenue)}</small>
                      </div>
                    ))}
                    {!sales.topProducts.length ? <p className="p-4 text-xs text-muted">No sales recorded yet.</p> : null}
                  </div>
                  <p className="panel-footnote">Ranked by revenue<br />Last {sales.periodDays} days</p>
                </section>
              </div>
            </>
          ) : null}

          {isLoading && products.length === 0 ? <AdminDashboardSkeleton /> : <>
          <section className="admin-metrics" aria-label="Catalogue key performance indicators">
            <article><span>Products</span><strong>{isLoading ? '—' : products.length}</strong><small className="positive">Live catalogue count</small></article>
            <article><span>Categories</span><strong>{isLoading ? '—' : categoryStats.length}</strong><small className="positive">Live category count</small></article>
            <article><span>Average price</span><strong>{isLoading ? '—' : currency.format(averagePrice)}</strong><small className="positive">Across all products</small></article>
            <article><span>Catalogue value</span><strong>{isLoading ? '—' : currency.format(totalCatalogueValue)}</strong><small>Sum of listed prices</small></article>
          </section>

          <section className="admin-panel admin-orders-panel mt-4" aria-labelledby="branch-network-heading">
            <div className="admin-panel-heading">
              <span id="branch-network-heading">Branch network</span>
              <Link to="/admin/branches" className="admin-row-action">Manage branches</Link>
            </div>
            {branchesError ? (
              <div className="admin-api-error m-3" role="alert">
                <span>Could not load branches: {branchesError}</span>
                <button type="button" onClick={refetchBranches}>Retry</button>
              </div>
            ) : branchesLoading && branches.length === 0 ? (
              <div className="grid gap-px bg-line sm:grid-cols-2 xl:grid-cols-3" role="status" aria-label="Loading branches">
                {Array.from({ length: 3 }).map((_, index) => (
                  <article key={index} className="bg-surface p-4">
                    <Skeleton className="h-5 w-2/3" />
                    <Skeleton className="mt-2 h-3 w-1/2" />
                    <Skeleton className="mt-3 h-8 w-full" />
                  </article>
                ))}
              </div>
            ) : (
              <div className="grid gap-px bg-line sm:grid-cols-2 xl:grid-cols-3">
                {branches.map((branch) => (
                  <article key={branch._id} className="bg-surface p-4">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h2 className="font-display text-lg text-ink">{branch.name}</h2>
                        <p className="mt-1 text-[10px] text-muted">{branch.address}</p>
                      </div>
                      <span className={`order-status ${branch.isActive ? 'status-complete' : 'status-cancelled'}`}>
                        {branch.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                    <p className="mt-3 truncate font-mono text-[8px] uppercase text-muted">
                      {branch.ownerEmail ?? 'Manager account not assigned'}
                    </p>
                    <div className="mt-3 flex gap-2">
                      <Link to={`/admin/branches/${branch._id}/inventory`} className="admin-row-action">Inventory</Link>
                      <Link to="/admin/branches" className="admin-row-action">Branch details</Link>
                    </div>
                  </article>
                ))}
                {!branches.length && !branchesLoading ? <p className="bg-surface p-5 text-xs text-muted">No branches have been added.</p> : null}
              </div>
            )}
          </section>

          {error ? <div className="admin-api-error" role="alert"><span>Could not load catalogue data: {error}</span><button type="button" onClick={refetch}>Retry</button></div> : null}

          <div className="admin-primary-grid">
            <section className="admin-panel admin-revenue-panel"><PanelHeading action="Category value">Catalogue value by category</PanelHeading><div className="admin-chart"><div className="chart-y-labels"><span>{currency.format(Math.max(...chartValues, 0))}</span><span>Price</span><span>range</span><span>EUR</span></div><svg viewBox="0 0 720 220" role="img" aria-label="Catalogue value by product category"><defs><linearGradient id="revenue-fill" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stopColor="var(--accent)" stopOpacity="0.34" /><stop offset="1" stopColor="var(--accent)" stopOpacity="0.03" /></linearGradient></defs><path className="chart-area" d={chartAreaPath} /><path className="chart-line" d={chartPath} />{(chartValues.length ? chartValues : [0, 0]).map((value, index, values) => <circle key={`${value}-${index}`} cx={values.length === 1 ? 355 : 24 + (662 / (values.length - 1)) * index} cy={188 - (value / Math.max(...values, 1)) * 142} r="3" />)}</svg><div className="chart-months">{(categoryStats.length ? categoryStats.slice(0, 6) : [{ name: 'No data' }]).map((category) => <span key={category.name}>{category.name}</span>)}</div></div><div className="chart-legend"><span><i className="legend-line" /> Category value</span><span><i className="legend-fill" /> Live API</span><Link to="/admin/analytics">Open full analytics <ArrowUpRight aria-hidden="true" /></Link></div></section>
            <section className="admin-panel low-stock-panel"><PanelHeading action="Latest products">Latest additions</PanelHeading><div className="stock-list">{latestProducts.map((product, index) => <div className="stock-row" key={product.id}><span><b>#{String(index + 1).padStart(2, '0')}</b> {product.title}</span><small>{currency.format(product.price)}</small><div className="stock-bar"><i style={{ width: `${Math.min(100, 25 + product.price / Math.max(averagePrice, 1) * 20)}%` }} /></div></div>)}</div><p className="panel-footnote">Sorted by latest update<br />Prices and titles from the live catalogue</p></section>
          </div>

          <div className="admin-secondary-grid">
            <section className="admin-panel"><PanelHeading action="Highest listed price">Top pieces</PanelHeading><div className="admin-table admin-product-table"><div className="admin-table-head"><span>Piece</span><span>Department</span><span>ID</span><span>Price</span></div>{topProducts.map((product) => <div className="admin-table-row" key={product.id}>            <span className="product-name"><SmartImage src={product.images?.[0]} fallbackSrc={product.category.image} alt="" presentation="general" fallbackLabel={product.category.name} className="product-thumb" />{product.title}</span><span>{product.category.name}</span><span>#{product.id}</span><span>{currency.format(product.price)}</span></div>)}</div></section>
            <section className="admin-panel"><PanelHeading action="Total value">Category performance</PanelHeading><div className="branch-list">{categoryStats.slice(0, 5).map((category, index) => <div className="branch-row" key={category.name}><div><span>{category.name}</span><small>{currency.format(category.total)} · {category.count} items</small></div><i className={`branch-bar ${index === 0 ? 'branch-lime' : ''}`} style={{ width: `${categoryStats[0] ? category.total / categoryStats[0].total * 100 : 0}%` }} /></div>)}</div><p className="panel-footnote">Grouped from product categories<br />Calculated from listed prices</p></section>
          </div>

          <section className="admin-panel admin-orders-panel"><PanelHeading action="Live catalogue">Product feed</PanelHeading><div className="admin-table admin-orders-table"><div className="admin-table-head"><span>Product ID</span><span>Product</span><span>Category</span><span>Updated</span><span>Price</span><span>Source</span><span /></div>{latestProducts.map((product) => <div className="admin-table-row" key={product.id}><span>#{product.id}</span><span>{product.title}</span><span>{product.category.name}</span><span>{new Date(product.updatedAt).toLocaleDateString()}</span><span>{currency.format(product.price)}</span><span><em className="order-status status-complete">API</em></span><Link className="admin-row-action" to={`/products/${product.id}`}>View</Link></div>)}</div></section>
          <footer className="admin-footer"><span>LIVE CATALOGUE · BACKEND API</span><span>{error ? 'API ERROR · RETRY AVAILABLE' : isLoading ? 'LOADING CATALOGUE' : `LAST REFRESHED · ${products.length} PRODUCTS`}</span></footer>
          </>}
        </div>
    </AdminLayout>
  )
}

export default AdminDashboard
