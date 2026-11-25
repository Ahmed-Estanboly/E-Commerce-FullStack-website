import { useCallback, useMemo, useState } from 'react'
import { ArrowUpRight, Download } from '../components/ui/icons'
import { AdminLayout } from '../components/layout/admin-layout'
import { useStoreProducts } from '../hooks/use-products'
import { useBranches } from '../hooks/use-branches'
import { useFetch } from '../hooks/useFetch'
import { analyticsService, type SalesAnalytics } from '../lib/api/analytics.service'
import { SalesChart } from '../components/admin/SalesChart'
import type { Product } from '../types/product'
import { SmartImage } from '../components/ui/smart-image'

const currencyFull = new Intl.NumberFormat('en-IE', { style: 'currency', currency: 'EUR', maximumFractionDigits: 2 })
const currency = new Intl.NumberFormat('en-IE', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 })
const pct = new Intl.NumberFormat('en-IE', { style: 'percent', maximumFractionDigits: 1 })

const PERIODS = [7, 30, 90] as const
const STATUS_ORDER = ['pending', 'confirmed', 'preparing', 'ready', 'shipped', 'delivered', 'cancelled']

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

function Delta({ value, suffix = '' }: { value: number | null; suffix?: string }) {
  if (value === null) return <small className="delta flat">No prior data</small>
  const cls = value > 0.5 ? 'positive' : value < -0.5 ? 'negative' : 'flat'
  const sign = value > 0 ? '+' : ''
  return <small className={`delta ${cls}`}>{sign}{value.toFixed(1)}%{suffix}</small>
}

