import { useCallback, useState } from 'react'
import { useParams } from 'react-router-dom'
import { BranchLayout } from '../components/layout/branch-layout'
import { useFetch } from '../hooks/useFetch'
import { branchesService } from '../lib/api/branches.service'
import { normalizeOrders, ordersService, type BackendOrder, type OrderStatus } from '../lib/api/orders.service'
import { ORDER_STATUS_LABELS } from '../lib/order-status'
import { OrderStatusSelect } from '../components/orders/OrderStatusSelect'
import { getStoredSession } from '../lib/auth'
import type { Branch } from '../types/branch'

const currency = new Intl.NumberFormat('en-IE', { style: 'currency', currency: 'EUR', maximumFractionDigits: 2 })

const ORDER_STATUSES = Object.keys(ORDER_STATUS_LABELS) as OrderStatus[]

export default function BranchOrders() {
  const { branchName: branchId = '' } = useParams<{ branchName: string }>()
  const [statusFilter, setStatusFilter] = useState<OrderStatus | ''>('')
  const [ordersOverride, setOrdersOverride] = useState<Record<string, BackendOrder>>({})

  const branchRequest = useCallback(
    (signal: AbortSignal) => branchesService.getBranch(branchId, signal),
    [branchId],
  )
  const ordersRequest = useCallback(
    async (signal: AbortSignal) =>
      normalizeOrders(await ordersService.getBranchOrders(branchId, undefined, signal)),
    [branchId],
  )
  const branchResult = useFetch<Branch>(branchRequest)
  const ordersResult = useFetch<BackendOrder[]>(ordersRequest)

  const branch = branchResult.data
  const orders = (ordersResult.data ?? []).map((order) => ordersOverride[order._id] ?? order)
  const visibleOrders = statusFilter ? orders.filter((order) => order.status === statusFilter) : orders

  const handleOrderUpdated = (updated: BackendOrder) => {
    setOrdersOverride((current) => ({ ...current, [updated._id]: updated }))
  }

  const ownerName = getStoredSession()?.user.name ?? branch?.name ?? 'Branch manager'
  const branchLabel = branch?.name ?? 'Branch'

  const content = (
    <div className="admin-content">
      {!branch && branchResult.isLoading ? (
        <div className="admin-panel p-6 text-sm text-muted" role="status">Loading branch orders...</div>
      ) : !branch || branchResult.error ? (
        <div className="admin-api-error" role="alert">
          <span>{branchResult.error ?? 'This branch could not be found.'}</span>
          <button type="button" onClick={branchResult.refetch}>Retry</button>
        </div>
      ) : (
        <>
          <div className="admin-page-intro">
            <div>
              <p className="eyebrow">{branch.name} · Orders</p>
              <h1>Branch<br /><em>orders.</em></h1>
              <p>Every order placed for {branch.name}. Update fulfilment status as you prepare each one.</p>
            </div>
            <div className="admin-intro-actions">
              <select
                className="h-10 border border-line bg-canvas/40 px-3 font-mono text-[9px] uppercase tracking-[0.08em] text-ink outline-none focus:border-line-strong"
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value as OrderStatus | '')}
                aria-label="Filter by status"
              >
                <option value="">All statuses</option>
                {ORDER_STATUSES.map((status) => (
                  <option key={status} value={status}>{ORDER_STATUS_LABELS[status]}</option>
                ))}
              </select>
            </div>
          </div>

          <section className="admin-metrics" aria-label="Order metrics">
            <article><span>Orders</span><strong>{ordersResult.isLoading ? '—' : orders.length}</strong><small>This branch</small></article>
            <article><span>Pending</span><strong>{orders.filter((order) => order.status === 'pending').length}</strong><small>Awaiting fulfilment</small></article>
            <article><span>Delivered</span><strong>{orders.filter((order) => order.status === 'delivered').length}</strong><small>Completed</small></article>
            <article><span>Order value</span><strong>{ordersResult.isLoading ? '—' : currency.format(orders.reduce((sum, order) => sum + order.total, 0))}</strong><small>Order totals</small></article>
          </section>

          {ordersResult.error ? (
            <div className="admin-api-error mt-4" role="alert">
              <span>Could not load branch orders: {ordersResult.error}</span>
              <button type="button" onClick={ordersResult.refetch}>Retry</button>
            </div>
          ) : null}

          <section className="admin-panel admin-orders-panel mt-4">
            <div className="admin-panel-heading">
              <span>Branch orders</span>
              <span>{visibleOrders.length} shown</span>
            </div>
            {ordersResult.isLoading && !ordersResult.data ? (
              <div className="p-5 text-xs text-muted" role="status">Loading orders...</div>
            ) : (
              <div className="admin-table analytics-products-table">
                <div className="admin-table-head"><span>Order</span><span>Customer</span><span>Status</span><span>Total</span></div>
                {visibleOrders.map((order) => (
                  <div className="admin-table-row" key={order._id}>
                    <span>
                      {order.orderNumber}
                      <br />
                      <small className="text-muted">{new Date(order.createdAt).toLocaleDateString()}</small>
                    </span>
                    <span className="truncate">
                      {order.customerName}
                      <br />
                      <small className="text-muted">{order.email}</small>
                    </span>
                    <span>
                      <OrderStatusSelect order={order} onUpdated={handleOrderUpdated} />
                    </span>
                    <span>{currency.format(order.total)}</span>
                  </div>
                ))}
                {!visibleOrders.length ? (
                  <div className="p-5 text-xs text-muted">
                    {orders.length ? 'No orders match the selected status.' : 'No orders have been placed for this branch yet.'}
                  </div>
                ) : null}
              </div>
            )}
          </section>
          <footer className="admin-footer mt-5">
            <span>{branchLabel.toUpperCase()} · ORDERS</span>
            <span>{ordersResult.isLoading ? 'SYNCING ORDERS' : `${visibleOrders.length} OF ${orders.length} ORDERS`}</span>
          </footer>
        </>
      )}
    </div>
  )

  return (
    <BranchLayout branchId={branchId} branchName={branchLabel} ownerName={ownerName}>
      {content}
    </BranchLayout>
  )
}
