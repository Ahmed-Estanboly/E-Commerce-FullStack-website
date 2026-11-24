import { useCallback, useState, type ChangeEvent, type FormEvent } from 'react'
import axios from 'axios'
import { Link } from 'react-router-dom'
import { AdminLayout } from '../components/layout/admin-layout'
import { useFetch } from '../hooks/useFetch'
import { useBranches } from '../hooks/use-branches'
import { branchesService, getBranchRequestError } from '../lib/api/branches.service'
import { productsService } from '../lib/api/products.service'
import { uploadService } from '../lib/api/upload.service'
import { downloadCsv } from '../lib/api/client'
import { Skeleton } from '../components/ui/feedback'
import type { Product, ProductCategory } from '../types/product'

interface ProductForm {
  title: string
  description: string
  price: string
  categoryId: string
  images: string
  stock: string
  branchId: string
  branchQuantity: string
}

const EMPTY_FORM: ProductForm = {
  title: '',
  description: '',
  price: '',
  categoryId: '',
  images: '',
  stock: '1',
  branchId: '',
  branchQuantity: '0',
}

const currency = new Intl.NumberFormat('en-IE', { style: 'currency', currency: 'EUR' })

function getErrorMessage(error: unknown, fallback: string) {
  if (!axios.isAxiosError(error)) return fallback
  const message: unknown = error.response?.data?.message
  if (typeof message === 'string') return message
  if (Array.isArray(message)) return message.join(', ')
  return error.message || fallback
}

