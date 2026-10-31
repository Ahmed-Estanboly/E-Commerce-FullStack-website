import { useEffect, useState, type ComponentType } from 'react'
import {
  Armchair,
  Headphones,
  Package,
  Shirt,
  Sparkles,
  UtensilsCrossed,
  type IconProps,
} from './icons'
import type { PresentationType } from '../../types/home'
import { cn, sizedImage } from '../../lib/utils'

const fallbackIcons: Record<PresentationType, ComponentType<IconProps>> = {
  fashion: Shirt,
  culinary: UtensilsCrossed,
  electronics: Headphones,
  furniture: Armchair,
  beauty: Sparkles,
  general: Package,
}

export interface SmartImageProps {
  src?: string | null
  alt: string
  /**
   * Second image to try when `src` is missing or fails. Used by the homepage so
   * a dead product photo falls back to the department's editorial photography
   * before the icon placeholder.
   */
  fallbackSrc?: string | null
  /** Used to select a category-aware fallback when no image can be shown. */
  presentation?: PresentationType
  fallbackLabel?: string
  className?: string
  imgClassName?: string
  sizes?: string
  priority?: boolean
  aspect?: 'square' | 'portrait' | 'landscape' | 'wide' | 'none'
  fit?: 'cover' | 'contain'
  primary?: boolean
}

const aspectClasses = {
  square: 'aspect-square',
  portrait: 'aspect-[4/5]',
  landscape: 'aspect-[4/3]',
  wide: 'aspect-[16/9]',
  none: '',
}

/**
 * Image with a designed loading state, an optional editorial fallback and a
 * category-aware placeholder. Failed, missing or stalled photography never
 * leaves a broken image in the layout.
 *
 * State is derived from the URL currently on screen, so changing `src` (for
 * example when a new product becomes active) resets the skeleton without an
 * effect that writes state during render.
 */
export function SmartImage({
  src,
  alt,
  fallbackSrc,
  presentation = 'general',
  fallbackLabel = 'NOVA',
  className,
  imgClassName,
  sizes = '(max-width: 768px) 100vw, 50vw',
  priority = false,
  aspect = 'none',
  fit = 'cover',
  primary = false,
}: SmartImageProps) {
  const primarySrc = src?.trim() ? src : null
  const secondarySrc = fallbackSrc?.trim() ? fallbackSrc : null
  const [fallbackFor, setFallbackFor] = useState<string | null>(null)
  const [loadedSrc, setLoadedSrc] = useState<string | null>(null)
  const [failedSrc, setFailedSrc] = useState<string | null>(null)

  const useSecondary = Boolean(primarySrc && secondarySrc && fallbackFor === primarySrc)
  const displaySrc = useSecondary ? secondarySrc : (primarySrc ?? secondarySrc)
  const loaded = Boolean(displaySrc && loadedSrc === displaySrc)
  const failed = Boolean(displaySrc && failedSrc === displaySrc)
  const Icon = fallbackIcons[presentation]

  // A third-party photo that never settles should not leave a skeleton on
  // screen forever: after five seconds the editorial fallback takes over, or
  // the placeholder appears when there is nothing else to show.
  useEffect(() => {
    if (!displaySrc || loaded || failed) return
    const timer = window.setTimeout(() => {
      if (displaySrc === primarySrc && secondarySrc) {
        setFallbackFor(primarySrc)
        return
      }
      setFailedSrc(displaySrc)
    }, 5000)
    return () => window.clearTimeout(timer)
  }, [displaySrc, loaded, failed, primarySrc, secondarySrc])

  const handleError = () => {
    if (displaySrc && displaySrc === primarySrc && secondarySrc) {
      setFallbackFor(primarySrc)
      return
    }
    setFailedSrc(displaySrc)
  }

  return (
    <div className={cn('relative overflow-hidden bg-canvas-alt', aspectClasses[aspect], className)}>
      {displaySrc && !failed ? (
        <>
          <img
            key={displaySrc}
            src={sizedImage(displaySrc, 1200)}
            srcSet={`${sizedImage(displaySrc, 480)} 480w, ${sizedImage(
              displaySrc,
              900,
            )} 900w, ${sizedImage(displaySrc, 1400)} 1400w`}
            sizes={sizes}
            alt={alt}
            {...(primary ? { 'data-primary': 'true' } : {})}
            loading={priority ? 'eager' : 'lazy'}
            decoding="async"
            fetchPriority={priority ? 'high' : 'auto'}
            onLoad={() => setLoadedSrc(displaySrc)}
            onError={handleError}
            className={cn(
              'h-full w-full transition-opacity duration-500',
              fit === 'cover' ? 'object-cover' : 'object-contain',
              loaded ? 'opacity-100' : 'opacity-0',
              imgClassName,
            )}
          />
          {loaded ? null : <div className="skeleton absolute inset-0" aria-hidden="true" />}
        </>
      ) : (
        <div
          className="flex h-full w-full flex-col items-center justify-center gap-3 bg-[linear-gradient(145deg,var(--canvas-alt),var(--surface))] px-4 text-center"
          role="img"
          aria-label={alt}
        >
          <div className="absolute inset-0 surface-grid" aria-hidden="true" />
          <Icon className="relative h-7 w-7 text-muted" strokeWidth={1} aria-hidden="true" />
          <span className="relative font-mono text-[8px] uppercase tracking-[0.22em] text-muted">
            {fallbackLabel}
          </span>
        </div>
      )}
    </div>
  )
}
