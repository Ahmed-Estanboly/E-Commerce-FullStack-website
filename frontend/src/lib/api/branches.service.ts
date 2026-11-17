import axios from 'axios'
import { backendApiClient } from './client'
import type { Branch, BranchInventoryItem, CreateBranchInput } from '../../types/branch'

interface ApiResponse<T> {
  success: boolean;
  data: T;
  timestamp: string;
}

export const branchesService = {
  async getBranches(signal?: AbortSignal): Promise<Branch[]> {
    const response = await backendApiClient.get<ApiResponse<Branch[]>>('/branches', { signal })
    return response.data.data
  },

  async createBranch(input: CreateBranchInput): Promise<Branch> {
    const response = await backendApiClient.post<ApiResponse<Branch>>('/branches', input)
    return response.data.data
  },

  async updateBranch(id: string, input: Partial<CreateBranchInput> & { isActive?: boolean }): Promise<Branch> {
    const response = await backendApiClient.patch<ApiResponse<Branch>>(`/branches/${id}`, input)
    return response.data.data
  },

  async deleteBranch(id: string): Promise<void> {
    await backendApiClient.delete<ApiResponse<Branch>>(`/branches/${id}`)
  },

  async getBranchInventory(branchId: string, signal?: AbortSignal): Promise<BranchInventoryItem[]> {
    const response = await backendApiClient.get<ApiResponse<BranchInventoryItem[]>>(
      `/branches/${branchId}/inventory`,
      { signal },
    )
    return response.data.data
  },

  async setBranchProductQuantity(branchId: string, productId: number, quantity: number): Promise<void> {
    await backendApiClient.put<ApiResponse<{ productId: number; quantity: number }>>(
      `/branches/${branchId}/inventory/${productId}`,
      { quantity },
    )
  },
}

export function getBranchRequestError(error: unknown, fallback: string): string {
  if (!axios.isAxiosError(error)) return fallback

  const message: unknown = error.response?.data?.message
  if (typeof message === 'string') return message
  if (Array.isArray(message)) return message.join(', ')
  return error.message || fallback
}
