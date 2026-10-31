import { Link } from 'react-router-dom'
import { ArrowRight } from '../components/ui/icons'
import { CartEmptyState, CartItemRow, CartOrderSummary, CartRecommendations } from '../components/cart'
import { useStoreProducts } from '../hooks/use-products'
import { useCart } from '../store/cart-context'
import { pluralise } from '../lib/utils'

/** Composes reusable cart components with the app's cart state and product feed. */
export function CartPage() {
  const { items, itemCount, subtotal, addItem, updateQuantity, removeItem } = useCart()
  const { products, isLoading, error } = useStoreProducts(12)
  const recommendations = products
    .filter((product) => !items.some((item) => item.product.id === product.id))
    .slice(0, 3)

  return (
    <div className="cart-page page-enter bg-canvas text-ink">
      <div className="container-nova py-10 sm:py-14 lg:py-16">
        <div className="flex flex-wrap items-end justify-between gap-5 border-b border-line pb-7 sm:pb-9">
          <div>
            <p className="font-mono text-[8px] uppercase tracking-[0.2em] text-muted">
              Home <span className="px-1.5 text-muted/60">/</span> Your selection
            </p>
            <p className="mt-5 font-mono text-[8px] uppercase tracking-[0.18em] text-accent">
              {items.length > 0 ? 'Reserved for 20 minutes' : 'A considered edit'}
            </p>
            <h1 className="mt-2 font-display text-[clamp(3.2rem,7vw,6.2rem)] leading-[0.88] tracking-[-0.06em]">
              Your <em className="font-light italic text-accent">bag.</em>
            </h1>
          </div>
          <p className="max-w-[360px] pb-1 text-[11px] leading-relaxed text-muted sm:text-[12px]">
            {items.length > 0
              ? 'The bag is held against your selection for a short time. Stock is reserved from the room you collect from. Change the branch at checkout if you need to.'
              : 'A good place to begin. Browse the edit and bring home something worth keeping.'}
          </p>
        </div>

        {items.length === 0 ? (
          <CartEmptyState />
        ) : (
          <div className="grid gap-8 pt-7 lg:grid-cols-[minmax(0,1fr)_320px] lg:gap-6">
            <div>
              <div className="flex items-center justify-between border-b border-line pb-3 font-mono text-[8px] uppercase tracking-[0.16em] text-muted">
                <span>Your selection</span>
                <span>{pluralise(itemCount, 'piece')}</span>
              </div>
              <ul className="divide-y divide-line">
                {items.map((item) => (
                  <CartItemRow
                    key={item.product.id}
                    item={item}
                    onQuantityChange={updateQuantity}
                    onRemove={removeItem}
                  />
                ))}
              </ul>
              <div className="mt-4 flex gap-3 border border-line bg-surface p-3.5">
                <span className="mt-0.5 font-mono text-[10px] text-accent" aria-hidden="true">✓</span>
                <p className="text-[9px] leading-relaxed text-muted sm:text-[10px]">
                  One item needs a little time. The key is to order at the At-Home counter. Choose
                  collection after $75, or delivery from the next working day.
                </p>
              </div>
              <Link
                to="/shop"
                className="focus-ring mt-5 inline-flex items-center gap-2 font-mono text-[8px] uppercase tracking-[0.13em] text-muted transition-colors hover:text-accent"
              >
                <ArrowRight className="h-3.5 w-3.5 rotate-180" aria-hidden="true" />
                Continue browsing
              </Link>
            </div>
            <CartOrderSummary itemCount={itemCount} subtotal={subtotal} />
          </div>
        )}

        <CartRecommendations
          products={recommendations}
          isLoading={isLoading}
          error={error}
          onAdd={addItem}
        />
      </div>
    </div>
  )
}
