import { createContext, useContext } from 'react'
import type { Product } from '../types/product'

export interface CartItem {
  product: Product
  quantity: number
}

interface CartContextValue {
  items: CartItem[]
  itemCount: number
  subtotal: number
  addItem: (product: Product) => void
  updateQuantity: (productId: number, quantity: number) => void
  removeItem: (productId: number) => void
}

/** Shared cart contract used by the storefront shell, product surfaces, and cart page. */
export const CartContext = createContext<CartContextValue | null>(null)

export function useCart() {
  const context = useContext(CartContext)
  if (!context) {
    throw new Error('useCart must be used within a CartProvider.')
  }
  return context
}
