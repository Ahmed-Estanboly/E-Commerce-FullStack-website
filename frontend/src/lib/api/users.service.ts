import { backendClient, unwrap, type ApiEnvelope } from './client'

export interface BackendUser {
  id: number
  name: string
  email: string
  role: string
  branchId?: string
  avatar?: string
  phone?: string
  createdAt: string
  updatedAt: string
}

export interface CreateUserPayload {
  name: string
  email: string
  password: string
  role: string
}

export interface UpdateUserPayload {
  name?: string
  email?: string
  role?: string
  password?: string
}

export const usersService = {
  async getUsers(signal?: AbortSignal): Promise<BackendUser[]> {
    const response = await backendClient.get<ApiEnvelope<BackendUser[]>>('/users', { signal })
    return unwrap(response.data)
  },

  async createUser(payload: CreateUserPayload): Promise<BackendUser> {
    const response = await backendClient.post<ApiEnvelope<BackendUser>>('/users', payload)
    return unwrap(response.data)
  },

  async updateUser(id: number, payload: UpdateUserPayload): Promise<BackendUser> {
    const response = await backendClient.patch<ApiEnvelope<BackendUser>>(`/users/${id}`, payload)
    return unwrap(response.data)
  },

  async deleteUser(id: number): Promise<BackendUser> {
    const response = await backendClient.delete<ApiEnvelope<BackendUser>>(`/users/${id}`)
    return unwrap(response.data)
  },
}