export default function AdminProductsPage() {
  const productsRequest = useCallback((signal: AbortSignal) => productsService.getProducts(undefined, signal), [])
  const categoriesRequest = useCallback((signal: AbortSignal) => productsService.getCategories(signal), [])
  const productsResult = useFetch<Product[]>(productsRequest)
  const categoriesResult = useFetch<ProductCategory[]>(categoriesRequest)
  const { branches, error: branchesError } = useBranches()
  const [form, setForm] = useState(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)

  const handleImageUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    setUploading(true)
    setError(null)
    try {
      const url = await uploadService.uploadImage(file)
      setForm((current) => ({
        ...current,
        images: current.images.trim() ? `${current.images.trim()}\n${url}` : url,
      }))
    } catch (err) {
      setError(getErrorMessage(err, 'Image upload failed.'))
    } finally {
      setUploading(false)
    }
  }
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (saving) return
    const imageUrls = form.images.split('\n').map((url) => url.trim()).filter(Boolean)
    if (!imageUrls.length) {
      setError('Add at least one product image URL.')
      return
    }

    setSaving(true)
    setError(null)
    setNotice(null)
    try {
      const product = await productsService.createProduct({
        title: form.title.trim(),
        description: form.description.trim(),
        price: Number(form.price),
        categoryId: Number(form.categoryId),
        images: imageUrls,
        stock: Number(form.stock),
      })

      if (form.branchId) {
        try {
          await branchesService.addBranchProduct(
            form.branchId,
            product.id,
            Number(form.branchQuantity),
          )
        } catch (assignmentError) {
          setNotice(`Product created, but branch stock could not be assigned: ${getBranchRequestError(assignmentError, 'Please assign it from the branch inventory page.')}`)
          setForm(EMPTY_FORM)
          await productsResult.refetch()
          return
        }
      }

      setNotice(form.branchId ? 'Product created and assigned to the selected branch.' : 'Product added to the shared catalogue.')
      setForm(EMPTY_FORM)
      await productsResult.refetch()
    } catch (requestError) {
      setError(getErrorMessage(requestError, 'Unable to create the product.'))
    } finally {
      setSaving(false)
    }
  }

  const products = productsResult.data ?? []
  const categories = categoriesResult.data ?? []

  return (
    <AdminLayout activePage="products" searchPlaceholder="Search products">
      <div className="admin-content">
        <div className="admin-page-intro">
          <div>
            <p className="eyebrow">Store operations · Product catalogue</p>
            <h1>Products,<br /><em>from one place.</em></h1>
            <p>Create shared catalogue products, then optionally assign an opening stock quantity to a branch.</p>
          </div>
          <button type="button" onClick={() => void downloadCsv('/products/export', 'products.csv').catch(() => undefined)} className="admin-outline-button">
            Export CSV
          </button>
        </div>

        {(error || notice || branchesError || categoriesResult.error || productsResult.error) ? (
          <div className={error || branchesError || categoriesResult.error || productsResult.error ? 'admin-api-error mt-4' : 'admin-panel mt-4 p-4 text-sm text-success'} role={error || branchesError || categoriesResult.error || productsResult.error ? 'alert' : 'status'}>
            {error ?? notice ?? branchesError ?? categoriesResult.error ?? productsResult.error}
          </div>
        ) : null}

        <section className="admin-panel mt-5 p-5" aria-labelledby="create-product-heading">
          <div className="admin-panel-heading">
            <span id="create-product-heading">Add a catalogue product</span>
          </div>
          {categoriesResult.isLoading ? <div className="space-y-2 p-4" role="status" aria-label="Loading categories">{Array.from({ length: 4 }).map((_, index) => <Skeleton key={index} className="h-8 w-full" />)}</div> : !categories.length ? (
            <p className="p-4 text-sm text-muted">Create a category before adding products.</p>
          ) : (
            <form onSubmit={(event) => void handleSubmit(event)} className="grid gap-4 p-4 md:grid-cols-2">
              <label className="block">
                <span className="eyebrow">Product name</span>
                <input required maxLength={160} value={form.title} onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))} className="mt-2 h-11 w-full border border-line bg-canvas px-3 text-sm text-ink" />
              </label>
              <label className="block">
                <span className="eyebrow">Category</span>
                <select required value={form.categoryId} onChange={(event) => setForm((current) => ({ ...current, categoryId: event.target.value }))} className="mt-2 h-11 w-full border border-line bg-canvas px-3 text-sm text-ink">
                  <option value="">Select a category</option>
                  {categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
                </select>
              </label>
              <label className="block md:col-span-2">
                <span className="eyebrow">Description</span>
                <textarea required maxLength={3000} rows={3} value={form.description} onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))} className="mt-2 w-full border border-line bg-canvas px-3 py-2 text-sm text-ink" />
              </label>
              <label className="block">
                <span className="eyebrow">Price (EUR)</span>
                <input required type="number" min="0" step="0.01" value={form.price} onChange={(event) => setForm((current) => ({ ...current, price: event.target.value }))} className="mt-2 h-11 w-full border border-line bg-canvas px-3 text-sm text-ink" />
              </label>
              <label className="block">
                <span className="eyebrow">Catalogue stock</span>
                <input required type="number" min="1" step="1" value={form.stock} onChange={(event) => setForm((current) => ({ ...current, stock: event.target.value }))} className="mt-2 h-11 w-full border border-line bg-canvas px-3 text-sm text-ink" />
              </label>
              <label className="block md:col-span-2">
                <span className="eyebrow">Image URLs · one per line</span>
                <textarea required rows={2} value={form.images} onChange={(event) => setForm((current) => ({ ...current, images: event.target.value }))} className="mt-2 w-full border border-line bg-canvas px-3 py-2 text-sm text-ink" placeholder="https://example.com/product-image.jpg" />
                <span className="mt-2 flex items-center gap-3">
                  <input type="file" accept="image/*" onChange={(event) => void handleImageUpload(event)} className="hidden" id="product-image-upload" disabled={uploading} />
                  <label htmlFor="product-image-upload" className={`inline-flex h-9 cursor-pointer items-center border border-line px-3 font-mono text-[9px] uppercase tracking-[0.1em] text-ink-soft transition-colors hover:border-ink hover:text-ink ${uploading ? 'pointer-events-none opacity-50' : ''}`}>
                    {uploading ? 'Uploading…' : 'Upload image'}
                  </label>
                  <span className="text-[10px] text-muted">Saved to /uploads and appended above (max 5 MB).</span>
                </span>
              </label>
              <div className="border-t border-line pt-4 md:col-span-2">
                <p className="eyebrow">Optional branch opening stock</p>
                <p className="mt-1 text-xs text-muted">The product remains in the shared catalogue; branch quantities are managed separately.</p>
              </div>
              <label className="block">
                <span className="eyebrow">Assign to branch</span>
                <select value={form.branchId} onChange={(event) => setForm((current) => ({ ...current, branchId: event.target.value }))} className="mt-2 h-11 w-full border border-line bg-canvas px-3 text-sm text-ink">
                  <option value="">Do not assign yet</option>
                  {branches.filter((branch) => branch.isActive).map((branch) => <option key={branch._id} value={branch._id}>{branch.name}</option>)}
                </select>
              </label>
              <label className="block">
                <span className="eyebrow">Branch opening quantity</span>
                <input type="number" min="0" step="1" disabled={!form.branchId} value={form.branchQuantity} onChange={(event) => setForm((current) => ({ ...current, branchQuantity: event.target.value }))} className="mt-2 h-11 w-full border border-line bg-canvas px-3 text-sm text-ink disabled:opacity-50" />
              </label>
              <div className="flex justify-end border-t border-line pt-4 md:col-span-2">
                <button type="submit" className="admin-accent-button" disabled={saving || !categories.length}>
                  {saving ? 'Saving product...' : 'Add product'}
                </button>
              </div>
            </form>
          )}
        </section>

        <section className="admin-panel admin-orders-panel mt-5" aria-label="Product catalogue">
          <div className="admin-panel-heading"><span>Shared product catalogue</span><span>{products.length} PRODUCTS</span></div>
          {productsResult.isLoading && !products.length ? (
            <div className="p-5" role="status" aria-label="Loading products">
              {Array.from({ length: 6 }).map((_, index) => <Skeleton key={index} className="mb-3 h-12 w-full" />)}
            </div>
          ) : (
            <div className="admin-table">
              <div className="admin-table-head"><span>ID</span><span>Product</span><span>Category</span><span>Catalogue stock</span><span>Price</span><span /></div>
              {products.map((product) => (
                <div className="admin-table-row" key={product.id}>
                  <span>#{product.id}</span>
                  <span className="truncate">{product.title}</span>
                  <span>{product.category?.name ?? '—'}</span>
                  <span>{product.stock}</span>
                  <span>{currency.format(product.price)}</span>
                  <Link className="admin-row-action" to={`/products/${product.id}`}>View</Link>
                </div>
              ))}
              {!products.length ? <p className="p-5 text-sm text-muted">No products in the catalogue yet.</p> : null}
            </div>
          )}
        </section>
      </div>
    </AdminLayout>
  )
}
