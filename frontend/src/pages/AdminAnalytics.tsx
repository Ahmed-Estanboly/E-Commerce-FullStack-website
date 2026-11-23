import { useCallback } from 'react'
import { Link } from 'react-router-dom'
import { ArrowUpRight, ChevronDown } from '../components/ui/icons'
import { AdminLayout } from '../components/layout/admin-layout'
import { useStoreProducts } from '../hooks/use-products'
import { useFetch } from '../hooks/useFetch'
import { analyticsService, type SalesAnalytics } from '../lib/api/analytics.service'
import type { Product } from '../types/product'

const currencyFull = new Intl.NumberFormat('en-IE', { style: 'currency', currency: 'EUR', maximumFractionDigits: 2 })

const currency = new Intl.NumberFormat('en-IE', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 })

function getCategoryStats(products: Product[]) {
  const stats = new Map<string, { count: number; total: number }>()
  products.forEach((product) => {
    const current = stats.get(product.category.name) ?? { count: 0, total: 0 }
    stats.set(product.category.name, { count: current.count + 1, total: current.total + product.price })
  })
  return Array.from(stats, ([name, values]) => ({ name, ...values })).sort((a, b) => b.total - a.total)
}

function getPriceBand(price: number) {
  if (price < 50) return 'Under €50'
  if (price < 150) return '€50 – €149'
  if (price < 500) return '€150 – €499'
  return '€500+'
}

