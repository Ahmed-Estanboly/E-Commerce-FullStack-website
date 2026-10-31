import { useEffect, useRef, type RefObject } from 'react'

/** Closes a menu or dropdown when a pointer lands outside its container. */
export function useClickOutside<T extends HTMLElement>(
  onOutside: () => void,
): RefObject<T | null> {
  const ref = useRef<T | null>(null)
  const callback = useRef(onOutside)

  useEffect(() => {
    callback.current = onOutside
  })

  useEffect(() => {
    const handler = (event: MouseEvent | TouchEvent) => {
      const element = ref.current
      if (!element || element.contains(event.target as Node)) return
      callback.current()
    }
    document.addEventListener('mousedown', handler)
    document.addEventListener('touchstart', handler)
    return () => {
      document.removeEventListener('mousedown', handler)
      document.removeEventListener('touchstart', handler)
    }
  }, [])

  return ref
}
