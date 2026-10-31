import { Link } from 'react-router-dom'
import { ArrowRight } from '../ui/icons'
import { buttonStyles } from '../ui/button-styles'
import { formatPrice, pluralise } from '../../lib/utils'

const FREE_SHIPPING_THRESHOLD = 75
const STANDARD_DELIVERY = 6.5

export interface CartOrderSummaryProps {
  itemCount: number
  subtotal: number
  checkoutHref?: string
}

/** Reusable order totals panel; delivery is complimentary at the store threshold. */
export function CartOrderSummary({
  itemCount,
  subtotal,
  checkoutHref = '/checkout',
}: CartOrderSummaryProps) {
  const isFreeDelivery = subtotal >= FREE_SHIPPING_THRESHOLD
  const delivery = isFreeDelivery ? 0 : STANDARD_DELIVERY
  const amountToFreeShipping = Math.max(FREE_SHIPPING_THRESHOLD - subtotal, 0)

  return (
    <aside className="h-fit border border-line bg-surface p-4 sm:p-5 lg:sticky lg:top-32">
      <div className="flex items-center justify-between border-b border-line pb-3">
        <p className="font-mono text-[8px] uppercase tracking-[0.17em] text-muted">Order summary</p>
        <p className="font-mono text-[8px] uppercase tracking-[0.12em] text-muted">
          {pluralise(itemCount, 'piece')}
        </p>
      </div>
      <dl className="space-y-2.5 py-4 text-[10px]">
        <div className="flex justify-between gap-3">
          <dt className="text-muted">Subtotal</dt>
          <dd className="tabular">{formatPrice(subtotal)}</dd>
        </div>
        <div className="flex justify-between gap-3">
          <dt className="text-muted">Delivery</dt>
          <dd className="tabular">{delivery === 0 ? 'Complimentary' : formatPrice(delivery)}</dd>
        </div>
        <div className="flex justify-between gap-3">
          <dt className="text-muted">Collection</dt>
          <dd className="text-right">At-home counter</dd>
        </div>
        <div className="flex justify-between gap-3">
          <dt className="text-muted">Fulfilment</dt>
          <dd className="text-right">Collect or delivery</dd>
        </div>
      </dl>
      <div className="flex items-baseline justify-between border-t border-line py-4">
        <span className="font-mono text-[8px] uppercase tracking-[0.14em]">Total</span>
        <span className="font-display text-[21px] tabular">{formatPrice(subtotal + delivery)}</span>
      </div>
      {amountToFreeShipping > 0 ? (
        <p className="mb-3 border border-line px-2.5 py-2 font-mono text-[7px] uppercase leading-relaxed tracking-[0.08em] text-muted">
          Free collection · delivery is complimentary over {formatPrice(FREE_SHIPPING_THRESHOLD)}
        </p>
      ) : (
        <p className="mb-3 border border-accent/20 bg-accent/[0.04] px-2.5 py-2 font-mono text-[7px] uppercase leading-relaxed tracking-[0.08em] text-accent/80">
          Complimentary delivery unlocked
        </p>
      )}
      <Link to={checkoutHref} className={buttonStyles('accent', 'md', true)}>
        Continue to checkout <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
      </Link>
      <Link
        to="/shop"
        className="focus-ring mt-2 flex h-9 items-center justify-center border border-line font-mono text-[8px] uppercase tracking-[0.14em] text-muted transition-colors hover:border-line-strong hover:text-ink"
      >
        Keep looking
      </Link>
      <p className="mt-3 font-mono text-[7px] uppercase leading-relaxed tracking-[0.09em] text-muted">
        Tax included · all fees final · secure checkout
      </p>
    </aside>
  )
}