const AdminAnalytics = () => {
  const { products, isLoading, error, refetch } = useStoreProducts()
  const salesRequest = useCallback((signal: AbortSignal) => analyticsService.sales(30, signal), [])
  const salesResult = useFetch<SalesAnalytics>(salesRequest)
  const sales = salesResult.data
  const categories = getCategoryStats(products)
  const totalValue = products.reduce((sum, product) => sum + product.price, 0)
  const averagePrice = products.length ? totalValue / products.length : 0
  const bands = ['Under €50', '€50 – €149', '€150 – €499', '€500+'].map((label) => ({
    label,
    count: products.filter((product) => getPriceBand(product.price) === label).length,
  }))
  const maxCategoryValue = Math.max(...categories.map((category) => category.total), 1)
  const recentlyUpdated = [...products].sort((a, b) => Date.parse(b.updatedAt) - Date.parse(a.updatedAt)).slice(0, 8)

  return (
    <AdminLayout activePage="analytics" searchPlaceholder="Search products and categories">
        <div className="admin-content">
          <div className="admin-page-intro">
            <div><p className="eyebrow">Analytics · live API data</p><h1>Read the<br /><em>collection.</em></h1><p>Pricing and category signals calculated from every product currently returned by the connected catalogue API.</p></div>
            <div className="admin-intro-actions"><Link className="admin-outline-button" to="/admin/dashboard">Back to dashboard <ArrowUpRight aria-hidden="true" /></Link><button className="admin-accent-button" type="button" onClick={() => void refetch()}>Refresh data <ArrowUpRight aria-hidden="true" /></button></div>
          </div>

          <section className="admin-metrics" aria-label="Analytics summary"><article><span>Catalogue value</span><strong>{isLoading ? '—' : currency.format(totalValue)}</strong><small>Sum of listed prices</small></article><article><span>Average price</span><strong>{isLoading ? '—' : currency.format(averagePrice)}</strong><small>Across {products.length} products</small></article><article><span>Largest category</span><strong>{isLoading ? '—' : categories[0]?.name ?? '—'}</strong><small>{categories[0] ? currency.format(categories[0].total) : 'No data'}</small></article><article><span>Price bands</span><strong>{isLoading ? '—' : bands.filter((band) => band.count > 0).length}</strong><small>Active pricing ranges</small></article></section>

          {error ? <div className="admin-api-error" role="alert"><span>Could not load analytics: {error}</span><button type="button" onClick={refetch}>Retry</button></div> : null}

          <div className="admin-secondary-grid analytics-grid">
            <section className="admin-panel"><div className="admin-panel-heading"><span>Category value</span><span>Live API</span></div><div className="analytics-bars">{categories.slice(0, 8).map((category, index) => <div className="analytics-bar-row" key={category.name}><div><span>{category.name}</span><small>{category.count} products · {currency.format(category.total)}</small></div><div className="analytics-bar-track"><i className={index === 0 ? 'branch-lime' : ''} style={{ width: `${category.total / maxCategoryValue * 100}%` }} /></div></div>)}</div></section>
            <section className="admin-panel"><div className="admin-panel-heading"><span>Price distribution</span><span>{products.length} products</span></div><div className="analytics-bars">{bands.map((band, index) => <div className="analytics-bar-row" key={band.label}><div><span>{band.label}</span><small>{band.count} products</small></div><div className="analytics-bar-track"><i className={index === bands.length - 1 ? 'branch-lime' : ''} style={{ width: `${products.length ? band.count / products.length * 100 : 0}%` }} /></div></div>)}</div></section>
          </div>

          <section className="admin-panel admin-orders-panel"><div className="admin-panel-heading"><span>Recently updated products</span><span>Latest API response <ChevronDown aria-hidden="true" /></span></div><div className="admin-table analytics-products-table"><div className="admin-table-head"><span>Product</span><span>Category</span><span>Updated</span><span>Price</span></div>{recentlyUpdated.map((product) => <div className="admin-table-row" key={product.id}><span className="product-name"><img className="product-thumb" src={product.images[0]} alt="" />{product.title}</span><span>{product.category.name}</span><span>{new Date(product.updatedAt).toLocaleDateString()}</span><span>{currency.format(product.price)}</span></div>)}</div></section>
          {sales ? (
            <>
              <section className="admin-metrics" aria-label="Sales summary">
                <article><span>Revenue · 30d</span><strong>{currencyFull.format(sales.revenue)}</strong><small>{sales.orders} orders</small></article>
                <article><span>Avg order value</span><strong>{currencyFull.format(sales.averageOrderValue)}</strong><small>Last {sales.periodDays} days</small></article>
                <article><span>Top product</span><strong className="truncate">{sales.topProducts[0]?.title ?? '—'}</strong><small>{sales.topProducts[0] ? `${sales.topProducts[0].quantity} sold` : 'No sales yet'}</small></article>
                <article><span>Inventory alerts</span><strong>{sales.inventoryAlerts.reduce((sum, b) => sum + b.lowStock + b.outOfStock, 0)}</strong><small>Low / out of stock SKUs</small></article>
              </section>
              <div className="admin-secondary-grid analytics-grid">
                <section className="admin-panel"><div className="admin-panel-heading"><span>Revenue by branch</span><span>30 days</span></div><div className="analytics-bars">{sales.byBranch.map((branch, index) => <div className="analytics-bar-row" key={branch.branchId}><div><span>{branch.name}</span><small>{branch.orders} orders · {currencyFull.format(branch.revenue)}</small></div><div className="analytics-bar-track"><i className={index === 0 ? 'branch-lime' : ''} style={{ width: `${sales.revenue ? branch.revenue / sales.revenue * 100 : 0}%` }} /></div></div>)}{!sales.byBranch.length ? <p className="p-4 text-xs text-muted">No sales in this period.</p> : null}</div></section>
                <section className="admin-panel"><div className="admin-panel-heading"><span>Top products</span><span>By revenue</span></div><div className="admin-table analytics-products-table"><div className="admin-table-head"><span>Product</span><span>Sold</span><span>Revenue</span></div>{sales.topProducts.slice(0, 8).map((product) => <div className="admin-table-row" key={product._id}><span className="truncate">{product.title}</span><span>{product.quantity}</span><span>{currencyFull.format(product.revenue)}</span></div>)}{!sales.topProducts.length ? <div className="p-4 text-xs text-muted">No sales yet.</div> : null}</div></section>
              </div>
              {sales.inventoryAlerts.some((b) => b.lowStock + b.outOfStock > 0) ? (
                <section className="admin-panel"><div className="admin-panel-heading"><span>Inventory alerts</span><span>Low stock per branch</span></div><div className="admin-table analytics-products-table"><div className="admin-table-head"><span>Branch</span><span>Low stock</span><span>Out of stock</span></div>{sales.inventoryAlerts.filter((b) => b.lowStock + b.outOfStock > 0).map((branch) => <div className="admin-table-row" key={branch.branchId}><span>{branch.name}</span><span>{branch.lowStock}</span><span>{branch.outOfStock}</span></div>)}</div></section>
              ) : null}
            </>
          ) : null}
          {salesResult.error ? <div className="admin-api-error mt-4" role="alert"><span>Could not load sales analytics: {salesResult.error}</span><button type="button" onClick={salesResult.refetch}>Retry</button></div> : null}

          <footer className="admin-footer"><span>LIVE ANALYTICS · BACKEND API</span><span>{isLoading ? 'LOADING CATALOGUE' : `${products.length} PRODUCTS ANALYSED`}</span></footer>
        </div>
    </AdminLayout>
  )
}

export default AdminAnalytics
