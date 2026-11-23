import { backendClient, unwrap } from './client'

export interface AuthUser {
  id: number
  name: string
  email: string
  role: string
  avatar?: string
  phone?: string
  branchId?: string
}

export interface LoginCredentials {
  email: string
  password: string
}

export interface RegisterCredentials {
  name: string
  email: string
  password: string
}

export interface AuthResponse {
  access_token: string
  refresh_token?: string
  user: AuthUser
}

export interface UpdateProfilePayload {
  name?: string
  avatar?: string
  phone?: string
  password?: string
}

type Envelope<T> = { success: boolean; data: T }

export const authService = {
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    const response = await backendClient.post<Envelope<AuthResponse>>('/auth/login', credentials)
    return unwrap(response.data)
  },

  async register(credentials: RegisterCredentials): Promise<AuthResponse> {
    const response = await backendClient.post<Envelope<AuthResponse>>('/auth/register', credentials)
    return unwrap(response.data)
  },

  async refresh(refreshToken: string): Promise<AuthResponse> {
    const response = await backendClient.post<Envelope<AuthResponse>>('/auth/refresh', { refreshToken })
    return unwrap(response.data)
  },

  async logout(): Promise<void> {
    await backendClient.post('/auth/logout').catch(() => undefined)
  },

  async me(): Promise<AuthUser> {
    const response = await backendClient.get<Envelope<AuthUser>>('/auth/me')
    return unwrap(response.data)
  },

  async updateProfile(payload: UpdateProfilePayload): Promise<AuthUser> {
    const response = await backendClient.patch<Envelope<AuthUser>>('/auth/profile', payload)
    return unwrap(response.data)
  },
}
