import { useCallback, useState, type ChangeEvent, type FormEvent } from 'react'
import { Link, useParams} from 'react-router-dom'
import { AdminLayout } from '../components/layout/admin-layout'
import { BranchLayout } from '../components/layout/branch-layout'
import { BranchAssignmentPanel } from '../components/branches/BranchAssignmentPanel'
import { useFetch } from '../hooks/useFetch'
import { branchesService, getBranchRequestError } from '../lib/api/branches.service'
import { downloadCsv } from '../lib/api/client'
import { uploadService } from '../lib/api/upload.service'
import { Skeleton } from '../components/ui/feedback'
import { productsService } from '../lib/api/products.service'
import { useBranches } from '../hooks/use-branches'
import { getStoredSession } from '../lib/auth'
import type { BranchInventoryItem } from '../types/branch'
import type { ProductCategory } from '../types/product'

export default function BranchInventoryPage({ branchOwnerView = false }: { branchOwnerView?: boolean }) {
  const { branchId: routeBranchId, branchName } = useParams<{ branchId?: string; branchName?: string }>()
  const branchId = routeBranchId ?? branchName ?? ''
  const { branches } = useBranches()
  const branch = branches.find((item) => item._id === branchId)
  const ownerName = getStoredSession()?.user.name ?? branch?.name ?? 'Branch manager'
  const request = useCallback(
    (signal: AbortSignal) => branchesService.getBranchInventory(branchId, signal),
    [branchId],
  )
  const { data, isLoading, error, refetch } = useFetch<BranchInventoryItem[]>(request)
  const categoriesRequest = useCallback(
    (signal: AbortSignal) => productsService.getCategories(signal),
    [],
  )
  const categoriesResult = useFetch<ProductCategory[]>(categoriesRequest)
  const [quantities, setQuantities] = useState<Record<number, string>>({})
  const [savedQuantities, setSavedQuantities] = useState<Record<number, number>>({})
  const [savingProductId, setSavingProductId] = useState<number | null>(null)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [catalogOpen, setCatalogOpen] = useState(false)
  const [assignmentOpen, setAssignmentOpen] = useState(false)
  const [newProduct, setNewProduct] = useState({
    title: '',
    description: '',
    price: '',
    categoryId: '',
    imageUrl: '',
    branchQuantity: '1',
  })
  const [uploadingImage, setUploadingImage] = useState(false)

  const handleImageUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    setUploadingImage(true)
    setSaveError(null)
    try {
      const url = await uploadService.uploadImage(file)
      setNewProduct((current) => ({ ...current, imageUrl: url }))
    } catch (requestError) {
      setSaveError(getBranchRequestError(requestError, 'Image upload failed.'))
    } finally {
      setUploadingImage(false)
    }
  }

  const assignedProducts = (data ?? []).filter((product) => product.isAssigned)

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

  const createProduct = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const quantity = Number(newProduct.branchQuantity)
    if (!Number.isInteger(quantity) || quantity < 0) {
      setSaveError('Stock quantity must be a non-negative whole number.')
      return
    }

    setSaveError(null)
    setSavingProductId(-1)
    try {
      await branchesService.createBranchProduct(branchId, {
        title: newProduct.title.trim(),
        description: newProduct.description.trim(),
        price: Number(newProduct.price),
        categoryId: Number(newProduct.categoryId),
        images: [newProduct.imageUrl.trim()],
        branchQuantity: quantity,
      })
      setNewProduct({
        title: '',
        description: '',
        price: '',
        categoryId: '',
        imageUrl: '',
        branchQuantity: '1',
      })
      setCatalogOpen(false)
      await refetch()
    } catch (requestError) {
      setSaveError(getBranchRequestError(requestError, 'Unable to create this product for the branch.'))
    } finally {
      setSavingProductId(null)
    }
  }

  const removeProduct = async (product: BranchInventoryItem) => {
    if (!window.confirm(`Remove "${product.productName}" from this branch inventory?`)) return
    setSavingProductId(product.productId)
    setSaveError(null)
    try {
      await branchesService.removeBranchProduct(branchId, product.productId)
      await refetch()
    } catch (requestError) {
      setSaveError(getBranchRequestError(requestError, 'Unable to remove this product from the branch.'))
    } finally {
      setSavingProductId(null)
    }
  }

  const content = (
      <div className="admin-content">
        <div className="admin-page-intro">
          <div>
            <p className="eyebrow">Store operations · Branch inventory</p>
            <h1>Stock,<br /><em>by location.</em></h1>
            <p>Set a separate stock quantity for every product at this branch. Changes here do not affect other branches.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button type="button" className="admin-accent-button" onClick={() => setCatalogOpen((open) => !open)}>
              {catalogOpen ? 'Close product catalogue' : 'Add products'}
            </button>
            <button
              type="button"
              className="admin-outline-button"
              onClick={() => setAssignmentOpen((open) => !open)}
            >
              {assignmentOpen ? 'Close assignments' : 'Assign existing products'}
            </button>
            <button
              type="button"
              className="admin-outline-button"
              onClick={() => void downloadCsv(`/branches/${branchId}/inventory/export`, `inventory-${branchId}.csv`).catch(() => undefined)}
            >
              Export CSV
            </button>
            <Link to={branchOwnerView ? `/${branchId}/dashboard` : '/admin/branches'} className="admin-outline-button">
              {branchOwnerView ? 'Back to dashboard' : 'Back to branches'}
            </Link>
          </div>
        </div>

        {saveError ? <div className="admin-api-error mt-4" role="alert">{saveError}</div> : null}
        {assignmentOpen ? (
          <BranchAssignmentPanel
            branchId={branchId}
            products={data ?? []}
            onAssigned={async () => { await refetch() }}
          />
        ) : null}
        {catalogOpen ? (
          <section className="admin-panel mt-5 p-4" aria-label="Create a product for this branch">
            <div className="mb-4">
              <div>
                <h2 className="font-display text-xl text-ink">Add a new product</h2>
                <p className="mt-1 text-xs text-muted">Enter the product details and its opening stock for {branch?.name ?? 'this branch'}.</p>
              </div>
            </div>
            {categoriesResult.error ? (
              <div className="admin-api-error mb-4" role="alert">Could not load product categories: {categoriesResult.error}</div>
            ) : null}
            {!categoriesResult.isLoading && !categoriesResult.error && !categoriesResult.data?.length ? (
              <div className="admin-api-error mb-4" role="alert">Create a product category before adding branch products.</div>
            ) : null}
            <form onSubmit={(event) => void createProduct(event)} className="grid gap-4 md:grid-cols-2">
              <label className="block">
                <span className="eyebrow">Product name</span>
                <input required maxLength={160} value={newProduct.title} onChange={(event) => setNewProduct((current) => ({ ...current, title: event.target.value }))} className="mt-2 h-11 w-full border border-line bg-canvas px-3 text-sm text-ink" />
              </label>
              <label className="block">
                <span className="eyebrow">Category</span>
                <select required value={newProduct.categoryId} onChange={(event) => setNewProduct((current) => ({ ...current, categoryId: event.target.value }))} className="mt-2 h-11 w-full border border-line bg-canvas px-3 text-sm text-ink">
                  <option value="">Select a category</option>
                  {(categoriesResult.data ?? []).map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
                </select>
              </label>
              <label className="block md:col-span-2">
                <span className="eyebrow">Description</span>
                <textarea required maxLength={3000} rows={3} value={newProduct.description} onChange={(event) => setNewProduct((current) => ({ ...current, description: event.target.value }))} className="mt-2 w-full border border-line bg-canvas px-3 py-2 text-sm text-ink" />
              </label>
              <label className="block">
                <span className="eyebrow">Price (EUR)</span>
                <input required type="number" min="0" step="0.01" value={newProduct.price} onChange={(event) => setNewProduct((current) => ({ ...current, price: event.target.value }))} className="mt-2 h-11 w-full border border-line bg-canvas px-3 text-sm text-ink" />
              </label>
              <label className="block">
                <span className="eyebrow">Opening branch stock</span>
                <input required type="number" min="0" step="1" value={newProduct.branchQuantity} onChange={(event) => setNewProduct((current) => ({ ...current, branchQuantity: event.target.value }))} className="mt-2 h-11 w-full border border-line bg-canvas px-3 text-sm text-ink" />
              </label>
              <label className="block md:col-span-2">
                <span className="eyebrow">Product image</span>
                <input required type="text" value={newProduct.imageUrl} onChange={(event) => setNewProduct((current) => ({ ...current, imageUrl: event.target.value }))} placeholder="https://example.com/product-image.jpg or /uploads/image.png" className="mt-2 h-11 w-full border border-line bg-canvas px-3 text-sm text-ink" />
                <span className="mt-2 flex items-center gap-3">
                  <input type="file" accept="image/*" onChange={(event) => void handleImageUpload(event)} className="hidden" id="branch-product-image-upload" disabled={uploadingImage} />
                  <label htmlFor="branch-product-image-upload" className={`inline-flex h-9 cursor-pointer items-center border border-line px-3 font-mono text-[9px] uppercase tracking-[0.1em] text-ink-soft transition-colors hover:border-ink hover:text-ink ${uploadingImage ? 'pointer-events-none opacity-50' : ''}`}>
                    {uploadingImage ? 'Uploading…' : 'Upload image'}
                  </label>
                  <span className="text-[10px] text-muted">Or paste an image URL above (max 5 MB).</span>
                </span>
              </label>
              <div className="flex justify-end gap-2 border-t border-line pt-4 md:col-span-2">
                <button type="button" className="admin-outline-button" onClick={() => setCatalogOpen(false)}>Cancel</button>
                <button type="submit" className="admin-accent-button" disabled={savingProductId !== null || categoriesResult.isLoading || !categoriesResult.data?.length}>
                  {savingProductId === -1 ? 'Adding product...' : 'Add product to branch'}
                </button>
              </div>
            </form>
          </section>
        ) : null}
        {isLoading && !data ? (
          <div className="admin-panel admin-orders-panel mt-5" role="status" aria-label="Loading branch inventory">
            <div className="admin-table">
              <div className="admin-table-head branch-inventory-table-head">
                {Array.from({ length: 5 }).map((_, index) => <span key={index}><Skeleton className="h-3 w-20" /></span>)}
              </div>
              {Array.from({ length: 8 }).map((_, index) => (
                <div className="admin-table-row" key={index}>
                  {Array.from({ length: 5 }).map((__, cell) => <Skeleton key={cell} className="h-4 w-full max-w-28" />)}
                </div>
              ))}
            </div>
          </div>
        ) : error && !data ? (
          <div className="admin-api-error mt-5" role="alert">
            <span>Could not load this branch’s inventory: {error}</span>
            <button type="button" onClick={refetch}>Retry</button>
          </div>
        ) : assignedProducts.length ? (
          <section className="admin-panel admin-orders-panel mt-5" aria-label="Branch product inventory">
            <div className="admin-table">
              <div className="admin-table-head branch-inventory-table-head">
                <span>Product</span><span>Price</span><span>Branch stock</span><span>Actions</span>
              </div>
              {assignedProducts.map((product) => {
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
                    <div className="flex items-center gap-2">
                      <button type="submit" className="admin-row-action" disabled={savingProductId !== null || !isDirty}>
                        {savingProductId === product.productId ? 'Saving...' : 'Save'}
                      </button>
                      <button type="button" className="admin-row-action text-danger" onClick={() => void removeProduct(product)} disabled={savingProductId !== null}>
                        Remove
                      </button>
                    </div>
                  </form>
                )
              })}
            </div>
          </section>
        ) : (
          <div className="admin-panel mt-5 p-6 text-sm text-muted">No products are assigned to this branch yet. Use “Add products” to enter a new product.</div>
        )}

        <footer className="admin-footer mt-5">
          <span>BRANCH INVENTORY · INDEPENDENT STOCK LEVELS</span>
          <span>{assignedProducts.length} PRODUCTS</span>
        </footer>
      </div>
  )

  if (branchOwnerView) {
    return (
      <BranchLayout branchId={branchId} branchName={branch?.name ?? 'Branch'} ownerName={ownerName}>
        {content}
      </BranchLayout>
    )
  }
  return <AdminLayout activePage="branches" searchPlaceholder="Search products">{content}</AdminLayout>
}
