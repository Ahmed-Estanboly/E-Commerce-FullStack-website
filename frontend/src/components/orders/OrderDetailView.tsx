import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import type { BackendOrder } from '../../lib/api/orders.service'
import { formatOrderDateTime, orderStatusLabel } from '../../lib/order-status'
import { formatPrice } from '../../lib/utils'
import { OrderStatusBadge } from './OrderStatusBadge'

const currency = new Intl.NumberFormat('en-IE', {
  style: 'currency',
  currency: 'EUR',
  maximumFractionDigits: 2,
})

function DetailRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-line py-3 last:border-b-0">
      <span className="font-mono text-[9px] uppercase tracking-[0.14em] text-muted">{label}</span>
      <span className="text-right text-[12px] text-ink">{children}</span>
    </div>
  )
}

export function OrderDetailView({ order }: { order: BackendOrder }) {
  const history = order.statusHistory ?? []

  return (
    <div className="grid gap-5 lg:grid-cols-[minmax(0,1.4fr)_minmax(280px,0.6fr)]">
      <section className="border border-line bg-surface p-5 sm:p-7" aria-label="Order items">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line pb-4">
          <div>
            <p className="eyebrow">{order.orderNumber}</p>
            <h2 className="mt-1 font-display text-2xl tracking-[-0.02em]">Items</h2>
          </div>
          <OrderStatusBadge status={order.status} />
        </div>
        <ul className="divide-y divide-line">
          {order.items.map((item, index) => (
            <li key={`${item.productId}-${index}`} className="flex items-center justify-between gap-4 py-4">
              <div className="min-w-0">
                <Link
                  to={`/products/${item.productId}`}
                  className="text-[13px] text-ink underline-offset-4 hover:underline"
                >
                  {item.title}
                </Link>
                <p className="mt-1 font-mono text-[9px] uppercase tracking-[0.1em] text-muted">
                  Qty {item.quantity} · Ref NOVA-{String(item.productId).padStart(4, '0')}
                </p>
              </div>
              <p className="shrink-0 font-mono text-[11px] tabular text-ink">
                {currency.format(item.price * item.quantity)}
              </p>
            </li>
          ))}
        </ul>
        <div className="space-y-1 border-t border-line pt-4">
          <DetailRow label="Subtotal">{currency.format(order.subtotal)}</DetailRow>
          <DetailRow label="Shipping">{currency.format(order.shippingFee)}</DetailRow>
          <div className="flex items-center justify-between pt-2">
            <span className="font-mono text-[9px] uppercase tracking-[0.14em] text-muted">Total</span>
            <strong className="font-display text-2xl font-normal">{formatPrice(order.total)}</strong>
          </div>
        </div>
      </section>

      <div className="space-y-5">
        <section className="border border-line bg-surface p-5 sm:p-6" aria-label="Order summary">
          <p className="eyebrow mb-2">Summary</p>
          <DetailRow label="Status">{orderStatusLabel(order.status)}</DetailRow>
          <DetailRow label="Fulfilment">{order.fulfilment === 'collect' ? 'Branch pickup' : 'Delivery'}</DetailRow>
          <DetailRow label="Payment">
            {order.paymentMethod === 'card'
              ? `Card${order.cardLast4 ? ` ···· ${order.cardLast4}` : ''}`
              : order.paymentMethod === 'apple_pay'
                ? 'Apple Pay'
                : 'Bancontact'}
          </DetailRow>
          <DetailRow label="Placed">{formatOrderDateTime(order.createdAt)}</DetailRow>
        </section>

        <section className="border border-line bg-surface p-5 sm:p-6" aria-label="Customer details">
          <p className="eyebrow mb-2">Customer</p>
          <DetailRow label="Name">{order.customerName}</DetailRow>
          <DetailRow label="Email">{order.email}</DetailRow>
          <DetailRow label="Phone">{order.phone}</DetailRow>
          {order.deliveryAddress ? (
            <DetailRow label="Deliver to">{order.deliveryAddress}</DetailRow>
          ) : null}
        </section>

        <section className="border border-line bg-surface p-5 sm:p-6" aria-label="Branch details">
          <p className="eyebrow mb-2">Branches</p>
          {(order.branches?.length ? order.branches : [order.branch]).map((branch) => (
            <div key={branch._id} className="border-b border-line py-3 last:border-0">
              <DetailRow label="Branch">{branch.name}</DetailRow>
              <DetailRow label="Address">{branch.address}</DetailRow>
              <DetailRow label="Phone">{branch.phone}</DetailRow>
              {branch.workingHours ? <DetailRow label="Hours">{branch.workingHours}</DetailRow> : null}
            </div>
          ))}
        </section>

        {history.length ? (
          <section className="border border-line bg-surface p-5 sm:p-6" aria-label="Status history">
            <p className="eyebrow mb-3">Status history</p>
            <ol className="relative space-y-4 border-l border-line pl-4">
              {[...history].reverse().map((entry, index) => (
                <li key={`${entry.at}-${index}`} className="relative">
                  <span className="absolute -left-[21px] top-1 h-2 w-2 rounded-full bg-accent" aria-hidden="true" />
                  <p className="text-[12px] text-ink">{orderStatusLabel(entry.status)}</p>
                  <p className="mt-0.5 font-mono text-[8px] uppercase tracking-[0.1em] text-muted">
                    {formatOrderDateTime(entry.at)}
                    {entry.by ? ` · ${entry.by}` : ''}
                  </p>
                  {entry.note ? <p className="mt-1 text-[11px] text-ink-soft">{entry.note}</p> : null}
                </li>
              ))}
            </ol>
          </section>
        ) : null}
      </div>
    </div>
  )
}
