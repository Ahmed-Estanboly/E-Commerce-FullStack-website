import type { ComponentType } from 'react'
import type { IconProps } from '../components/ui/icons'

/** Visual family used to pick a category-aware image fallback. */
export type PresentationType =
  | 'fashion'
  | 'culinary'
  | 'electronics'
  | 'furniture'
  | 'beauty'
  | 'general'

export type ThemePreference = 'light' | 'dark' | 'system'

export interface Department {
  id: string
  name: string
  slug: string
  presentation: PresentationType
  description: string
  caption: string
  image: string
  /** Short hero label, e.g. "01 / Style". */
  heroLabel?: string
  heroKicker?: string
}

export interface ServiceDetail {
  label: string
  value: string
}

export interface HomeService {
  id: string
  name: string
  icon: ComponentType<IconProps>
  caption: string
  description: string
  details: ServiceDetail[]
}
