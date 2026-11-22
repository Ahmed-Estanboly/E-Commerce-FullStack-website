import { createContext, useContext } from 'react'
import type { Branch } from '../types/branch'

export const SELECTED_BRANCH_KEY = 'nova-selected-branch'

export interface BranchContextValue {
  branches: Branch[]
  selectedBranchId: string | null
  selectedBranch: Branch | null
  isLoadingBranches: boolean
  branchError: string | null
  selectBranch: (branchId: string) => void
}

export const BranchContext = createContext<BranchContextValue | null>(null)

export function useBranchSelection() {
  const context = useContext(BranchContext)
  if (!context) {
    throw new Error('useBranchSelection must be used within a BranchProvider')
  }
  return context
}
