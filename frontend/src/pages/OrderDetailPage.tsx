import { useCallback } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowRight } from '../components/ui/icons'
import { useFetch } from '../hooks/useFetch'
import { ordersService } from '../lib/api/orders.service'
import { OrderDetailView } from '../components/orders/OrderDetailView'
import { Skeleton } from '../components/ui/feedback'

export default function OrderDetailPage() {
  const { id = '' } = useParams<{ id: string }>()
  const request = useCallback(
    (signal: AbortSignal) => ordersService.getMyOrder(id, signal),
    [id],
  )
  const { data: order, isLoading, error, refetch } = useFetch(request)

  return (
    <div className="container-nova py-10 sm:py-14">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line pb-6">
        <div>
          <p className="eyebrow">Your NOVA account</p>
          <h1 className="mt-2 font-display text-[clamp(2rem,4vw,3.4rem)] leading-[0.95] tracking-[-0.04em]">
            Order <em className="font-light">{order?.orderNumber ?? 'details'}.</em>
          </h1>
        </div>
        <Link
          to="/account"
          className="focus-ring inline-flex items-center gap-2 font-mono text-[9px] uppercase tracking-[0.14em] text-ink-soft transition-colors hover:text-ink"
        >
          <ArrowRight className="h-3 w-3 -rotate-180" aria-hidden="true" />
          Back to account
        </Link>
      </div>

      <div className="mt-8">
        {error ? (
          <div className="border border-line bg-surface p-6" role="alert">
            <p className="text-[13px] text-ink">{error}</p>
            <button
              type="button"
              onClick={refetch}
              className="mt-4 border border-line px-4 py-2 font-mono text-[9px] uppercase tracking-[0.12em] text-ink-soft transition-colors hover:border-ink hover:text-ink"
            >
              Try again
            </button>
          </div>
        ) : isLoading && !order ? (
          <div className="grid gap-5 lg:grid-cols-[minmax(0,1.4fr)_minmax(280px,0.6fr)]" role="status" aria-label="Loading order">
            <Skeleton className="h-96 w-full" />
            <Skeleton className="h-96 w-full" />
          </div>
        ) : order ? (
          <OrderDetailView order={order} />
        ) : null}
      </div>
    </div>
  )
}
