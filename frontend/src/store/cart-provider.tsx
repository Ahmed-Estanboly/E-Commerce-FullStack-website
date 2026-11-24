import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import type { Product } from '../types/product'
import { AUTH_SESSION_CHANGED_EVENT, getStoredSession } from '../lib/auth'
import { CartContext, type CartItem } from './cart-context'
import { SELECTED_BRANCH_KEY, useBranchSelection } from './branch-context'

const LEGACY_CART_STORAGE_KEY = 'nova-cart'
const CART_STORAGE_PREFIX = 'nova-cart:user:'
const GUEST_CART_STORAGE_KEY = `${CART_STORAGE_PREFIX}guest`

function getCartStorageKey(userId: number | null): string {
  return userId === null ? GUEST_CART_STORAGE_KEY : `${CART_STORAGE_PREFIX}${userId}`
}

function getCurrentUserId(): number | null {
  return getStoredSession()?.user.id ?? null
}

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

function loadCart(storageKey: string): CartItem[] {
  try {
    const stored = window.localStorage.getItem(storageKey)
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
        branchName: typeof item.branchName === 'string' ? item.branchName : 'Store branch',
        productId: item.product.id,
        title: item.product.title,
        price: item.product.price,
        image: item.product.images[0] ?? '',
      }]
    })
    if (items.length !== parsed.length) {
      console.warn('Invalid saved cart items were ignored.')
    }
    const merged = new Map<string, CartItem>()
    for (const item of items) {
      const key = `${item.branchId}-${item.product.id}`
      const existing = merged.get(key)
      if (existing) {
        merged.set(key, {
          ...existing,
          quantity: existing.quantity + item.quantity,
          product: item.product,
        })
      } else {
        merged.set(key, item)
      }
    }
    return Array.from(merged.values())
  } catch (error) {
    console.error('Unable to read the saved cart.', error)
    return []
  }
}

/** Owns cart mutations and keeps valid cart contents available across refreshes. */
export function CartProvider({ children }: { children: ReactNode }) {
  const { selectedBranchId, selectedBranch, branches } = useBranchSelection()
  const [userId, setUserId] = useState<number | null>(getCurrentUserId)
  const [items, setItems] = useState<CartItem[]>(() => loadCart(getCartStorageKey(getCurrentUserId())))

  useEffect(() => {
    const syncSession = () => {
      const nextUserId = getCurrentUserId()
      if (userId === nextUserId) return
      setItems(loadCart(getCartStorageKey(nextUserId)))
      setUserId(nextUserId)
    }

    window.addEventListener(AUTH_SESSION_CHANGED_EVENT, syncSession)
    window.addEventListener('storage', syncSession)
    return () => {
      window.removeEventListener(AUTH_SESSION_CHANGED_EVENT, syncSession)
      window.removeEventListener('storage', syncSession)
    }
  }, [userId])

  useEffect(() => {
    window.localStorage.removeItem(LEGACY_CART_STORAGE_KEY)
  }, [])

  const normalizedItems = useMemo(() => items.map((item) => {
    const branch = branches.find((candidate) => candidate._id === item.branchId)
    return branch && item.branchName !== branch.name
      ? { ...item, branchName: branch.name }
      : item
  }), [items, branches])

  useEffect(() => {
    try {
      window.localStorage.setItem(getCartStorageKey(userId), JSON.stringify(normalizedItems))
    } catch (error) {
      console.error('Unable to save the cart.', error)
    }
  }, [normalizedItems, userId])

  const addItem = useCallback((product: Product, quantity = 1) => {
    if (!selectedBranchId || !selectedBranch || !Number.isInteger(quantity) || quantity < 1) return
    setItems((current) => {
      const existing = current.find(
        (item) => item.product.id === product.id && item.branchId === selectedBranchId,
      )
      const nextQuantity = (existing?.quantity ?? 0) + quantity
      if (nextQuantity > product.stock) return current
      if (existing) {
        return current.map((item) =>
          item.product.id === product.id && item.branchId === selectedBranchId
            ? {
              ...item,
              product,
              quantity: nextQuantity,
              productId: product.id,
              title: product.title,
              price: product.price,
              image: product.images[0] ?? '',
            }
            : item,
        )
      }
      return [...current, {
        product,
        quantity,
        branchId: selectedBranchId,
        branchName: selectedBranch.name,
        productId: product.id,
        title: product.title,
        price: product.price,
        image: product.images[0] ?? '',
      }]
    })
  }, [selectedBranchId, selectedBranch])

  // Keep each product at a quantity of at least one; removal is a separate action.
  const updateQuantity = useCallback((productId: number, quantity: number, branchId?: string) => {
    if (!Number.isInteger(quantity) || quantity < 1) return
    const targetBranchId = branchId ?? selectedBranchId
    setItems((current) =>
      current.map((item) =>
        item.product.id === productId && item.branchId === targetBranchId
          ? { ...item, quantity: Math.min(quantity, item.product.stock) }
          : item,
      ),
    )
  }, [selectedBranchId])

  const removeItem = useCallback((productId: number, branchId?: string) => {
    const targetBranchId = branchId ?? selectedBranchId
    setItems((current) => current.filter(
      (item) => item.product.id !== productId || item.branchId !== targetBranchId,
    ))
  }, [selectedBranchId])

  const clearCart = useCallback(() => {
    setItems([])
  }, [])

  const value = useMemo(
    () => ({
      items: normalizedItems,
      itemCount: normalizedItems.reduce((total, item) => total + item.quantity, 0),
      subtotal: normalizedItems.reduce((total, item) => total + item.product.price * item.quantity, 0),
      addItem,
      updateQuantity,
      removeItem,
      clearCart,
    }),
    [normalizedItems, addItem, updateQuantity, removeItem, clearCart],
  )

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}
