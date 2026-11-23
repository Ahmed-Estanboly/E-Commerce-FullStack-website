import axios from 'axios'

const AUTH_STORAGE_KEY = 'nova-auth-session'

function getStoredToken(): string | null {
  try {
    const raw = window.localStorage.getItem(AUTH_STORAGE_KEY) ?? window.sessionStorage.getItem(AUTH_STORAGE_KEY)
    return raw ? (JSON.parse(raw) as { token?: string }).token ?? null : null
  } catch {
    return null
  }
}

/** NestJS backend API for the whole storefront. Base URL overridable via VITE_API_URL. */
export const backendClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? '/api/v1',
  headers: {
    'Content-Type': 'application/json',
  },
})

export interface ApiEnvelope<T> {
  success: boolean
  data: T
  timestamp: string
}

backendClient.interceptors.request.use((config) => {
  const token = getStoredToken()
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

let refreshPromise: Promise<boolean> | null = null

async function tryRefreshToken(): Promise<boolean> {
  const raw = window.localStorage.getItem(AUTH_STORAGE_KEY) ?? window.sessionStorage.getItem(AUTH_STORAGE_KEY)
  const refreshToken = raw ? (JSON.parse(raw) as { refreshToken?: string }).refreshToken : undefined
  if (!refreshToken) return false
  try {
    const response = await axios.post<ApiEnvelope<{ access_token: string; refresh_token?: string }>>(
      `${backendClient.defaults.baseURL}/auth/refresh`,
      { refreshToken },
    )
    const data = response.data.data
    const sessionRaw = window.localStorage.getItem(AUTH_STORAGE_KEY) ?? window.sessionStorage.getItem(AUTH_STORAGE_KEY)
    if (sessionRaw) {
      const session = JSON.parse(sessionRaw) as { token?: string; refreshToken?: string; user?: unknown }
      session.token = data.access_token
      if (data.refresh_token) session.refreshToken = data.refresh_token
      const rememberMe = Boolean(window.localStorage.getItem(AUTH_STORAGE_KEY))
      const storage = rememberMe ? window.localStorage : window.sessionStorage
      storage.setItem(AUTH_STORAGE_KEY, JSON.stringify(session))
    }
    return true
  } catch {
    return false
  }
}

backendClient.interceptors.response.use(
  (response) => response,
  async (error: unknown) => {
    if (!axios.isAxiosError(error)) return Promise.reject(error)
    const original = error.config as (import('axios').AxiosRequestConfig & { _retried?: boolean }) | undefined
    const isAuthRoute = original?.url?.includes('/auth/')
    if (error.response?.status !== 401 || isAuthRoute || !original || original._retried) {
      return Promise.reject(error)
    }
    original._retried = true
    refreshPromise ??= tryRefreshToken().finally(() => { refreshPromise = null })
    const refreshed = await refreshPromise
    if (!refreshed) return Promise.reject(error)
    return backendClient.request(original)
  },
)

/** Alias kept for API modules that refer to the backend client by this name. */
export const backendApiClient = backendClient

/** Downloads a CSV endpoint (auth header attached automatically) as a file. */
export async function downloadCsv(path: string, filename: string) {
  const response = await backendClient.get(path, { responseType: 'blob' })
  const url = URL.createObjectURL(response.data as Blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}

/** The backend wraps successful responses as { success, data, timestamp }. */
export function unwrap<T>(payload: { success: boolean; data: T }): T {
  return payload.data
}

export { AUTH_STORAGE_KEY }
