import { useState } from 'react'
import { ordersService, type BackendOrder, type OrderStatus } from '../../lib/api/orders.service'
import { getOrderRequestError } from '../../lib/api/orders.service'
import { ORDER_STATUS_LABELS, ORDER_STATUS_TRANSITIONS, orderStatusLabel } from '../../lib/order-status'
import { cn } from '../../lib/utils'

interface OrderStatusSelectProps {
  order: BackendOrder
  /** Called with the updated order after a successful transition. */
  onUpdated?: (order: BackendOrder) => void
  className?: string
}

/**
 * Compact control that moves an order to the next allowed status.
 * Used by the admin orders table, the order detail page and the branch dashboard.
 */
export function OrderStatusSelect({ order, onUpdated, className }: OrderStatusSelectProps) {
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const transitions = order.allowedTransitions ?? ORDER_STATUS_TRANSITIONS[order.status] ?? []
  if (!transitions.length) return null

  const apply = async (status: OrderStatus) => {
    if (status === 'cancelled') {
      const confirmed = window.confirm(
        `Cancel order ${order.orderNumber}? Reserved stock will be returned to ${order.branch.name}.`,
      )
      if (!confirmed) return
    }
    setPending(true)
    setError(null)
    try {
      const updated = await ordersService.updateOrderStatus(order._id, status)
      onUpdated?.(updated)
    } catch (err) {
      setError(getOrderRequestError(err, 'Could not update the order status.'))
    } finally {
      setPending(false)
    }
  }

  return (
    <span className={cn('inline-flex flex-col gap-1', className)}>
      <select
        className="border border-line bg-surface px-2 py-1 font-mono text-[9px] uppercase tracking-[0.1em] text-ink outline-none transition-colors focus:border-ink disabled:opacity-50"
        value={order.status}
        disabled={pending}
        aria-label={`Update status for order ${order.orderNumber}`}
        onChange={(event) => {
          const next = event.target.value as OrderStatus
          if (next !== order.status) void apply(next)
        }}
      >
        <option value={order.status}>{orderStatusLabel(order.status)}</option>
        {transitions.map((status) => (
          <option key={status} value={status}>
            → {ORDER_STATUS_LABELS[status]}
          </option>
        ))}
      </select>
      {error ? (
        <span className="text-[9px] text-danger" role="alert">
          {error}
        </span>
      ) : null}
    </span>
  )
}
