import { useCallback } from 'react'
import { Link, useParams } from 'react-router-dom'
import { AdminLayout } from '../components/layout/admin-layout'
import { useFetch } from '../hooks/useFetch'
import { ordersService } from '../lib/api/orders.service'
import { OrderDetailView } from '../components/orders/OrderDetailView'
import { OrderStatusSelect } from '../components/orders/OrderStatusSelect'
import { Skeleton } from '../components/ui/feedback'

export default function AdminOrderDetail() {
  const { id = '' } = useParams<{ id: string }>()
  const request = useCallback(
    (signal: AbortSignal) => ordersService.getOrder(id, signal),
    [id],
  )
  const { data: order, isLoading, error, refetch } = useFetch(request)

  return (
    <AdminLayout activePage="orders" searchPlaceholder="Search orders">
      <div className="admin-content">
        <div className="admin-page-intro">
          <div>
            <p className="eyebrow">Store operations · Order {order?.orderNumber ?? ''}</p>
            <h1>Order <em>details.</em></h1>
            <p>Review the items, customer and fulfilment state, then move the order forward.</p>
          </div>
          <Link to="/admin/orders" className="admin-outline-button">All orders</Link>
        </div>

        {error ? (
          <div className="admin-api-error" role="alert">
            <span>Could not load order: {error}</span>
            <button type="button" onClick={refetch}>Retry</button>
          </div>
        ) : null}

        {isLoading && !order ? (
          <div className="space-y-4" role="status" aria-label="Loading order">
            <Skeleton className="h-40 w-full" />
            <Skeleton className="h-40 w-full" />
          </div>
        ) : order ? (
          <>
            <div className="mb-5 flex flex-wrap items-center gap-3">
              <span className="font-mono text-[9px] uppercase tracking-[0.14em] text-muted">
                Update status
              </span>
              <OrderStatusSelect order={order} onUpdated={refetch} />
            </div>
            <OrderDetailView order={order} />
          </>
        ) : null}

        <footer className="admin-footer mt-5">
          <span>NOVA · ORDER MANAGEMENT</span>
          <span>{order?.orderNumber ?? 'ORDER'}</span>
        </footer>
      </div>
    </AdminLayout>
  )
}
