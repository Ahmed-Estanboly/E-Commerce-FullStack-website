import { Mail, RotateCcw, Store, Truck } from '../components/ui/icons'
import type { Department, HomeService, PresentationType } from '../types/home'

/**
 * Editorial imagery.
 *
 * NOVA's approved photography, copied into `public/images/` so the storefront
 * does not depend on a third-party CDN at runtime.
 *
 * Sources (Unsplash, used under the Unsplash licence):
 *   fashion ............... photo-1490481651871-ab68de25d43d
 *   pantry ................ photo-1542838132-92c53300491e
 *   audio ................. photo-1505740420928-5e560c06d30e
 *   furniture ............. photo-1586023492125-27b2c045efd7
 *   beauty ................ photo-1556228720-195a672e8a03
 *   objects ............... photo-1581783898377-1c85bf937427
 *   editorial/world ...... photo-1539109136881-3be0616acf4b
 */
const category = (name: string): string => `/images/departments/${name}.jpg`

export const EDITORIAL_IMAGES = {
  worldFashion: '/images/editorial/world-fashion.jpg',
} as const

/**
 * Homepage departments.
 *
 * Presentation-only content: names, captions and photography. No branches,
 * inventory or NOVA catalogue identifiers travel with them. `slug` is the value
 * the storefront passes to `/shop?category=…` so the shop page can filter once
 * that view lands.
 */
export const HOME_DEPARTMENTS: Department[] = [
  {
    id: 'fashion',
    name: 'Fashion & Footwear',
    slug: 'fashion',
    presentation: 'fashion',
    description:
      'Softly structured tailoring, knitwear with weight, and footwear made to be resoled. Pieces chosen for the way they live, not the season they belong to.',
    caption: 'Tailoring, knitwear and considered footwear.',
    image: category('fashion'),
    heroLabel: '01 / Style',
    heroKicker: 'Enter the wardrobe',
  },
  {
    id: 'pantry',
    name: 'Pantry & Fresh',
    slug: 'pantry-fresh',
    presentation: 'culinary',
    description:
      'A small counter of seasonal produce, bread, oils and responsibly sourced meat. Chosen for the table, not for the shelf life.',
    caption: 'A daily counter of produce, bread and store-cupboard staples.',
    image: category('pantry'),
    heroLabel: '02 / Pantry',
    heroKicker: 'From the counter',
  },
  {
    id: 'audio',
    name: 'Audio & Tech',
    slug: 'audio-tech',
    presentation: 'electronics',
    description:
      'A deliberately short list of audio and writing tools. Specifications are listed plainly, with no inflated claims and no invented benchmarks.',
    caption: 'Considered audio and writing instruments.',
    image: category('audio'),
    heroLabel: '03 / Audio',
    heroKicker: 'Listen closely',
  },
  {
    id: 'furniture',
    name: 'Furniture & Home',
    slug: 'furniture-home',
    presentation: 'furniture',
    description:
      'Solid timber, natural fibres and lighting with presence. Each piece is documented with dimensions and assembly notes before you commit.',
    caption: 'Quiet forms in oak, linen and glass.',
    image: category('furniture'),
    heroLabel: '04 / Home',
    heroKicker: 'For the room',
  },
  {
    id: 'beauty',
    name: 'Beauty & Care',
    slug: 'beauty-care',
    presentation: 'beauty',
    description:
      'A concise shelf of daily care and fragrance. Ingredients and usage are shown as supplied — never embellished.',
    caption: 'Daily care, composed without noise.',
    image: category('beauty'),
    heroLabel: '05 / Care',
    heroKicker: 'A daily shelf',
  },
  {
    id: 'objects',
    name: 'Objects & Gifts',
    slug: 'objects-gifts',
    presentation: 'general',
    description:
      'Small, useful things: ceramics, textiles, candles and paper. The uncomplicated pieces that make a room feel finished.',
    caption: 'Small objects with a long life.',
    image: category('objects'),
    heroLabel: '06 / Objects',
    heroKicker: 'Small and lasting',
  },
]

