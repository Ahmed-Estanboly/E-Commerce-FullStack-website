import { useState } from 'react'
import { branchesService, getBranchRequestError } from '../../lib/api/branches.service'
import type { BranchInventoryItem } from '../../types/branch'

interface BranchAssignmentPanelProps {
  branchId: string
  products: BranchInventoryItem[]
  onAssigned: () => Promise<void>
}

export function BranchAssignmentPanel({
  branchId,
  products,
  onAssigned,
}: BranchAssignmentPanelProps) {
  const [query, setQuery] = useState('')
  const [quantities, setQuantities] = useState<Record<number, string>>({})
  const [savingProductId, setSavingProductId] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const availableProducts = products.filter((product) =>
    !product.isAssigned
      && product.productName.toLowerCase().includes(query.trim().toLowerCase()),
  )

  const assignProduct = async (product: BranchInventoryItem) => {
    const quantity = Number(quantities[product.productId] ?? '0')
    if (!Number.isInteger(quantity) || quantity < 0) {
      setError('Opening stock must be a non-negative whole number.')
      return
    }

    setSavingProductId(product.productId)
    setError(null)
    setSuccess(null)
    try {
      await branchesService.addBranchProduct(branchId, product.productId, quantity)
      await onAssigned()
      setSuccess(`${product.productName} was assigned to this branch.`)
      setQuantities((current) => {
        const next = { ...current }
        delete next[product.productId]
        return next
      })
    } catch (requestError) {
      setError(getBranchRequestError(requestError, 'Unable to assign this product.'))
    } finally {
      setSavingProductId(null)
    }
  }

  return (
    <section className="admin-panel mt-5 p-4" aria-label="Assign existing products">
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="font-display text-xl text-ink">Assign catalogue products</h2>
          <p className="mt-1 text-xs text-muted">Set an independent opening quantity for this branch.</p>
        </div>
        <input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search unassigned products"
          aria-label="Search unassigned products"
          className="h-10 border border-line bg-canvas px-3 text-sm text-ink"
        />
      </div>
      {error ? <div className="admin-api-error mb-3" role="alert">{error}</div> : null}
      {success ? <div className="admin-api-success mb-3" role="status">{success}</div> : null}
      {availableProducts.length ? (
        <div className="divide-y divide-line">
          {availableProducts.map((product) => (
            <div key={product.productId} className="flex flex-wrap items-center justify-between gap-3 py-3">
              <div className="min-w-0">
                <p className="text-sm text-ink">{product.productName}</p>
                <p className="mt-1 text-xs text-muted">
                  {new Intl.NumberFormat('en-IE', { style: 'currency', currency: 'EUR' }).format(product.price)}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <label className="flex items-center gap-2 text-xs text-muted">
                  Opening stock
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={quantities[product.productId] ?? '0'}
                    onChange={(event) => setQuantities((current) => ({
                      ...current,
                      [product.productId]: event.target.value,
                    }))}
                    className="h-9 w-20 border border-line bg-canvas px-2 text-sm text-ink"
                    aria-label={`Opening stock for ${product.productName}`}
                  />
                </label>
                <button
                  type="button"
                  className="admin-accent-button"
                  onClick={() => void assignProduct(product)}
                  disabled={savingProductId !== null}
                >
                  {savingProductId === product.productId ? 'Adding...' : 'Assign'}
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : <p className="py-4 text-sm text-muted">No unassigned products match this search.</p>}
    </section>
  )
}
