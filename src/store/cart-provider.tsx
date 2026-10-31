import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import type { Product } from '../types/product'
import { CartContext, type CartItem } from './cart-context'

const CART_STORAGE_KEY = 'nova-cart'

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function isProduct(value: unknown): value is Product {
  return (
    isRecord(value) &&
    typeof value.id === 'number' &&
    Number.isInteger(value.id) &&
    typeof value.title === 'string' &&
    typeof value.price === 'number' &&
    Number.isFinite(value.price) &&
    Array.isArray(value.images) &&
    value.images.every((image) => typeof image === 'string') &&
    isRecord(value.category) &&
    typeof value.category.name === 'string'
  )
}

function loadCart(): CartItem[] {
  try {
    const stored = window.localStorage.getItem(CART_STORAGE_KEY)
    if (!stored) return []

    const parsed: unknown = JSON.parse(stored)
    if (!Array.isArray(parsed)) {
      console.error('Saved cart data is invalid and was ignored.')
      return []
    }

    const items = parsed.filter(
      (item): item is CartItem =>
        isRecord(item) &&
        isProduct(item.product) &&
        typeof item.quantity === 'number' &&
        Number.isInteger(item.quantity) &&
        item.quantity > 0,
    )
    if (items.length !== parsed.length) {
      console.warn('Invalid saved cart items were ignored.')
    }
    return items
  } catch (error) {
    console.error('Unable to read the saved cart.', error)
    return []
  }
}

/** Owns cart mutations and keeps valid cart contents available across refreshes. */
export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>(loadCart)

  useEffect(() => {
    try {
      window.localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items))
    } catch (error) {
      console.error('Unable to save the cart.', error)
    }
  }, [items])

  const addItem = useCallback((product: Product) => {
    setItems((current) => {
      const existing = current.find((item) => item.product.id === product.id)
      if (existing) {
        return current.map((item) =>
          item.product.id === product.id ? { ...item, quantity: item.quantity + 1 } : item,
        )
      }
      return [...current, { product, quantity: 1 }]
    })
  }, [])

  // Keep each product at a quantity of at least one; removal is a separate action.
  const updateQuantity = useCallback((productId: number, quantity: number) => {
    if (!Number.isInteger(quantity) || quantity < 1) return
    setItems((current) =>
      current.map((item) =>
        item.product.id === productId ? { ...item, quantity } : item,
      ),
    )
  }, [])

  const removeItem = useCallback((productId: number) => {
    setItems((current) => current.filter((item) => item.product.id !== productId))
  }, [])

  const value = useMemo(
    () => ({
      items,
      itemCount: items.reduce((total, item) => total + item.quantity, 0),
      subtotal: items.reduce((total, item) => total + item.product.price * item.quantity, 0),
      addItem,
      updateQuantity,
      removeItem,
    }),
    [items, addItem, updateQuantity, removeItem],
  )

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}
