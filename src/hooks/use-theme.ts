import { useCallback, useEffect, useState } from 'react'

const STORAGE_KEY = 'nova.theme'

export type ThemePreference = 'light' | 'dark' | 'system'
export type ResolvedTheme = 'light' | 'dark'

const isPreference = (value: unknown): value is ThemePreference =>
  value === 'light' || value === 'dark' || value === 'system'

/** Reads the persisted preference. The payload mirrors NOVA's store shape. */
export function readThemePreference(): ThemePreference {
  if (typeof window === 'undefined') return 'system'
  try {
    const stored = JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? 'null')
    const preference = stored?.state?.preference
    return isPreference(preference) ? preference : 'system'
  } catch {
    return 'system'
  }
}

export function resolveTheme(preference: ThemePreference): ResolvedTheme {
  if (preference === 'system') {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  }
  return preference
}

/**
 * Applies the theme to <html>. The short `theme-changing` window lets colours
 * cross-fade instead of snapping when the preference changes.
 */
export function applyTheme(preference: ThemePreference): ResolvedTheme {
  const resolved = resolveTheme(preference)
  if (typeof document === 'undefined') return resolved

  const root = document.documentElement
  root.classList.add('theme-changing')
  root.classList.toggle('dark', resolved === 'dark')
  root.style.colorScheme = resolved

  const meta = document.querySelector('meta[name="theme-color"]')
  if (meta) meta.setAttribute('content', resolved === 'dark' ? '#101110' : '#f2f0e8')

  window.setTimeout(() => root.classList.remove('theme-changing'), 380)
  return resolved
}

/**
 * Dependency-free replacement for NOVA's Zustand theme store.
 * Follows the operating system while the preference is "system".
 */
export function useTheme() {
  const [preference, setPreferenceState] = useState<ThemePreference>(readThemePreference)

  useEffect(() => {
    applyTheme(preference)
    if (preference !== 'system') return

    const media = window.matchMedia('(prefers-color-scheme: dark)')
    const handleChange = () => applyTheme('system')
    media.addEventListener('change', handleChange)
    return () => media.removeEventListener('change', handleChange)
  }, [preference])

  const setPreference = useCallback((next: ThemePreference) => {
    setPreferenceState(next)
    try {
      window.localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ state: { preference: next }, version: 0 }),
      )
    } catch {
      /* storage can be unavailable in private mode — the in-memory value still applies */
    }
  }, [])

  return { preference, setPreference }
}
