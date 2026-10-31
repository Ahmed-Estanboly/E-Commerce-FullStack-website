import { Link } from 'react-router-dom'
import { ArrowRight, ShoppingBag } from '../ui/icons'
import { buttonStyles } from '../ui/button-styles'

/** Empty-cart state with a link back to the catalogue. */
export function CartEmptyState() {
  return (
    <div className="flex min-h-[300px] flex-col items-center justify-center py-14 text-center">
      <span className="flex h-12 w-12 items-center justify-center border border-line text-muted">
        <ShoppingBag className="h-5 w-5" strokeWidth={1.25} aria-hidden="true" />
      </span>
      <h2 className="mt-5 font-display text-2xl tracking-[-0.03em]">Nothing in your bag just yet.</h2>
      <p className="mt-2 max-w-sm text-[12px] leading-relaxed text-muted">
        Take a look around the edit. Your finds will be waiting here.
      </p>
      <Link to="/shop" className={`${buttonStyles('accent', 'md')} mt-5`}>
        Explore the edit <ArrowRight className="h-4 w-4" aria-hidden="true" />
      </Link>
    </div>
  )
}
