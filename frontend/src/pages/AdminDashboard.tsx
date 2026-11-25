import { useCallback, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowUpRight } from '../components/ui/icons'
import { AdminLayout } from '../components/layout/admin-layout'
import { Skeleton } from '../components/ui/feedback'
import { useStoreProducts } from '../hooks/use-products'
import { useBranches } from '../hooks/use-branches'
import { useFetch } from '../hooks/useFetch'
import { analyticsService, type SalesAnalytics } from '../lib/api/analytics.service'
import { SalesChart } from '../components/admin/SalesChart'

const currency = new Intl.NumberFormat('en-IE', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 })
const currencyFull = new Intl.NumberFormat('en-IE', { style: 'currency', currency: 'EUR', maximumFractionDigits: 2 })

const STATUS_ORDER = ['pending', 'confirmed', 'preparing', 'ready', 'shipped', 'delivered', 'cancelled']
const PERIODS = [7, 30, 90] as const

function PanelHeading({ children, action }: { children: string; action?: string }) {
  return (
    <div className="admin-panel-heading">
      <span>{children}</span>
      {action ? <span className="admin-panel-action">{action}</span> : null}
    </div>
  )
}

function SalesSkeleton() {
  return (
    <div aria-label="Loading sales data">
      <section className="admin-metrics" aria-hidden="true">
        {Array.from({ length: 4 }, (_, index) => (
          <article key={index}><Skeleton className="h-2 w-16" /><Skeleton className="mt-3 h-8 w-20" /><Skeleton className="mt-2 h-2 w-24" /></article>
        ))}
      </section>
      <div className="admin-primary-grid">
        <section className="admin-panel"><PanelHeading action="30 days">Revenue &amp; orders</PanelHeading><Skeleton className="m-4 h-40 w-auto" /></section>
        <section className="admin-panel"><PanelHeading action="By revenue">Top sellers</PanelHeading><div className="space-y-5 p-4">{Array.from({ length: 5 }, (_, index) => <Skeleton key={index} className="h-3 w-full" />)}</div></section>
      </div>
    </div>
  )
}

