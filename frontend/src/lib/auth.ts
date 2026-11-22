import type { AuthUser } from './api/auth.service'
import { AUTH_STORAGE_KEY } from './api/client'

export interface AuthSession {
  token: string
  user: AuthUser
}

export function saveSession(session: AuthSession, rememberMe: boolean) {
  window.localStorage.removeItem(AUTH_STORAGE_KEY)
  window.sessionStorage.removeItem(AUTH_STORAGE_KEY)
  const storage = rememberMe ? window.localStorage : window.sessionStorage
  storage.setItem(AUTH_STORAGE_KEY, JSON.stringify(session))
}

export function updateSessionUser(user: AuthUser) {
  const session = getStoredSession()
  if (!session) return
  const next = { ...session, user }
  const rememberMe = Boolean(window.localStorage.getItem(AUTH_STORAGE_KEY))
  saveSession(next, rememberMe)
}

export function clearSession() {
  window.localStorage.removeItem(AUTH_STORAGE_KEY)
  window.sessionStorage.removeItem(AUTH_STORAGE_KEY)
  window.localStorage.removeItem('auth_token')
  window.sessionStorage.removeItem('auth_token')
}

export function getStoredSession(): AuthSession | null {
  const raw = window.localStorage.getItem(AUTH_STORAGE_KEY) ?? window.sessionStorage.getItem(AUTH_STORAGE_KEY)
  if (!raw) return null
  try {
    const session = JSON.parse(raw) as AuthSession
    return session?.token && session?.user ? session : null
  } catch {
    return null
  }
}

export function isAdmin(user: AuthUser): boolean {
  return user.role.toLowerCase().includes('admin')
}

export function isBranchOwner(user: AuthUser): boolean {
  return !isAdmin(user) && user.role.toLowerCase().includes('owner')
}

export function getBranchSlug(user: AuthUser): string | null {
  if (!isBranchOwner(user)) return null
  if (user.branchId) return user.branchId
  const role = user.role.toLowerCase()
  if (role === 'branch owner') return 'north-house'
  if (role === 'central owner') return 'central-house'
  if (role === 'south owner') return 'south-house'
  return null
}

/** Where a signed-in user lands after login / which dashboard link they get. */
export function getDashboardDestination(user: AuthUser): string {
  if (isAdmin(user)) return '/admin/dashboard'
  const slug = getBranchSlug(user)
  if (slug) return `/${slug}/dashboard`
  return '/account'
}
