import { createContext, useContext } from 'react'
import type { Product } from '../types/product'

export interface CartItem {
  product: Product
  quantity: number
  branchId: string
  branchName: string
  productId: number
  title: string
  price: number
  image: string
}

interface CartContextValue {
  items: CartItem[]
  itemCount: number
  subtotal: number
  addItem: (product: Product, quantity?: number) => void
  updateQuantity: (productId: number, quantity: number, branchId?: string) => void
  removeItem: (productId: number, branchId?: string) => void
  clearCart: () => void
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
