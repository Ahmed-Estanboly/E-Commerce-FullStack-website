import type { Branch, FulfilmentMethod } from '../../types/checkout';
import type { CartItem } from '../../store/cart-context';
import { formatPrice } from '../../lib/utils';

interface OrderSummaryCardProps {
  items: CartItem[];
  subtotal: number;
  shippingFee: number;
  total: number;
  fulfilment: FulfilmentMethod;
  branch: Branch;
  mode: 'checkout' | 'confirmation';
  orderNumber?: string;
  cardLast4?: string;
  paymentMethod?: string;
}

export const OrderSummaryCard: React.FC<OrderSummaryCardProps> = ({
  items,
  subtotal,
  shippingFee,
  total,
  fulfilment,
  branch,
  mode,
  orderNumber,
  cardLast4,
  paymentMethod,
}) => {
  return (
    <aside className="border border-line bg-surface p-5 sm:p-6">
      <div className="flex items-center justify-between border-b border-line pb-4">
        <span className="font-mono text-[8px] uppercase tracking-[0.17em] text-muted">
          {mode === 'checkout' ? 'YOUR ORDER' : `ORDER ${orderNumber}`}
        </span>
        <span className="font-mono text-[8px] uppercase tracking-[0.17em] text-muted">
          {String(items.length).padStart(2, '0')} ITEMS
        </span>
      </div>

      <ul className="divide-y divide-line">
        {items.map((item, idx) => (
          <li key={item.product.id || idx} className="flex items-start gap-3.5 py-4">
            <img
              src={item.product.images?.[0]}
              alt={item.product.title}
              className="h-14 w-11 shrink-0 border border-line object-cover"
            />
            <div className="min-w-0 flex-1">
              <div className="flex items-baseline justify-between gap-2">
                <p className="font-display text-[15px] leading-snug text-ink">
                  {item.product.title}
                </p>
                <span className="tabular font-mono text-xs text-ink">
                  {formatPrice(item.product.price * item.quantity)}
                </span>
              </div>
              <p className="mt-1 font-mono text-[7px] uppercase tracking-[0.16em] text-muted">
                {item.product.category?.name} · QTY {item.quantity}
              </p>
            </div>
          </li>
        ))}
      </ul>

      <div className="space-y-2.5 border-t border-line pt-4 text-xs">
        <div className="flex items-center justify-between">
          <span className="text-muted">Subtotal</span>
          <span className="tabular text-ink">{formatPrice(subtotal)}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-muted">{fulfilment === 'collect' ? 'Collection' : 'Delivery'}</span>
          <span className="tabular text-ink">{shippingFee === 0 ? 'Free' : formatPrice(shippingFee)}</span>
        </div>
        {mode === 'checkout' && (
          <div className="flex items-center justify-between">
            <span className="text-muted">Branch</span>
            <span className="text-ink">{branch.city}</span>
          </div>
        )}
      </div>

      <div className="mt-4 flex items-baseline justify-between border-t border-line pt-4">
        <span className="text-sm text-ink">{mode === 'checkout' ? 'Total' : 'Paid (demo)'}</span>
        <span className="tabular font-display text-2xl text-ink">{formatPrice(total)}</span>
      </div>

      {mode === 'checkout' ? (
        <div className="mt-4 border border-line bg-canvas/50 px-3.5 py-2.5">
          <p className="font-mono text-[9px] uppercase text-ink-soft">
            {fulfilment === 'collect' ? 'COLLECT TODAY AFTER 14:00 · HELD FOR 3 DAYS' : 'ESTIMATED DELIVERY · 1–2 BUSINESS DAYS'}
          </p>
        </div>
      ) : (
        <div className="mt-4 border border-line bg-canvas/50 px-3.5 py-3">
          <p className="font-mono text-[9px] uppercase text-ink-soft">
            {paymentMethod === 'card' ? `VISA ···· ${cardLast4} · SIMULATED PAYMENT` : `${paymentMethod?.toUpperCase()} · SIMULATED`}
          </p>
        </div>
      )}
    </aside>
  );
};