import { orderStatusClass, orderStatusLabel } from '../../lib/order-status'
import { cn } from '../../lib/utils'

export function OrderStatusBadge({ status, className }: { status: string; className?: string }) {
  return (
    <em className={cn('order-status', orderStatusClass(status), className)}>
      {orderStatusLabel(status)}
    </em>
  )
}
