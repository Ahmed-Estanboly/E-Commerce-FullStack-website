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

export const usersService = {
  async getUsers(signal?: AbortSignal): Promise<BackendUser[]> {
    const response = await backendClient.get<ApiEnvelope<BackendUser[]>>('/users', { signal })
    return unwrap(response.data)
  },
}
