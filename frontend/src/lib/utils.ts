import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

/** Merge conditional class names without Tailwind utility conflicts. */
export const cn = (...inputs: ClassValue[]): string => twMerge(clsx(inputs))

/**
 * Store currency settings for the shared storefront UI.
 *
 * The team API (api.escuelajs.co) returns whole-dollar prices, so this module
 * formats plain amounts rather than NOVA's minor units.
 */
export const STORE = {
  name: 'NOVA',
  supportEmail: 'care@nova.demo',
  currency: 'USD',
  locale: 'en-US',
} as const

export const formatPrice = (
  value: number,
  options: { currency?: string; locale?: string; showDecimals?: boolean } = {},
): string => {
  const { currency = STORE.currency, locale = STORE.locale, showDecimals = false } = options
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits: showDecimals ? 2 : 0,
    maximumFractionDigits: showDecimals ? 2 : 0,
  }).format(Number.isFinite(value) ? value : 0)
}

export const pluralise = (count: number, singular: string, plural = `${singular}s`): string =>
  `${count} ${count === 1 ? singular : plural}`

export const truncate = (value: string, max = 148): string => {
  const clean = value.trim()
  if (clean.length <= max) return clean
  return `${clean.slice(0, max).replace(/[\s,.;:-]+$/, '')}…`
}

/**
 * Adds responsive sizing parameters to known image CDN URLs so the editorial
 * photography is not downloaded at full resolution.
 */
export const sizedImage = (url: string, width: number): string => {
  if (!url) return url
  if (url.includes('images.unsplash.com')) {
    try {
      const parsed = new URL(url)
      parsed.searchParams.set('w', String(width))
      parsed.searchParams.set('q', '80')
      parsed.searchParams.set('auto', 'format')
      return parsed.toString()
    } catch {
      return url
    }
  }
  return url
}
