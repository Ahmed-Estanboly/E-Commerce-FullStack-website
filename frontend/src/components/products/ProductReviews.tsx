import { useCallback, useEffect, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { reviewsService } from '../../lib/api/reviews.service'
import { getOrderRequestError } from '../../lib/api/orders.service'
import { getStoredSession } from '../../lib/auth'
import { useFetch } from '../../hooks/useFetch'
import type { ProductReviewsResponse } from '../../types/review'
import { Button } from '../ui/button'
import { Skeleton } from '../ui/feedback'
import { cn } from '../../lib/utils'

function Stars({ value, className }: { value: number; className?: string }) {
  return (
    <span className={cn('font-mono text-[11px] tracking-[0.15em] text-accent', className)} aria-label={`${value} out of 5 stars`}>
      {'★'.repeat(Math.round(value))}
      <span className="text-line-strong">{'★'.repeat(5 - Math.round(value))}</span>
    </span>
  )
}

export function ProductReviews({ productId }: { productId: number }) {
  const session = getStoredSession()
  const request = useCallback(
    (signal: AbortSignal) => reviewsService.getReviews(productId, signal),
    [productId],
  )
  const { data, isLoading, error, refetch } = useFetch<ProductReviewsResponse>(request)

  const [rating, setRating] = useState(5)
  const [title, setTitle] = useState('')
  const [comment, setComment] = useState('')
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)

  const myReview = data?.myReview ?? null

  // Prefill the form once the caller's existing review arrives (render-phase sync).
  const [syncedReviewId, setSyncedReviewId] = useState<string | null>(null);
  if (myReview && myReview._id !== syncedReviewId) {
    setSyncedReviewId(myReview._id);
    setRating(myReview.rating);
    setTitle(myReview.title ?? '');
    setComment(myReview.comment);
  }

  useEffect(() => {
    if (!saved) return
    const timer = window.setTimeout(() => setSaved(false), 4000)
    return () => window.clearTimeout(timer)
  }, [saved])

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setFormError(null)
    if (!comment.trim()) {
      setFormError('Please write a short comment.')
      return
    }
    setSaving(true)
    try {
      await reviewsService.saveReview(productId, {
        rating,
        title: title.trim() || undefined,
        comment: comment.trim(),
      })
      setSaved(true)
      refetch()
    } catch (err) {
      setFormError(getOrderRequestError(err, 'Could not save your review.'))
    } finally {
      setSaving(false)
    }
  }

  return (
    <section aria-labelledby="reviews-title" className="border-t border-line pt-10">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow">The word on the street</p>
          <h2 id="reviews-title" className="mt-2 font-display text-3xl tracking-[-0.03em] sm:text-4xl">
            Reviews <span className="italic text-accent">&amp; ratings.</span>
          </h2>
        </div>
        {data && data.count > 0 ? (
          <p className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.12em] text-ink-soft">
            <Stars value={data.average} />
            {data.average.toFixed(1)} · {data.count} {data.count === 1 ? 'review' : 'reviews'}
          </p>
        ) : null}
      </div>

      {isLoading ? (
        <div className="mt-8 space-y-4" role="status" aria-label="Loading reviews">
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
        </div>
      ) : error ? (
        <p className="mt-6 text-[12px] text-danger">Reviews could not be loaded right now.</p>
      ) : (
        <div className="mt-8 grid gap-10 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)]">
          <div>
            {data && data.items.length ? (
              <ul className="divide-y divide-line">
                {data.items.map((review) => (
                  <li key={review._id} className="py-5 first:pt-0">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="text-[13px] font-medium text-ink">{review.userName}</p>
                      <Stars value={review.rating} />
                    </div>
                    {review.title ? (
                      <p className="mt-1 text-[13px] text-ink">{review.title}</p>
                    ) : null}
                    <p className="mt-1 text-[12px] leading-relaxed text-ink-soft">{review.comment}</p>
                    <p className="mt-2 font-mono text-[8px] uppercase tracking-[0.12em] text-muted">
                      {new Date(review.createdAt).toLocaleDateString()}
                      {myReview?._id === review._id ? ' · your review' : ''}
                    </p>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="py-8 text-[13px] text-muted">
                No reviews yet — be the first to share your experience.
              </p>
            )}
          </div>

          <div className="border border-line bg-surface p-5 sm:p-6">
            {session ? (
              <form onSubmit={submit} className="space-y-4">
                <div className="flex items-center justify-between gap-3">
                  <p className="eyebrow">{myReview ? 'Update your review' : 'Write a review'}</p>
                  <div className="flex gap-1" role="radiogroup" aria-label="Rating">
                    {[1, 2, 3, 4, 5].map((value) => (
                      <button
                        key={value}
                        type="button"
                        onClick={() => setRating(value)}
                        className={cn(
                          'focus-ring px-1 text-lg leading-none transition-colors',
                          value <= rating ? 'text-accent' : 'text-line-strong hover:text-ink-soft',
                        )}
                        aria-pressed={value === rating}
                        aria-label={`${value} star${value === 1 ? '' : 's'}`}
                      >
                        ★
                      </button>
                    ))}
                  </div>
                </div>

                <label className="grid gap-2 text-[10px] font-medium uppercase tracking-[0.14em] text-ink-soft">
                  Title <span className="normal-case text-muted">(optional)</span>
                  <input
                    type="text"
                    value={title}
                    onChange={(event) => setTitle(event.target.value)}
                    maxLength={120}
                    placeholder="Sum it up in a few words"
                    className="border border-line bg-canvas px-3 py-2.5 text-[13px] font-normal normal-case tracking-normal text-ink outline-none transition-colors placeholder:text-muted/70 focus:border-ink"
                  />
                </label>

                <label className="grid gap-2 text-[10px] font-medium uppercase tracking-[0.14em] text-ink-soft">
                  Your review
                  <textarea
                    value={comment}
                    onChange={(event) => setComment(event.target.value)}
                    maxLength={2000}
                    rows={4}
                    required
                    placeholder="How was the piece? Fit, fabric, delivery…"
                    className="resize-y border border-line bg-canvas px-3 py-2.5 text-[13px] font-normal normal-case tracking-normal text-ink outline-none transition-colors placeholder:text-muted/70 focus:border-ink"
                  />
                </label>

                {formError ? <p className="text-[11px] text-danger" role="alert">{formError}</p> : null}
                {saved ? <p className="text-[11px] text-success">Thanks — your review is live.</p> : null}

                <Button variant="accent" type="submit" loading={saving} className="w-full">
                  {myReview ? 'Update review' : 'Post review'}
                </Button>
              </form>
            ) : (
              <div className="text-center">
                <p className="text-[13px] text-ink-soft">
                  Sign in to share your experience with this piece.
                </p>
                <Link
                  to="/login"
                  className="mt-4 inline-flex h-10 items-center justify-center border border-line px-5 font-mono text-[9px] uppercase tracking-[0.14em] text-ink transition-colors hover:border-ink"
                >
                  Sign in to review
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </section>
  )
}
