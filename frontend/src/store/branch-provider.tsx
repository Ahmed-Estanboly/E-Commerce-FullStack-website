import { useCallback, useEffect, useMemo, useState, type PropsWithChildren } from 'react'
import { branchesService } from '../lib/api/branches.service'
import type { Branch } from '../types/branch'
import { BranchContext, SELECTED_BRANCH_KEY } from './branch-context'

function readSelectedBranchId(): string | null {
  return window.localStorage.getItem(SELECTED_BRANCH_KEY)
}

export function BranchProvider({ children }: PropsWithChildren) {
  const [branches, setBranches] = useState<Branch[]>([])
  const [storedBranchId, setStoredBranchId] = useState<string | null>(readSelectedBranchId)
  const [isLoadingBranches, setIsLoadingBranches] = useState(true)
  const [branchError, setBranchError] = useState<string | null>(null)

  useEffect(() => {
    const controller = new AbortController()
    branchesService.getBranches(controller.signal)
      .then(setBranches)
      .catch((error: unknown) => {
        if (!controller.signal.aborted) {
          setBranchError(error instanceof Error ? error.message : 'Unable to load store branches.')
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setIsLoadingBranches(false)
      })
    return () => controller.abort()
  }, [])

  useEffect(() => {
    if (isLoadingBranches) return
    const activeBranches = branches.filter((branch) => branch.isActive)
    const activeSelection = activeBranches.some((branch) => branch._id === storedBranchId)
      ? storedBranchId
      : activeBranches[0]?._id ?? null
    if (activeSelection) {
      window.localStorage.setItem(SELECTED_BRANCH_KEY, activeSelection)
    } else {
      window.localStorage.removeItem(SELECTED_BRANCH_KEY)
    }
  }, [branches, isLoadingBranches, storedBranchId])

  const selectBranch = useCallback((branchId: string) => {
    const branch = branches.find((candidate) => candidate._id === branchId && candidate.isActive)
    if (!branch) {
      throw new Error('Select an active branch.')
    }
    setStoredBranchId(branch._id)
    window.localStorage.setItem(SELECTED_BRANCH_KEY, branch._id)
  }, [branches])

  const selectedBranch = useMemo(() => {
    const activeBranches = branches.filter((branch) => branch.isActive)
    return activeBranches.find((branch) => branch._id === storedBranchId) ?? activeBranches[0] ?? null
  }, [branches, storedBranchId])
  const selectedBranchId = selectedBranch?._id ?? null

  const value = useMemo(() => ({
    branches,
    selectedBranchId,
    selectedBranch,
    isLoadingBranches,
    branchError,
    selectBranch,
  }), [branches, selectedBranchId, selectedBranch, isLoadingBranches, branchError, selectBranch])

  return <BranchContext.Provider value={value}>{children}</BranchContext.Provider>
}
