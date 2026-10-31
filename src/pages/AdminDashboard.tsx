import { Link } from 'react-router-dom'
import { ArrowUpRight, ChevronDown } from '../components/ui/icons'
import { AdminLayout } from '../components/layout/admin-layout'
import { useStoreProducts } from '../hooks/use-products'
import type { Product } from '../types/product'

const currency = new Intl.NumberFormat('en-IE', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 })

function buildChartPoints(values: number[]) {
  const max = Math.max(...values, 1)
  return values.map((value, index) => {
    const x = values.length === 1 ? 355 : 24 + (662 / (values.length - 1)) * index
    const y = 188 - (value / max) * 142
    return `${x} ${y}`
  }).join(' L')
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
      {action ? <button className="admin-panel-action" type="button">{action}<ChevronDown aria-hidden="true" /></button> : null}
    </div>
  )
}

const AdminDashboard = () => {
  const { products, isLoading, error, refetch } = useStoreProducts()
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
              <p>Product, category and pricing performance from the connected catalogue API. Order and stock data will appear when those endpoints are available.</p>
            </div>
            <div className="admin-intro-actions"><button className="admin-outline-button" type="button">Last 6 months <ChevronDown aria-hidden="true" /></button><button className="admin-outline-button" type="button">Export CSV</button><button className="admin-accent-button" type="button">New demo order <ArrowUpRight aria-hidden="true" /></button></div>
          </div>

          <section className="admin-metrics" aria-label="Catalogue key performance indicators">
            <article><span>Products</span><strong>{isLoading ? '—' : products.length}</strong><small className="positive">Live catalogue count</small></article>
            <article><span>Categories</span><strong>{isLoading ? '—' : categoryStats.length}</strong><small className="positive">Live category count</small></article>
            <article><span>Average price</span><strong>{isLoading ? '—' : currency.format(averagePrice)}</strong><small className="positive">Across all products</small></article>
            <article><span>Catalogue value</span><strong>{isLoading ? '—' : currency.format(totalCatalogueValue)}</strong><small>Sum of listed prices</small></article>
          </section>

          {error ? <div className="admin-api-error" role="alert"><span>Could not load catalogue data: {error}</span><button type="button" onClick={refetch}>Retry</button></div> : null}

          <div className="admin-primary-grid">
            <section className="admin-panel admin-revenue-panel"><PanelHeading action="Category value">Catalogue value by category</PanelHeading><div className="admin-chart"><div className="chart-y-labels"><span>{currency.format(Math.max(...chartValues, 0))}</span><span>Price</span><span>range</span><span>EUR</span></div><svg viewBox="0 0 720 220" role="img" aria-label="Catalogue value by product category"><defs><linearGradient id="revenue-fill" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stopColor="var(--accent)" stopOpacity="0.34" /><stop offset="1" stopColor="var(--accent)" stopOpacity="0.03" /></linearGradient></defs><path className="chart-area" d={chartAreaPath} /><path className="chart-line" d={chartPath} />{(chartValues.length ? chartValues : [0, 0]).map((value, index, values) => <circle key={`${value}-${index}`} cx={values.length === 1 ? 355 : 24 + (662 / (values.length - 1)) * index} cy={188 - (value / Math.max(...values, 1)) * 142} r="3" />)}</svg><div className="chart-months">{(categoryStats.length ? categoryStats.slice(0, 6) : [{ name: 'No data' }]).map((category) => <span key={category.name}>{category.name}</span>)}</div></div><div className="chart-legend"><span><i className="legend-line" /> Category value</span><span><i className="legend-fill" /> Live API</span><Link to="/admin/analytics">Open full analytics <ArrowUpRight aria-hidden="true" /></Link></div></section>
            <section className="admin-panel low-stock-panel"><PanelHeading action="Latest products">Latest additions</PanelHeading><div className="stock-list">{latestProducts.map((product, index) => <div className="stock-row" key={product.id}><span><b>#{String(index + 1).padStart(2, '0')}</b> {product.title}</span><small>{currency.format(product.price)}</small><div className="stock-bar"><i style={{ width: `${Math.min(100, 25 + product.price / Math.max(averagePrice, 1) * 20)}%` }} /></div></div>)}</div><p className="panel-footnote">Sorted by latest update<br />Prices and titles from the live catalogue</p></section>
          </div>

          <div className="admin-secondary-grid">
            <section className="admin-panel"><PanelHeading action="Highest listed price">Top pieces</PanelHeading><div className="admin-table admin-product-table"><div className="admin-table-head"><span>Piece</span><span>Department</span><span>ID</span><span>Price</span></div>{topProducts.map((product) => <div className="admin-table-row" key={product.id}><span className="product-name"><img className="product-thumb" src={product.images[0]} alt="" />{product.title}</span><span>{product.category.name}</span><span>#{product.id}</span><span>{currency.format(product.price)}</span></div>)}</div></section>
            <section className="admin-panel"><PanelHeading action="Total value">Category performance</PanelHeading><div className="branch-list">{categoryStats.slice(0, 5).map((category, index) => <div className="branch-row" key={category.name}><div><span>{category.name}</span><small>{currency.format(category.total)} · {category.count} items</small></div><i className={`branch-bar ${index === 0 ? 'branch-lime' : ''}`} style={{ width: `${categoryStats[0] ? category.total / categoryStats[0].total * 100 : 0}%` }} /></div>)}</div><p className="panel-footnote">Grouped from product categories<br />Calculated from listed prices</p></section>
          </div>

          <section className="admin-panel admin-orders-panel"><PanelHeading action="Live catalogue">Product feed</PanelHeading><div className="admin-table admin-orders-table"><div className="admin-table-head"><span>Product ID</span><span>Product</span><span>Category</span><span>Updated</span><span>Price</span><span>Source</span><span /></div>{latestProducts.map((product) => <div className="admin-table-row" key={product.id}><span>#{product.id}</span><span>{product.title}</span><span>{product.category.name}</span><span>{new Date(product.updatedAt).toLocaleDateString()}</span><span>{currency.format(product.price)}</span><span><em className="order-status status-complete">API</em></span><button className="admin-row-action" type="button">View</button></div>)}</div></section>
          <footer className="admin-footer"><span>LIVE CATALOGUE · ESCUELAJS API</span><span>{error ? 'API ERROR · RETRY AVAILABLE' : isLoading ? 'LOADING CATALOGUE' : `LAST REFRESHED · ${products.length} PRODUCTS`}</span></footer>
        </div>
    </AdminLayout>
  )
}

export default AdminDashboard