const AdminDashboard = () => {
  const { isLoading: productsLoading } = useStoreProducts()
  const { branches, isLoading: branchesLoading, error: branchesError, refetch: refetchBranches } = useBranches()
  const [days, setDays] = useState<number>(30)
  const salesRequest = useCallback((signal: AbortSignal) => analyticsService.sales(days, undefined, signal), [days])
  const { data: sales, error: salesError, refetch: refetchSales, isLoading: salesLoading } = useFetch<SalesAnalytics>(salesRequest)

  const revenueGrowth = useMemo(() => {
    if (!sales || sales.previousPeriod.revenue <= 0) return null
    return ((sales.revenue - sales.previousPeriod.revenue) / sales.previousPeriod.revenue) * 100
  }, [sales])

  const statusRows = useMemo(() => {
    if (!sales) return []
    const known = STATUS_ORDER.map((status) => sales.byStatus.find((row) => row._id === status)).filter(Boolean) as SalesAnalytics['byStatus']
    const extras = sales.byStatus.filter((row) => !STATUS_ORDER.includes(row._id))
    return [...known, ...extras]
  }, [sales])
  const statusTotal = statusRows.reduce((sum, row) => sum + row.count, 0)
  const stockAlerts = sales?.inventoryAlerts.filter((b) => b.lowStock + b.outOfStock > 0) ?? []
  const pendingCount = statusRows.filter((row) => ['pending', 'confirmed', 'preparing'].includes(row._id)).reduce((sum, row) => sum + row.count, 0)

  return (
    <AdminLayout activePage="dashboard">
        <div className="admin-content">
          <div className="admin-page-intro">
            <div>
              <p className="eyebrow">Business overview · live API data</p>
              <h1>The house,<br /><em>at a glance.</em></h1>
              <p>Sales, fulfilment and branch operations.</p>
            </div>
            <div className="admin-intro-actions">
              <div className="period-switch" role="group" aria-label="Dashboard period">
                {PERIODS.map((p) => <button key={p} type="button" className={days === p ? 'is-active' : ''} onClick={() => setDays(p)}>{p}d</button>)}
              </div>
              <Link className="admin-outline-button" to="/admin/analytics">Full analytics <ArrowUpRight aria-hidden="true" /></Link>
            </div>
          </div>

          {salesError ? <div className="admin-api-error mb-4" role="alert"><span>Could not load sales data: {salesError}</span><button type="button" onClick={refetchSales}>Retry</button></div> : null}

          {sales ? (
            <>
              <section className="admin-metrics" aria-label="Sales key performance indicators">
                <article><span>Revenue · {sales.periodDays}d</span><strong>{currency.format(sales.revenue)}</strong>{revenueGrowth === null ? <small>No prior data</small> : <small className={`delta ${revenueGrowth > 0.5 ? 'positive' : revenueGrowth < -0.5 ? 'negative' : 'flat'}`}>{revenueGrowth > 0 ? '+' : ''}{revenueGrowth.toFixed(1)}% vs prev</small>}<small>{sales.orders} orders</small></article>
                <article><span>Avg order value</span><strong>{currency.format(sales.averageOrderValue)}</strong><small>{sales.itemsSold} items sold</small></article>
                <article><span>Awaiting fulfilment</span><strong>{pendingCount}</strong><small>Pending / confirmed / preparing</small></article>
                <article><span>Stock alerts</span><strong>{stockAlerts.reduce((sum, b) => sum + b.lowStock + b.outOfStock, 0)}</strong><small>{stockAlerts.length} branch{stockAlerts.length === 1 ? '' : 'es'} affected</small></article>
              </section>

              <div className="admin-primary-grid">
                <section className="admin-panel admin-orders-panel">
                  <PanelHeading action={`${sales.periodDays} days`}>Revenue &amp; orders</PanelHeading>
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

              <div className="admin-secondary-grid">
                <section className="admin-panel">
                  <PanelHeading action={`${statusTotal} orders`}>Order pipeline</PanelHeading>
                  <div className="analytics-bars">
                    {statusRows.map((row) => (
                      <div className="analytics-bar-row" key={row._id}>
                        <div><span className="capitalize">{row._id}</span><small>{row.count} · {currencyFull.format(row.revenue)}</small></div>
                        <div className="analytics-bar-track"><i className={row._id === 'delivered' ? 'branch-lime' : ''} style={{ width: `${statusTotal ? row.count / statusTotal * 100 : 0}%` }} /></div>
                      </div>
                    ))}
                    {!statusRows.length ? <p className="p-4 text-xs text-muted">No orders in this period.</p> : null}
                  </div>
                </section>

                <section className="admin-panel">
                  <PanelHeading action="Low stock">Inventory alerts</PanelHeading>
                  {stockAlerts.length ? (
                    <div className="admin-table analytics-products-table">
                      <div className="admin-table-head"><span>Branch</span><span>Low stock</span><span>Out of stock</span></div>
                      {stockAlerts.map((branch) => (
                        <div className="admin-table-row" key={branch.branchId}><span>{branch.name}</span><span>{branch.lowStock}</span><span>{branch.outOfStock}</span></div>
                      ))}
                    </div>
                  ) : (
                    <p className="p-4 text-xs text-muted">All branches are adequately stocked.</p>
                  )}
                  <p className="panel-footnote">SKUs under 5 units or at zero<br />Across all branches</p>
                </section>
              </div>

              <div className="admin-secondary-grid">
                <section className="admin-panel">
                  <PanelHeading action={`${sales.periodDays} days`}>Revenue by branch</PanelHeading>
                  <div className="analytics-bars">
                    {sales.byBranch.map((branch, index) => (
                      <div className="analytics-bar-row" key={branch.branchId}>
                        <div><span>{branch.name}</span><small>{branch.orders} orders · {currencyFull.format(branch.revenue)}</small></div>
                        <div className="analytics-bar-track"><i className={index === 0 ? 'branch-lime' : ''} style={{ width: `${sales.revenue ? branch.revenue / sales.revenue * 100 : 0}%` }} /></div>
                      </div>
                    ))}
                    {!sales.byBranch.length ? <p className="p-4 text-xs text-muted">No sales in this period.</p> : null}
                  </div>
                </section>

                <section className="admin-panel">
                  <PanelHeading action="Registered customers">New vs returning</PanelHeading>
                  <div className="analytics-bars">
                    <div className="analytics-bar-row">
                      <div><span>Returning customers</span><small>Ordered before this period</small></div>
                      <div className="analytics-bar-track"><i className="branch-lime" style={{ width: `${sales.customers.registered ? sales.customers.returningCustomers / sales.customers.registered * 100 : 0}%` }} /></div>
                    </div>
                    <div className="analytics-bar-row">
                      <div><span>New customers</span><small>First order in this period</small></div>
                      <div className="analytics-bar-track"><i style={{ width: `${sales.customers.registered ? sales.customers.newCustomers / sales.customers.registered * 100 : 0}%` }} /></div>
                    </div>
                    <div className="analytics-bar-row">
                      <div><span>Guest checkouts</span><small>Orders without an account</small></div>
                      <div className="analytics-bar-track"><i style={{ width: `${sales.orders ? sales.guestOrders / sales.orders * 100 : 0}%` }} /></div>
                    </div>
                  </div>
                  <p className="panel-footnote">
                    {sales.customers.registered} registered buyers · {sales.customers.newCustomers} new · {sales.customers.returningCustomers} returning<br />
                    {sales.guestOrders} guest orders in period
                  </p>
                </section>
              </div>

              {sales.stockRisk.length ? (
                <section className="admin-panel admin-orders-panel">
                  <PanelHeading action="Restock now">Top sellers at risk of stockout</PanelHeading>
                  <div className="admin-table analytics-products-table analytics-5col">
                    <div className="admin-table-head"><span>Product</span><span>Sold</span><span>Revenue</span><span>Stock</span><span>Cover</span></div>
                    {sales.stockRisk.map((product) => (
                      <div className="admin-table-row" key={product._id}>
                        <span className="truncate">{product.title}</span>
                        <span>{product.quantity}</span>
                        <span>{currencyFull.format(product.revenue)}</span>
                        <span>{product.totalStock}</span>
                        <span>{product.totalStock === 0 ? <em className="order-status status-cancelled">Out</em> : `${product.coverDays}d`}</span>
                      </div>
                    ))}
                  </div>
                  <p className="panel-footnote">Top sellers with under 7 days of stock cover<br />Across all branches</p>
                </section>
              ) : null}
            </>
          ) : salesLoading ? <SalesSkeleton /> : null}

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

          <footer className="admin-footer"><span>LIVE DASHBOARD · BACKEND API</span><span>{sales ? `LAST ${sales.periodDays} DAYS · ${sales.orders} ORDERS` : productsLoading ? 'LOADING' : 'NO SALES DATA'}</span></footer>
        </div>
    </AdminLayout>
  )
}

export default AdminDashboard
