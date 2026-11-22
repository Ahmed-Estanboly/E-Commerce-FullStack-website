import { useCallback } from 'react'
import { branchesService } from '../lib/api/branches.service'
import type { BranchInventoryItem } from '../types/branch'
import { useFetch } from './useFetch'

export function useBranchCatalog(branchId: string | null) {
  const request = useCallback(
    (signal: AbortSignal) => branchId
      ? branchesService.getBranchCatalog(branchId, signal)
      : Promise.resolve([]),
    [branchId],
  )
  return useFetch<BranchInventoryItem[]>(request)
}
