import { useCallback } from 'react'
import { Link } from 'react-router-dom'
import { AdminLayout } from '../components/layout/admin-layout'
import { useFetch } from '../hooks/useFetch'
import { ordersService } from '../lib/api/orders.service'
import type { BackendOrder } from '../lib/api/orders.service'

const currency = new Intl.NumberFormat('en-IE', { style: 'currency', currency: 'EUR', maximumFractionDigits: 2 })

export default function AdminOrders() {
  const request = useCallback((signal: AbortSignal) => ordersService.getAllOrders(signal), [])
  const { data, isLoading, error, refetch } = useFetch<BackendOrder[]>(request)
  const orders = data ?? []

  return (
    <AdminLayout activePage="orders" searchPlaceholder="Search orders">
      <div className="admin-content">
        <div className="admin-page-intro">
          <div>
            <p className="eyebrow">Store operations · Orders</p>
            <h1>Every order,<br /><em>in one place.</em></h1>
            <p>Review orders across all store branches, their fulfilment details, and current status.</p>
          </div>
          <Link to="/admin/dashboard" className="admin-outline-button">Back to dashboard</Link>
        </div>

        <section className="admin-metrics" aria-label="Order summary">
          <article><span>Total orders</span><strong>{isLoading ? '—' : orders.length}</strong><small>Across every branch</small></article>
          <article><span>Confirmed</span><strong>{isLoading ? '—' : orders.filter((order) => order.status === 'confirmed').length}</strong><small>Ready for fulfilment</small></article>
          <article><span>Delivered</span><strong>{isLoading ? '—' : orders.filter((order) => order.status === 'delivered').length}</strong><small>Completed orders</small></article>
          <article><span>Order value</span><strong>{isLoading ? '—' : currency.format(orders.reduce((sum, order) => sum + order.total, 0))}</strong><small>All recorded orders</small></article>
        </section>

        {error ? (
          <div className="admin-api-error" role="alert">
            <span>Could not load orders: {error}</span>
            <button type="button" onClick={refetch}>Retry</button>
          </div>
        ) : null}
        <section className="admin-panel admin-orders-panel" aria-label="All store orders">
          <div className="admin-panel-heading"><span>All orders</span><span>{orders.length} records</span></div>
          {isLoading && !data ? (
            <div className="p-5 text-xs text-muted" role="status">Loading orders...</div>
          ) : (
            <div className="admin-table">
              <div className="admin-table-head admin-all-orders-head">
                <span>Order</span><span>Customer</span><span>Branch</span><span>Fulfilment</span><span>Status</span><span>Total</span>
              </div>
              {orders.map((order) => (
                <div className="admin-table-row admin-all-orders-row" key={order._id}>
                  <span>{order.orderNumber}</span>
                  <span className="truncate">{order.customerName}<small className="block text-muted">{order.email}</small></span>
                  <span className="truncate">{order.branch.name}</span>
                  <span>{order.fulfilment}</span>
                  <span><em className={`order-status ${order.status === 'cancelled' ? 'status-cancelled' : order.status === 'delivered' ? 'status-complete' : 'status-pending'}`}>{order.status}</em></span>
                  <span>{currency.format(order.total)}</span>
                </div>
              ))}
              {!orders.length && !error ? <div className="p-5 text-xs text-muted">No orders have been placed yet.</div> : null}
            </div>
          )}
        </section>
        <footer className="admin-footer mt-5"><span>NOVA · ORDER MANAGEMENT</span><span>{orders.length} ORDERS</span></footer>
      </div>
    </AdminLayout>
  )
}
