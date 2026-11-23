import { useCallback, useState } from 'react'
import { Link } from 'react-router-dom'
import { useFetch } from '../hooks/useFetch'
import Pagination from '../components/products/Pagination'
import { OrderStatusBadge } from '../components/orders/OrderStatusBadge'
import { Skeleton } from '../components/ui/feedback'
import { ordersService, type BackendOrder, type OrdersResponse } from '../lib/api/orders.service'
import type { PaginatedResult } from '../types/product'

const currency = new Intl.NumberFormat('en-IE', { style: 'currency', currency: 'EUR', maximumFractionDigits: 2 })
const PAGE_SIZE = 8

function isPaginated(data: OrdersResponse): data is PaginatedResult<BackendOrder> {
  return !Array.isArray(data)
}

export default function AccountOrders() {
  const [page, setPage] = useState(1)
  const request = useCallback(
    (signal: AbortSignal) => ordersService.getMyOrders({ page, limit: PAGE_SIZE }, signal),
    [page],
  )
  const { data, isLoading, error, refetch } = useFetch<OrdersResponse>(request)

  const orders = data ? (isPaginated(data) ? data.items : data) : []
  const totalPages = data && isPaginated(data) ? data.totalPages : 1
  const total = data && isPaginated(data) ? data.total : orders.length

  return (
      <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
        <div className="mb-8 flex items-end justify-between gap-4">
          <div>
            <p className="eyebrow">Your account</p>
            <h1 className="mt-1 font-display text-4xl tracking-[-0.03em]">Order <em>history.</em></h1>
          </div>
          <Link to="/account" className="font-mono text-[10px] uppercase tracking-[0.12em] text-muted transition-colors hover:text-ink">← Back to account</Link>
        </div>

        {error ? (
          <div className="mb-6 flex items-center justify-between border border-danger/40 bg-danger/5 px-4 py-3 text-sm text-danger" role="alert">
            <span>{error}</span>
            <button type="button" onClick={() => void refetch()} className="font-mono text-[10px] uppercase tracking-[0.1em] underline">Retry</button>
          </div>
        ) : null}

        {isLoading && !data ? (
          <ul className="space-y-3" role="status" aria-label="Loading your orders">
            {Array.from({ length: 4 }).map((_, index) => (
              <li key={index} className="border border-line bg-surface px-5 py-4">
                <Skeleton className="h-3 w-40" />
                <Skeleton className="mt-2 h-4 w-3/4" />
                <Skeleton className="mt-2 h-3 w-1/2" />
              </li>
            ))}
          </ul>
        ) : !orders.length ? (
          <div className="border border-line bg-surface p-10 text-center">
            <p className="font-display text-2xl">No orders yet.</p>
            <p className="mt-2 text-sm text-muted">When you place an order it will show up here with live status updates.</p>
            <Link to="/shop" className="mt-5 inline-block border border-ink px-5 py-2.5 font-mono text-[10px] uppercase tracking-[0.12em] text-ink transition-colors hover:bg-ink hover:text-white">Start shopping</Link>
          </div>
        ) : (
          <>
            <ul className="space-y-3">
              {orders.map((order) => (
                <li key={order._id}>
                  <Link
                    to={`/account/orders/${order._id}`}
                    className="group flex flex-wrap items-center justify-between gap-3 border border-line bg-surface px-5 py-4 transition-colors hover:border-ink"
                  >
                    <div className="min-w-0">
                      <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-muted">
                        {order.orderNumber} · {new Date(order.createdAt).toLocaleDateString()}
                      </p>
                      <p className="mt-1 truncate text-sm text-ink">
                        {order.items.map((item) => `${item.title} ×${item.quantity}`).join(', ')}
                      </p>
                      <p className="mt-1 text-[11px] text-muted">{order.branch.name} · {order.fulfilment === 'deliver' ? 'Delivery' : 'Collection'}</p>
                    </div>
                    <div className="flex items-center gap-4">
                      <OrderStatusBadge status={order.status} />
                      <span className="font-mono text-sm tabular text-ink">{currency.format(order.total)}</span>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
            <p className="mt-4 text-center font-mono text-[10px] uppercase tracking-[0.12em] text-muted">{total} orders</p>
            <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
          </>
        )}
      </div>
  )
}
