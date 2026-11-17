import { useCallback, useState, type FormEvent } from 'react'
import { Link, useParams } from 'react-router-dom'
import { AdminLayout } from '../components/layout/admin-layout'
import { useFetch } from '../hooks/useFetch'
import { branchesService, getBranchRequestError } from '../lib/api/branches.service'
import type { BranchInventoryItem } from '../types/branch'

export default function BranchInventoryPage() {
  const { branchId = '' } = useParams<{ branchId: string }>()
  const request = useCallback(
    (signal: AbortSignal) => branchesService.getBranchInventory(branchId, signal),
    [branchId],
  )
  const { data, isLoading, error, refetch } = useFetch<BranchInventoryItem[]>(request)
  const [quantities, setQuantities] = useState<Record<number, string>>({})
  const [savedQuantities, setSavedQuantities] = useState<Record<number, number>>({})
  const [savingProductId, setSavingProductId] = useState<number | null>(null)
  const [saveError, setSaveError] = useState<string | null>(null)

  const saveQuantity = async (event: FormEvent<HTMLFormElement>, product: BranchInventoryItem) => {
    event.preventDefault()
    const rawQuantity = quantities[product.productId] ?? String(product.quantity)
    const quantity = Number(rawQuantity)
    if (!Number.isInteger(quantity) || quantity < 0) {
      setSaveError('Stock quantity must be a non-negative whole number.')
      return
    }

    setSavingProductId(product.productId)
    setSaveError(null)
    try {
      await branchesService.setBranchProductQuantity(branchId, product.productId, quantity)
      setSavedQuantities((current) => ({ ...current, [product.productId]: quantity }))
      setQuantities((current) => {
        const next = { ...current }
        delete next[product.productId]
        return next
      })
    } catch (requestError) {
      setSaveError(getBranchRequestError(requestError, 'Unable to save this stock quantity.'))
    } finally {
      setSavingProductId(null)
    }
  }

  return (
    <AdminLayout activePage="branches" searchPlaceholder="Search products">
      <div className="admin-content">
        <div className="admin-page-intro">
          <div>
            <p className="eyebrow">Store operations · Branch inventory</p>
            <h1>Stock,<br /><em>by location.</em></h1>
            <p>Set a separate stock quantity for every product at this branch. Changes here do not affect other branches.</p>
          </div>
          <Link to="/admin/branches" className="admin-outline-button">Back to branches</Link>
        </div>

        {saveError ? <div className="admin-api-error mt-4" role="alert">{saveError}</div> : null}
        {isLoading && !data ? (
          <div className="admin-panel mt-5 p-5 text-sm text-muted" role="status">Loading branch inventory...</div>
        ) : error && !data ? (
          <div className="admin-api-error mt-5" role="alert">
            <span>Could not load this branch’s inventory: {error}</span>
            <button type="button" onClick={refetch}>Retry</button>
          </div>
        ) : data?.length ? (
          <section className="admin-panel admin-orders-panel mt-5" aria-label="Branch product inventory">
            <div className="admin-table">
              <div className="admin-table-head branch-inventory-table-head">
                <span>Product</span><span>Price</span><span>Branch stock</span><span>Update</span>
              </div>
              {data.map((product) => {
                const quantity = savedQuantities[product.productId] ?? product.quantity
                const isDirty = quantities[product.productId] !== undefined
                  && Number(quantities[product.productId]) !== quantity
                return (
                  <form
                    className="admin-table-row branch-inventory-table-row"
                    key={product.productId}
                    onSubmit={(event) => void saveQuantity(event, product)}
                  >
                    <Link
                      to={`/products/${product.productId}`}
                      className="min-w-0 truncate text-ink underline-offset-2 hover:underline"
                      title={`View ${product.productName}`}
                    >
                      {product.productName}
                    </Link>
                    <span>{new Intl.NumberFormat('en-IE', { style: 'currency', currency: 'EUR' }).format(product.price)}</span>
                    <label className="flex items-center gap-2">
                      <span className="sr-only">Stock quantity for {product.productName}</span>
                      <input
                        type="number"
                        min="0"
                        step="1"
                        required
                        value={quantities[product.productId] ?? String(quantity)}
                        onChange={(event) => setQuantities((current) => ({
                          ...current,
                          [product.productId]: event.target.value,
                        }))}
                        className="h-8 w-24 border border-line bg-canvas px-2 text-sm text-ink"
                      />
                    </label>
                    <button
                      type="submit"
                      className="admin-row-action"
                      disabled={savingProductId !== null || !isDirty}
                    >
                      {savingProductId === product.productId ? 'Saving...' : 'Save'}
                    </button>
                  </form>
                )
              })}
            </div>
          </section>
        ) : (
          <div className="admin-panel mt-5 p-6 text-sm text-muted">No products are available in the catalogue yet.</div>
        )}

        <footer className="admin-footer mt-5">
          <span>BRANCH INVENTORY · INDEPENDENT STOCK LEVELS</span>
          <span>{data?.length ?? 0} PRODUCTS</span>
        </footer>
      </div>
    </AdminLayout>
  )
}
