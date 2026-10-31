import { apiClient } from './client'

export interface LoginCredentials {
  email: string
  password: string
}

export interface LoginResponse {
  access_token: string
  refresh_token?: string
}

export const authService = {
  async login(credentials: LoginCredentials): Promise<LoginResponse> {
    const response = await apiClient.post<LoginResponse>('/auth/login', credentials)

    return response.data
  },
}