/**
 * The service panel replaces NOVA's branch selector.
 *
 * NOVA's original block let visitors pick one of five physical branches and
 * read local stock. The new project has no branch system, so the same dark
 * stage now explains how an order reaches the customer instead. Copy only —
 * checkout and fulfilment logic stay with their owners.
 */
export const HOME_SERVICES: HomeService[] = [
  {
    id: 'delivery',
    name: 'Delivery',
    icon: Truck,
    caption: 'Packed by hand, sent from the studio.',
    description:
      'Every order is checked and packed in the studio before it leaves. Delivery is tracked from the moment it is collected to the moment it reaches the door.',
    details: [
      { label: 'Coverage', value: 'Nationwide, tracked' },
      { label: 'Timing', value: '2–4 working days' },
      { label: 'Cost', value: 'Complimentary over $75' },
      { label: 'Notes', value: 'Signature not required' },
    ],
  },
  {
    id: 'collection',
    name: 'Collection',
    icon: Store,
    caption: 'Reserved and ready at the counter.',
    description:
      'Choose collection at checkout and the piece is held for you. Bring the order reference and we will have it wrapped and waiting.',
    details: [
      { label: 'Coverage', value: 'Studio counter' },
      { label: 'Timing', value: 'Ready within 24 hours' },
      { label: 'Cost', value: 'No charge' },
      { label: 'Notes', value: 'Held for seven days' },
    ],
  },
  {
    id: 'returns',
    name: 'Returns',
    icon: RotateCcw,
    caption: 'Thirty days, no questions.',
    description:
      'If a piece is not right, send it back unworn in its original packaging within thirty days. Refunds are issued to the original payment method.',
    details: [
      { label: 'Window', value: '30 days from delivery' },
      { label: 'Condition', value: 'Unworn, original packaging' },
      { label: 'Cost', value: 'Free returns' },
      { label: 'Notes', value: 'Exclusions listed at checkout' },
    ],
  },
  {
    id: 'support',
    name: 'Support',
    icon: Mail,
    caption: 'A person, not a bot.',
    description:
      'Questions about fit, care, an order or a gift can go straight to the studio. We answer in the order they arrive, usually the same day.',
    details: [
      { label: 'Hours', value: 'Monday to Saturday' },
      { label: 'Reply', value: 'Within one working day' },
      { label: 'Email', value: 'care@nova.demo' },
      { label: 'Notes', value: 'Demo inbox, no real mail' },
    ],
  },
]

/** Maps an API category name onto one of the six fallback illustration families. */
export function presentationForCategory(name?: string): PresentationType {
  const value = (name ?? '').toLowerCase()
  if (value.includes('cloth') || value.includes('shoe') || value.includes('fashion')) {
    return 'fashion'
  }
  if (value.includes('electronic') || value.includes('tech') || value.includes('audio')) {
    return 'electronics'
  }
  if (value.includes('furniture') || value.includes('home')) return 'furniture'
  if (value.includes('beauty') || value.includes('care')) return 'beauty'
  if (value.includes('food') || value.includes('pantry')) return 'culinary'
  return 'general'
}

/** Returns the editorial department that best matches an API category. */
export function departmentForCategory(name?: string): Department | undefined {
  const value = (name ?? '').toLowerCase()
  if (value.includes('cloth') || value.includes('shoe') || value.includes('fashion')) {
    return HOME_DEPARTMENTS[0]
  }
  if (value.includes('electronic') || value.includes('tech')) return HOME_DEPARTMENTS[2]
  if (value.includes('furniture')) return HOME_DEPARTMENTS[3]
  if (value.includes('beauty')) return HOME_DEPARTMENTS[4]
  if (value.includes('misc') || value.includes('object')) return HOME_DEPARTMENTS[5]
  return undefined
}
