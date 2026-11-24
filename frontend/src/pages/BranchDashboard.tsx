import { useCallback } from 'react'
import { Link, useParams } from 'react-router-dom'
import { BranchLayout } from '../components/layout/branch-layout'
import { useFetch } from '../hooks/useFetch'
import { branchesService, type InventoryAlerts } from '../lib/api/branches.service'
import { ordersService, normalizeOrders } from '../lib/api/orders.service'
import { getStoredSession } from '../lib/auth'
import type { BackendOrder } from '../lib/api/orders.service'
import { OrderStatusSelect } from '../components/orders/OrderStatusSelect'
import { Skeleton } from '../components/ui/feedback'
import type { Branch, BranchInventoryItem } from '../types/branch'

const currency = new Intl.NumberFormat('en-IE', { style: 'currency', currency: 'EUR', maximumFractionDigits: 2 })

export default function BranchDashboard() {
  const { branchName: branchId = '' } = useParams<{ branchName: string }>()
  const branchRequest = useCallback(
    (signal: AbortSignal) => branchesService.getBranch(branchId, signal),
    [branchId],
  )
  const inventoryRequest = useCallback(
    (signal: AbortSignal) => branchesService.getBranchInventory(branchId, signal),
    [branchId],
  )
  const ordersRequest = useCallback(
    async (signal: AbortSignal) => normalizeOrders(await ordersService.getBranchOrders(branchId, undefined, signal)),
    [branchId],
  )
  const alertsRequest = useCallback(
    (signal: AbortSignal) => branchesService.getInventoryAlerts(branchId, 5, signal),
    [branchId],
  )
  const branchResult = useFetch<Branch>(branchRequest)
  const inventoryResult = useFetch<BranchInventoryItem[]>(inventoryRequest)
  const ordersResult = useFetch<BackendOrder[]>(ordersRequest)
  const alertsResult = useFetch<InventoryAlerts>(alertsRequest)
  const branch = branchResult.data
  const inventory = (inventoryResult.data ?? []).filter((item) => item.isAssigned)
  const orders = ordersResult.data ?? []
  const totalUnits = inventory.reduce((sum, item) => sum + item.quantity, 0)
  const lowStock = inventory.filter((item) => item.quantity > 0 && item.quantity < 5)
  const stockValue = inventory.reduce((sum, item) => sum + item.price * item.quantity, 0)
  const ownerName = getStoredSession()?.user.name ?? branch?.name ?? 'Branch manager'

  const content = (
    <div className="admin-content">
      {!branch && branchResult.isLoading ? (
        <div className="admin-panel p-6" role="status" aria-label="Loading branch dashboard">
          <Skeleton className="h-8 w-56" />
          <Skeleton className="mt-3 h-4 w-80" />
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, index) => <Skeleton key={index} className="h-24 w-full" />)}
          </div>
          <Skeleton className="mt-6 h-64 w-full" />
        </div>
      ) : !branch || branchResult.error ? (
        <div className="admin-api-error" role="alert">
          <span>{branchResult.error ?? 'This branch could not be found.'}</span>
          <button type="button" onClick={branchResult.refetch}>Retry</button>
        </div>
      ) : (
        <>
          <div className="admin-page-intro">
            <div>
              <p className="eyebrow">{branch.name} · Branch dashboard</p>
              <h1>Your store,<br /><em>at a glance.</em></h1>
              <p>{branch.address} · {branch.phone} · {branch.workingHours}</p>
            </div>
            <div className="admin-intro-actions">
              <Link to={`/${branchId}/inventory`} className="admin-accent-button">Manage inventory</Link>
            </div>
          </div>

          <section className="admin-metrics" aria-label={`${branch.name} dashboard metrics`}>
            <article><span>Catalogue items</span><strong>{inventoryResult.isLoading ? '—' : inventory.length}</strong><small>Available to manage</small></article>
            <article><span>Units in stock</span><strong>{inventoryResult.isLoading ? '—' : totalUnits}</strong><small>Across this branch</small></article>
            <article><span>Low stock</span><strong>{inventoryResult.isLoading ? '—' : lowStock.length}</strong><small>Between 1 and 4 units</small></article>
            <article><span>Stock value</span><strong>{inventoryResult.isLoading ? '—' : currency.format(stockValue)}</strong><small>Based on catalogue prices</small></article>
          </section>

          {inventoryResult.error ? (
            <div className="admin-api-error" role="alert">
              <span>Could not load branch stock: {inventoryResult.error}</span>
              <button type="button" onClick={inventoryResult.refetch}>Retry</button>
            </div>
          ) : null}
          {ordersResult.error ? (
            <div className="admin-api-error" role="alert">
              <span>Could not load branch orders: {ordersResult.error}</span>
              <button type="button" onClick={ordersResult.refetch}>Retry</button>
            </div>
          ) : null}

          {alertsResult.data && (alertsResult.data.lowStock.length > 0 || alertsResult.data.outOfStock.length > 0) ? (
            <section className="admin-panel mt-4 border-l-4 border-l-danger" aria-label="Stock alerts">
              <div className="admin-panel-heading">
                <span>Stock alerts</span>
                <Link to={`/${branchId}/inventory`} className="admin-row-action">Restock</Link>
              </div>
              <ul className="divide-y divide-line">
                {alertsResult.data.outOfStock.map((item) => (
                  <li key={item.productId} className="flex items-center justify-between gap-3 px-4 py-2.5">
                    <Link to={`/products/${item.productId}`} className="min-w-0 truncate text-[12px] text-ink hover:underline">{item.productName}</Link>
                    <span className="shrink-0 font-mono text-[9px] uppercase tracking-[0.1em] text-danger">Out of stock</span>
                  </li>
                ))}
                {alertsResult.data.lowStock.map((item) => (
                  <li key={item.productId} className="flex items-center justify-between gap-3 px-4 py-2.5">
                    <Link to={`/products/${item.productId}`} className="min-w-0 truncate text-[12px] text-ink hover:underline">{item.productName}</Link>
                    <span className="shrink-0 font-mono text-[9px] uppercase tracking-[0.1em] text-warning">{item.quantity} left</span>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          <section className="admin-panel admin-orders-panel mt-4">
            <div className="admin-panel-heading">
              <span>Branch inventory</span>
              <Link to={`/${branchId}/inventory`} className="admin-row-action">Open inventory</Link>
            </div>
            {inventoryResult.isLoading && !inventoryResult.data ? (
              <div className="p-5" role="status" aria-label="Loading stock">
                {Array.from({ length: 5 }).map((_, index) => <Skeleton key={index} className="mb-3 h-10 w-full" />)}
              </div>
            ) : (
              <div className="admin-table analytics-products-table">
                <div className="admin-table-head"><span>Product</span><span>Category ID</span><span>Price</span><span>Stock</span></div>
                {inventory.slice(0, 8).map((item) => (
                  <div className="admin-table-row" key={item.productId}>
                    <Link to={`/products/${item.productId}`} className="min-w-0 truncate text-ink hover:underline">{item.productName}</Link>
                    <span>#{item.categoryId}</span>
                    <span>{currency.format(item.price)}</span>
                    <span className={item.quantity < 5 ? 'text-danger' : 'text-success'}>{item.quantity}</span>
                  </div>
                ))}
                {!inventory.length ? <div className="p-5 text-xs text-muted">No products in the catalogue.</div> : null}
              </div>
            )}
          </section>

          <section id="orders" className="admin-panel admin-orders-panel mt-4 scroll-mt-6">
            <div className="admin-panel-heading">
              <span>Recent branch orders</span>
              <span>{orders.length} total</span>
            </div>
            {ordersResult.isLoading && !ordersResult.data ? (
              <div className="p-5" role="status" aria-label="Loading orders">
                {Array.from({ length: 5 }).map((_, index) => <Skeleton key={index} className="mb-3 h-10 w-full" />)}
              </div>
            ) : (
              <div className="admin-table analytics-products-table">
                <div className="admin-table-head"><span>Order</span><span>Customer</span><span>Status</span><span>Total</span></div>
                {orders.slice(0, 8).map((order) => (
                  <div className="admin-table-row" key={order._id}>
                    <span>{order.orderNumber}</span>
                    <span className="truncate">{order.customerName}</span>
                    <span><OrderStatusSelect order={order} onUpdated={ordersResult.refetch} /></span>
                    <span>{currency.format(order.total)}</span>
                  </div>
                ))}
                {!orders.length ? <div className="p-5 text-xs text-muted">No orders have been placed for this branch yet.</div> : null}
              </div>
            )}
          </section>
          <footer className="admin-footer mt-5">
            <span>{branch.name.toUpperCase()} · BRANCH OPERATIONS</span>
            <span>{ordersResult.isLoading ? 'SYNCING ORDERS' : `${orders.length} ORDERS`}</span>
          </footer>
        </>
      )}
    </div>
  )

  return branch
    ? <BranchLayout branchId={branchId} branchName={branch.name} ownerName={ownerName}>{content}</BranchLayout>
    : <BranchLayout branchId={branchId} branchName="Branch" ownerName={ownerName}>{content}</BranchLayout>
}