const AdminAnalytics = () => {
  const [days, setDays] = useState<number>(30)
  const [branchId, setBranchId] = useState<string>('')
  const [exporting, setExporting] = useState(false)
  const { products, isLoading } = useStoreProducts()
  const { branches } = useBranches()
  const salesRequest = useCallback((signal: AbortSignal) => analyticsService.sales(days, branchId || undefined, signal), [days, branchId])
  const salesResult = useFetch<SalesAnalytics>(salesRequest)
  const sales = salesResult.data

  const categories = useMemo(() => getCategoryStats(products), [products])
  const bands = ['Under €50', '€50 – €149', '€150 – €499', '€500+'].map((label) => ({
    label,
    count: products.filter((product) => getPriceBand(product.price) === label).length,
  }))
  const maxCategoryValue = Math.max(...categories.map((category) => category.total), 1)

  const categoryByProductId = useMemo(() => {
    const map = new Map<number, string>()
    products.forEach((p) => map.set(p.id, p.category.name))
    return map
  }, [products])

  const productById = useMemo(() => {
    const map = new Map<number, Product>()
    products.forEach((p) => map.set(p.id, p))
    return map
  }, [products])

  const statusRows = useMemo(() => {
    if (!sales) return []
    const known = STATUS_ORDER.map((status) => sales.byStatus.find((row) => row._id === status)).filter(Boolean) as SalesAnalytics['byStatus']
    const extras = sales.byStatus.filter((row) => !STATUS_ORDER.includes(row._id))
    return [...known, ...extras]
  }, [sales])
  const statusTotals = useMemo(() => statusRows.reduce((acc, row) => ({ count: acc.count + row.count, revenue: acc.revenue + row.revenue }), { count: 0, revenue: 0 }), [statusRows])

  const shareSegments = useMemo(() => {
    const groups = { delivered: 0, transit: 0, pending: 0, cancelled: 0 }
    statusRows.forEach((row) => {
      if (row._id === 'delivered') groups.delivered += row.count
      else if (row._id === 'cancelled') groups.cancelled += row.count
      else if (['shipped', 'ready', 'preparing'].includes(row._id)) groups.transit += row.count
      else groups.pending += row.count
    })
    const total = Math.max(groups.delivered + groups.transit + groups.pending + groups.cancelled, 1)
    return [
      { cls: 'share-delivered', label: 'Delivered', value: groups.delivered / total },
      { cls: 'share-transit', label: 'In fulfilment', value: groups.transit / total },
      { cls: 'share-pending', label: 'Pending', value: groups.pending / total },
      { cls: 'share-cancelled', label: 'Cancelled', value: groups.cancelled / total },
    ].filter((s) => s.value > 0)
  }, [statusRows])

  const handleExport = async () => {
    setExporting(true)
    try {
      const blob = await analyticsService.exportCsv(days, branchId || undefined)
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `sales-${days}d${branchId ? '-branch' : ''}.csv`
      link.click()
      URL.revokeObjectURL(url)
    } finally {
      setExporting(false)
    }
  }

  const revenueGrowth = useMemo(() => {
    if (!sales || sales.previousPeriod.revenue <= 0) return null
    return ((sales.revenue - sales.previousPeriod.revenue) / sales.previousPeriod.revenue) * 100
  }, [sales])
  const ordersGrowth = useMemo(() => {
    if (!sales || sales.previousPeriod.orders <= 0) return null
    return ((sales.orders - sales.previousPeriod.orders) / sales.previousPeriod.orders) * 100
  }, [sales])

  const insights = useMemo(() => {
    if (!sales) return []
    const rows: { label: string; value: string; note: string }[] = []
    const cancelled = statusRows.find((row) => row._id === 'cancelled')
    const delivered = statusRows.find((row) => row._id === 'delivered')
    const cancelRate = statusTotals.count ? (cancelled?.count ?? 0) / statusTotals.count : 0
    const deliveryRate = statusTotals.count ? (delivered?.count ?? 0) / statusTotals.count : 0
    const bestDay = sales.daily.reduce<{ date: string; revenue: number } | null>((best, d) => (!best || d.revenue > best.revenue ? d : best), null)
    const avgDaily = sales.revenue / Math.max(sales.periodDays, 1)

    rows.push({
      label: 'Revenue momentum',
      value: revenueGrowth === null ? '—' : `${revenueGrowth >= 0 ? '+' : ''}${revenueGrowth.toFixed(1)}%`,
      note: revenueGrowth === null ? 'No revenue in the previous period to compare' : `vs the previous ${sales.periodDays} days (€${Math.round(sales.previousPeriod.revenue).toLocaleString('en-IE')})`,
    })
    rows.push({
      label: 'Average day',
      value: currencyFull.format(avgDaily),
      note: `Revenue per day across the ${sales.periodDays}-day window`,
    })
    if (bestDay && bestDay.revenue > 0) {
      rows.push({
        label: 'Peak day',
        value: currencyFull.format(bestDay.revenue),
        note: `on ${new Date(`${bestDay.date}T00:00:00`).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'short' })}`,
      })
    }
    rows.push({
      label: 'Order health',
      value: pct.format(cancelRate),
      note: `${cancelled?.count ?? 0} of ${statusTotals.count} orders cancelled · ${pct.format(deliveryRate)} delivered`,
    })
    rows.push({
      label: 'Customer mix',
      value: `${sales.customers.newCustomers} new · ${sales.customers.returningCustomers} returning`,
      note: `${sales.customers.registered} registered buyers · ${sales.guestOrders} guest checkouts this period`,
    })
    if (!isLoading) {
      const soldCount = sales.productsSold
      const zeroSales = Math.max(products.length - soldCount, 0)
      rows.push({
        label: 'Catalogue reach',
        value: `${soldCount} / ${products.length}`,
        note: zeroSales ? `${zeroSales} product${zeroSales === 1 ? '' : 's'} recorded no sales this period` : 'Every product sold at least once',
      })
    }
    const categoryRevenue = new Map<string, number>()
    sales.topProducts.forEach((p) => {
      const name = categoryByProductId.get(p._id)
      if (name) categoryRevenue.set(name, (categoryRevenue.get(name) ?? 0) + p.revenue)
    })
    const topCategory = Array.from(categoryRevenue.entries()).sort((a, b) => b[1] - a[1])[0]
    if (topCategory) {
      rows.push({ label: 'Top category', value: topCategory[0], note: `${currencyFull.format(topCategory[1])} revenue across top sellers` })
    }
    return rows
  }, [sales, statusRows, statusTotals, products.length, isLoading, revenueGrowth, categoryByProductId])

  return (
    <AdminLayout activePage="analytics" searchPlaceholder="Search products and categories">
        <div className="admin-content">
          <div className="admin-page-intro">
            <div><p className="eyebrow">Analytics · live API data</p><h1>Read the<br /><em>collection.</em></h1><p>Sales performance, fulfilment health and catalogue signals calculated from live orders and the connected catalogue API.</p></div>
            <div className="admin-intro-actions">
              <div className="period-switch" role="group" aria-label="Analytics period">
                {PERIODS.map((p) => <button key={p} type="button" className={days === p ? 'is-active' : ''} onClick={() => setDays(p)}>{p}d</button>)}
              </div>
              <select
                value={branchId}
                onChange={(event) => setBranchId(event.target.value)}
                aria-label="Filter by branch"
                className="h-[30px] border border-line bg-canvas/40 px-3 font-mono text-[10px] uppercase text-ink outline-none focus:border-line-strong"
              >
                <option value="">All branches</option>
                {branches.map((branch) => <option key={branch._id} value={branch._id}>{branch.name}</option>)}
              </select>
              <button className="admin-outline-button" type="button" onClick={() => void handleExport()} disabled={exporting}>
                {exporting ? 'Exporting…' : 'Export CSV'} <Download aria-hidden="true" />
              </button>
              <button className="admin-accent-button" type="button" onClick={() => salesResult.refetch()}>Refresh data <ArrowUpRight aria-hidden="true" /></button>
            </div>
          </div>

          {sales ? (
            <>
              <section className="admin-metrics" aria-label="Sales summary">
                <article><span>Revenue · {sales.periodDays}d</span><strong>{currency.format(sales.revenue)}</strong><Delta value={revenueGrowth} suffix=" vs prev" /></article>
                <article><span>Orders</span><strong>{sales.orders}</strong><Delta value={ordersGrowth} suffix=" vs prev" /></article>
                <article><span>Avg order value</span><strong>{currencyFull.format(sales.averageOrderValue)}</strong><small>{sales.itemsSold} items sold</small></article>
                <article><span>Products selling</span><strong>{sales.productsSold}<span className="text-muted"> / {isLoading ? '…' : products.length}</span></strong><small>Distinct products with sales</small></article>
              </section>

              <section className="admin-panel admin-orders-panel">
                <div className="admin-panel-heading"><span>Revenue &amp; orders</span><span>Last {sales.periodDays} days</span></div>
                <SalesChart days={sales.periodDays} data={sales.daily} currency={currency} />
              </section>

              <div className="admin-secondary-grid analytics-grid">
                <section className="admin-panel">
                  <div className="admin-panel-heading"><span>Order pipeline</span><span>{statusTotals.count} orders</span></div>
                  <div className="analytics-bars">
                    {statusRows.map((row) => (
                      <div className="analytics-bar-row" key={row._id}>
                        <div><span className="capitalize">{row._id}</span><small>{row.count} orders · {currencyFull.format(row.revenue)}</small></div>
                        <div className="analytics-bar-track"><i style={{ width: `${statusTotals.count ? row.count / statusTotals.count * 100 : 0}%` }} /></div>
                      </div>
                    ))}
                    {!statusRows.length ? <p className="text-xs text-muted">No orders in this period.</p> : null}
                    {shareSegments.length ? (
                      <div>
                        <div className="status-share">{shareSegments.map((s) => <i key={s.cls} className={s.cls} style={{ width: `${s.value * 100}%` }} title={s.label} />)}</div>
                        <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1">
                          {shareSegments.map((s) => <small key={s.cls} className="font-mono text-[8px] uppercase text-muted">{s.label} {pct.format(s.value)}</small>)}
                        </div>
                      </div>
                    ) : null}
                  </div>
                </section>

                <section className="admin-panel">
                  <div className="admin-panel-heading"><span>Revenue by branch</span><span>{sales.periodDays} days</span></div>
                  <div className="analytics-bars">
                    {sales.byBranch.map((branch, index) => (
                      <div className="analytics-bar-row" key={branch.branchId}>
                        <div><span>{branch.name}</span><small>{branch.orders} orders · {currencyFull.format(branch.revenue)}</small></div>
                        <div className="analytics-bar-track"><i className={index === 0 ? 'branch-lime' : ''} style={{ width: `${sales.revenue ? branch.revenue / sales.revenue * 100 : 0}%` }} /></div>
                      </div>
                    ))}
                    {!sales.byBranch.length ? <p className="text-xs text-muted">No sales in this period.</p> : null}
                  </div>
                </section>
              </div>

              <div className="admin-secondary-grid analytics-grid">
                <section className="admin-panel">
                  <div className="admin-panel-heading"><span>Top products</span><span>By revenue · top 10</span></div>
                  <div className="admin-table analytics-products-table">
                    <div className="admin-table-head"><span>Product</span><span>Sold</span><span>Revenue</span><span>Share</span></div>
                    {sales.topProducts.slice(0, 8).map((product) => {
                      const catalogProduct = productById.get(product._id)
                      return (
                        <div className="admin-table-row" key={product._id}>
                          <span className="product-name"><SmartImage src={catalogProduct?.images?.[0]} fallbackSrc={catalogProduct?.category.image} alt="" presentation="general" fallbackLabel={product.title.slice(0, 2)} className="product-thumb" />{product.title}</span>
                          <span>{product.quantity}</span>
                          <span>{currencyFull.format(product.revenue)}</span>
                          <span>{pct.format(sales.revenue ? product.revenue / sales.revenue : 0)}</span>
                        </div>
                      )
                    })}
                    {!sales.topProducts.length ? <div className="p-4 text-xs text-muted">No sales yet.</div> : null}
                  </div>
                </section>

                <section className="admin-panel">
                  <div className="admin-panel-heading"><span>Business insights</span><span>Computed</span></div>
                  <div className="insight-list">
                    {insights.map((insight) => (
                      <div className="insight-row" key={insight.label}>
                        <span>{insight.label}</span>
                        <strong>{insight.value}</strong>
                        <em>{insight.note}</em>
                      </div>
                    ))}
                  </div>
                </section>
              </div>

              {sales.stockRisk.length ? (
                <section className="admin-panel admin-orders-panel">
                  <div className="admin-panel-heading"><span>Stock-out risk</span><span>Top sellers under 7 days cover</span></div>
                  <div className="admin-table analytics-products-table analytics-5col">
                    <div className="admin-table-head"><span>Product</span><span>Sold</span><span>Revenue</span><span>Stock</span><span>Cover</span></div>
                    {sales.stockRisk.map((product) => (
                      <div className="admin-table-row" key={product._id}>
                        <span className="product-name"><SmartImage src={productById.get(product._id)?.images?.[0]} fallbackSrc={productById.get(product._id)?.category.image} alt="" presentation="general" fallbackLabel={product.title.slice(0, 2)} className="product-thumb" />{product.title}</span>
                        <span>{product.quantity}</span>
                        <span>{currencyFull.format(product.revenue)}</span>
                        <span>{product.totalStock}</span>
                        <span>{product.totalStock === 0 ? <em className="order-status status-cancelled">Out</em> : `${product.coverDays}d`}</span>
                      </div>
                    ))}
                  </div>
                </section>
              ) : null}

              {sales.inventoryAlerts.some((b) => b.lowStock + b.outOfStock > 0) ? (
                <section className="admin-panel admin-orders-panel">
                  <div className="admin-panel-heading"><span>Inventory alerts</span><span>Low stock per branch</span></div>
                  <div className="admin-table analytics-products-table">
                    <div className="admin-table-head"><span>Branch</span><span>Low stock</span><span>Out of stock</span></div>
                    {sales.inventoryAlerts.filter((b) => b.lowStock + b.outOfStock > 0).map((branch) => (
                      <div className="admin-table-row" key={branch.branchId}><span>{branch.name}</span><span>{branch.lowStock}</span><span>{branch.outOfStock}</span></div>
                    ))}
                  </div>
                </section>
              ) : null}
            </>
          ) : null}
          {salesResult.isLoading ? <p className="p-4 text-xs text-muted">Loading sales analytics…</p> : null}
          {salesResult.error ? <div className="admin-api-error mt-4" role="alert"><span>Could not load sales analytics: {salesResult.error}</span><button type="button" onClick={salesResult.refetch}>Retry</button></div> : null}

          <div className="admin-secondary-grid analytics-grid">
            <section className="admin-panel">
              <div className="admin-panel-heading"><span>Price distribution</span><span>{products.length} products</span></div>
              <div className="analytics-bars">
                {bands.map((band, index) => (
                  <div className="analytics-bar-row" key={band.label}>
                    <div><span>{band.label}</span><small>{band.count} products · avg {band.count ? currency.format(products.filter((p) => getPriceBand(p.price) === band.label).reduce((s, p) => s + p.price, 0) / band.count) : '—'}</small></div>
                    <div className="analytics-bar-track"><i className={index === bands.length - 1 ? 'branch-lime' : ''} style={{ width: `${products.length ? band.count / products.length * 100 : 0}%` }} /></div>
                  </div>
                ))}
              </div>
            </section>
            <section className="admin-panel">
              <div className="admin-panel-heading"><span>Category catalogue value</span><span>{isLoading ? 'Loading' : `${products.length} SKUs`}</span></div>
              <div className="analytics-bars">
                {categories.slice(0, 8).map((category, index) => (
                  <div className="analytics-bar-row" key={category.name}>
                    <div><span>{category.name}</span><small>{category.count} products · {currency.format(category.total)}</small></div>
                    <div className="analytics-bar-track"><i className={index === 0 ? 'branch-lime' : ''} style={{ width: `${category.total / maxCategoryValue * 100}%` }} /></div>
                  </div>
                ))}
              </div>
            </section>
          </div>

          <footer className="admin-footer"><span>LIVE ANALYTICS · BACKEND API</span><span>{isLoading ? 'LOADING CATALOGUE' : `${products.length} PRODUCTS · ${sales ? `${sales.orders} ORDERS IN ${sales.periodDays}D` : 'NO SALES DATA'}`}</span></footer>
        </div>
    </AdminLayout>
  )
}

export default AdminAnalytics
