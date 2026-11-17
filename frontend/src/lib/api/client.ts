import axios from 'axios'

/** Public storefront API (products, categories). */
export const apiClient = axios.create({
  baseURL: 'https://api.escuelajs.co/api/v1',
  headers: {
    'Content-Type': 'application/json',
  },
})

const AUTH_STORAGE_KEY = 'nova-auth-session'

function getStoredToken(): string | null {
  try {
    const raw = window.localStorage.getItem(AUTH_STORAGE_KEY) ?? window.sessionStorage.getItem(AUTH_STORAGE_KEY)
    return raw ? (JSON.parse(raw) as { token?: string }).token ?? null : null
  } catch {
    return null
  }
}

/** NestJS backend API (auth, users, branches). Base URL overridable via VITE_API_URL. */
export const backendClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? 'http://localhost:3000/api/v1',
  headers: {
    'Content-Type': 'application/json',
  },
})

backendClient.interceptors.request.use((config) => {
  const token = getStoredToken()
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

/** Alias kept for API modules that refer to the backend client by this name. */
export const backendApiClient = backendClient

/** The backend wraps successful responses as { success, data, timestamp }. */
export function unwrap<T>(payload: { success: boolean; data: T }): T {
  return payload.data
}

export { AUTH_STORAGE_KEY }
