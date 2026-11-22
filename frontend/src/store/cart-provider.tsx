import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import type { Product } from '../types/product'
import { CartContext, type CartItem } from './cart-context'
import { SELECTED_BRANCH_KEY, useBranchSelection } from './branch-context'

const CART_STORAGE_KEY = 'nova-cart'

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function isProduct(value: unknown): value is Product {
  return (
    isRecord(value) &&
    typeof value._id === 'string' &&
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

    const defaultBranchId = window.localStorage.getItem(SELECTED_BRANCH_KEY) ?? ''
    const items = parsed.flatMap((item): CartItem[] => {
      if (
        !isRecord(item) ||
        !isProduct(item.product) ||
        typeof item.quantity !== 'number' ||
        !Number.isInteger(item.quantity) ||
        item.quantity < 1
      ) {
        return []
      }

      return [{
        product: item.product,
        quantity: item.quantity,
        branchId: typeof item.branchId === 'string' ? item.branchId : defaultBranchId,
      }]
    })
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
  const { selectedBranchId } = useBranchSelection()
  const [items, setItems] = useState<CartItem[]>(loadCart)

  useEffect(() => {
    try {
      window.localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items))
    } catch (error) {
      console.error('Unable to save the cart.', error)
    }
  }, [items])

  const addItem = useCallback((product: Product, quantity = 1) => {
    if (!selectedBranchId || !Number.isInteger(quantity) || quantity < 1) return
    setItems((current) => {
      const existing = current.find(
        (item) => item.product.id === product.id && item.branchId === selectedBranchId,
      )
      const nextQuantity = (existing?.quantity ?? 0) + quantity
      if (nextQuantity > product.stock) return current
      if (existing) {
        return current.map((item) =>
          item.product.id === product.id && item.branchId === selectedBranchId
            ? { ...item, product, quantity: nextQuantity }
            : item,
        )
      }
      return [...current, { product, quantity, branchId: selectedBranchId }]
    })
  }, [selectedBranchId])

  // Keep each product at a quantity of at least one; removal is a separate action.
  const updateQuantity = useCallback((productId: number, quantity: number) => {
    if (!Number.isInteger(quantity) || quantity < 1) return
    setItems((current) =>
      current.map((item) =>
        item.product.id === productId && item.branchId === selectedBranchId
          ? { ...item, quantity: Math.min(quantity, item.product.stock) }
          : item,
      ),
    )
  }, [selectedBranchId])

  const removeItem = useCallback((productId: number) => {
    setItems((current) => current.filter(
      (item) => item.product.id !== productId || item.branchId !== selectedBranchId,
    ))
  }, [selectedBranchId])

  const clearCart = useCallback(() => {
    setItems([])
  }, [])

  const value = useMemo(
    () => ({
      items,
      itemCount: items.reduce((total, item) => total + item.quantity, 0),
      subtotal: items.reduce((total, item) => total + item.product.price * item.quantity, 0),
      addItem,
      updateQuantity,
      removeItem,
      clearCart,
    }),
    [items, addItem, updateQuantity, removeItem, clearCart],
  )

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}
