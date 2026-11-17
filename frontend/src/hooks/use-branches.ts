import { useCallback, useMemo, useState } from 'react'
import { useFetch } from './useFetch'
import { branchesService, getBranchRequestError } from '../lib/api/branches.service'
import type { Branch, CreateBranchInput } from '../types/branch'

export function useBranches() {
  const request = useCallback(
    (signal: AbortSignal) => branchesService.getBranches(signal),
    [],
  )
  const { data, isLoading, error, refetch } = useFetch<Branch[]>(request)
  const [branchOverrides, setBranchOverrides] = useState<Branch[]>([])
  const [deletedBranchIds, setDeletedBranchIds] = useState<string[]>([])
  const [mutatingBranchId, setMutatingBranchId] = useState<string | null>(null)
  const [mutationError, setMutationError] = useState<string | null>(null)

  const branches = useMemo(() => {
    const byId = new Map((data ?? []).map((branch) => [branch._id, branch]))
    branchOverrides.forEach((branch) => byId.set(branch._id, branch))
    return Array.from(byId.values()).filter((branch) => !deletedBranchIds.includes(branch._id))
  }, [branchOverrides, data, deletedBranchIds])

  const createBranch = useCallback(async (input: CreateBranchInput) => {
    setMutatingBranchId('new')
    setMutationError(null)
    try {
      const branch = await branchesService.createBranch(input)
      setBranchOverrides((current) => [...current.filter((item) => item._id !== branch._id), branch])
      return branch
    } catch (requestError) {
      const message = getBranchRequestError(requestError, 'Unable to create branch.')
      setMutationError(message)
      return null
    } finally {
      setMutatingBranchId(null)
    }
  }, [])

  const updateBranch = useCallback(async (id: string, input: Partial<CreateBranchInput> & { isActive?: boolean }) => {
    setMutatingBranchId(id)
    setMutationError(null)
    try {
      const branch = await branchesService.updateBranch(id, input)
      setBranchOverrides((current) => [...current.filter((item) => item._id !== branch._id), branch])
      return branch
    } catch (requestError) {
      setMutationError(getBranchRequestError(requestError, 'Unable to update branch.'))
      return null
    } finally {
      setMutatingBranchId(null)
    }
  }, [])

  const deleteBranch = useCallback(async (id: string) => {
    setMutatingBranchId(id)
    setMutationError(null)
    try {
      await branchesService.deleteBranch(id)
      setDeletedBranchIds((current) => [...new Set([...current, id])])
      setBranchOverrides((current) => current.filter((branch) => branch._id !== id))
      return true
    } catch (requestError) {
      setMutationError(getBranchRequestError(requestError, 'Unable to delete branch.'))
      return false
    } finally {
      setMutatingBranchId(null)
    }
  }, [])

  return {
    branches,
    isLoading,
    error,
    refetch,
    createBranch,
    updateBranch,
    deleteBranch,
    mutatingBranchId,
    mutationError,
  }
}
