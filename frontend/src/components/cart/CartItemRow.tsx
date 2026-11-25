import { Link } from 'react-router-dom'
import { QuantityStepper } from '../ui/quantity-stepper'
import { SmartImage } from '../ui/smart-image'
import type { CartItem } from '../../store/cart-context'
import { formatPrice } from '../../lib/utils'
import { presentationForCategory } from '../../data/home'

export interface CartItemRowProps {
  item: CartItem
  onQuantityChange: (productId: number, quantity: number, branchId: string) => void
  onRemove: (productId: number, branchId: string) => void
}

/** Reusable cart row with quantity controls and a remove action. */
export function CartItemRow({ item: { product, quantity, branchId, branchName }, onQuantityChange, onRemove }: CartItemRowProps) {
  return (
    <li className="grid grid-cols-[60px_minmax(0,1fr)_auto] items-center gap-x-2 py-3 sm:grid-cols-[68px_minmax(0,1fr)_auto] sm:gap-x-3 sm:py-4 lg:grid-cols-[88px_minmax(0,1fr)_auto] lg:gap-x-4 lg:py-5">
      <Link
        to={`/products/${product.id}`}
        className="row-span-2 block aspect-square overflow-hidden bg-canvas-alt focus-ring sm:row-span-1"
        aria-label={`View ${product.title}`}
      >
        <SmartImage
          src={product.images[0]}
          alt={product.title}
          presentation={presentationForCategory(product.category?.name)}
          fallbackLabel={product.category?.name ?? 'NOVA'}
          aspect="none"
          className="h-full w-full"
          sizes="88px"
        />
      </Link>

      <div className="min-w-0 self-end sm:self-center">
        <p className="font-mono text-[6px] uppercase tracking-[0.14em] text-muted sm:text-[7px] lg:text-[8px]">
          {product.category?.name ?? 'NOVA'} · {branchName}
        </p>
        <h2 className="mt-0.5 font-display text-[clamp(0.95rem,2vw,1.4rem)] leading-tight tracking-[-0.03em] sm:mt-1">
          <Link to={`/products/${product.id}`} className="transition-colors hover:text-accent">
            {product.title}
          </Link>
        </h2>
        <p className="mt-1 hidden text-[10px] text-muted sm:block">
          Ready to dispatch · Standard delivery
        </p>
      </div>

      <p className="row-start-1 self-start pt-1 text-right font-mono text-[8px] tabular text-ink sm:row-start-auto sm:self-center sm:pt-0 sm:text-[9px] lg:text-[10px]">
        {formatPrice(product.price * quantity)}
      </p>

      <div className="col-start-2 row-start-2 mt-1.5 flex items-center gap-2 sm:mt-2 sm:gap-3">
        <QuantityStepper
          value={quantity}
          onChange={(nextQuantity) => onQuantityChange(product.id, nextQuantity, branchId)}
          label={`quantity of ${product.title}`}
          tone="default"
        />
        <button
          type="button"
          onClick={() => onRemove(product.id, branchId)}
          className="focus-ring font-mono text-[7px] uppercase tracking-[0.13em] text-muted transition-colors hover:text-accent"
          aria-label={`Remove ${product.title} from bag`}
        >
          Remove
        </button>
      </div>
    </li>
  )
}
