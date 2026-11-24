import { useCallback, useState, type FormEvent } from 'react'
import { AdminLayout } from '../components/layout/admin-layout'
import { useFetch } from '../hooks/useFetch'
import { couponsService, type Coupon } from '../lib/api/coupons.service'
import { Skeleton } from '../components/ui/feedback'

const currency = new Intl.NumberFormat('en-IE', { style: 'currency', currency: 'EUR', maximumFractionDigits: 2 })

const EMPTY_FORM = { code: '', kind: 'percent' as 'percent' | 'fixed', value: '', minSubtotal: '', expiresAt: '', usageLimit: '' }

export default function AdminCoupons() {
  const couponsRequest = useCallback((signal: AbortSignal) => couponsService.list(signal), [])
  const { data, isLoading, error, refetch } = useFetch<Coupon[]>(couponsRequest)
  const [form, setForm] = useState(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [actionError, setActionError] = useState<string | null>(null)
  const [busyId, setBusyId] = useState<string | null>(null)

  const handleCreate = async (event: FormEvent) => {
    event.preventDefault()
    setSaving(true)
    setActionError(null)
    try {
      await couponsService.create({
        code: form.code.trim(),
        kind: form.kind,
        value: Number(form.value),
        minSubtotal: form.minSubtotal ? Number(form.minSubtotal) : undefined,
        expiresAt: form.expiresAt || undefined,
        usageLimit: form.usageLimit ? Number(form.usageLimit) : undefined,
      })
      setForm(EMPTY_FORM)
      refetch()
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Could not create coupon')
    } finally {
      setSaving(false)
    }
  }

  const toggleActive = async (coupon: Coupon) => {
    setBusyId(coupon._id)
    setActionError(null)
    try {
      await couponsService.update(coupon._id, { active: !coupon.active })
      refetch()
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Could not update coupon')
    } finally {
      setBusyId(null)
    }
  }

  const remove = async (coupon: Coupon) => {
    if (!window.confirm(`Delete coupon ${coupon.code}?`)) return
    setBusyId(coupon._id)
    setActionError(null)
    try {
      await couponsService.remove(coupon._id)
      refetch()
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Could not delete coupon')
    } finally {
      setBusyId(null)
    }
  }

  const coupons = data ?? []

  return (
    <AdminLayout activePage="coupons" searchPlaceholder="Search coupons">
      <div className="admin-content">
        <div className="admin-page-intro">
          <div>
            <p className="eyebrow">Store operations · Coupons</p>
            <h1>Discounts,<br /><em>on tap.</em></h1>
            <p>Create and manage promo codes customers can apply at checkout.</p>
          </div>
        </div>

        <form onSubmit={(e) => void handleCreate(e)} className="admin-panel mb-4 grid gap-3 p-5 sm:grid-cols-3 lg:grid-cols-6">
          <input required placeholder="CODE" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })} className="h-10 border border-line bg-canvas/40 px-3 font-mono text-[11px] uppercase tracking-[0.08em] text-ink outline-none focus:border-line-strong" />
          <select value={form.kind} onChange={(e) => setForm({ ...form, kind: e.target.value as 'percent' | 'fixed' })} className="h-10 border border-line bg-canvas/40 px-3 font-mono text-[10px] uppercase text-ink outline-none focus:border-line-strong">
            <option value="percent">Percent %</option>
            <option value="fixed">Fixed €</option>
          </select>
          <input required type="number" min="0.01" step="0.01" placeholder={form.kind === 'percent' ? 'Value %' : 'Value €'} value={form.value} onChange={(e) => setForm({ ...form, value: e.target.value })} className="h-10 border border-line bg-canvas/40 px-3 text-xs text-ink outline-none focus:border-line-strong" />
          <input type="number" min="0" step="0.01" placeholder="Min subtotal €" value={form.minSubtotal} onChange={(e) => setForm({ ...form, minSubtotal: e.target.value })} className="h-10 border border-line bg-canvas/40 px-3 text-xs text-ink outline-none focus:border-line-strong" />
          <input type="date" title="Expiry date" value={form.expiresAt} onChange={(e) => setForm({ ...form, expiresAt: e.target.value })} className="h-10 border border-line bg-canvas/40 px-3 text-xs text-ink outline-none focus:border-line-strong" />
          <input type="number" min="1" step="1" placeholder="Usage limit" value={form.usageLimit} onChange={(e) => setForm({ ...form, usageLimit: e.target.value })} className="h-10 border border-line bg-canvas/40 px-3 text-xs text-ink outline-none focus:border-line-strong" />
          <button type="submit" disabled={saving} className="admin-accent-button h-10 disabled:opacity-50 sm:col-span-3 lg:col-span-6">
            {saving ? 'Creating…' : 'Create coupon'}
          </button>
        </form>

        {actionError ? <div className="admin-api-error mb-4" role="alert"><span>{actionError}</span></div> : null}
        {error ? <div className="admin-api-error mb-4" role="alert"><span>Could not load coupons: {error}</span><button type="button" onClick={refetch}>Retry</button></div> : null}

        <section className="admin-panel admin-orders-panel">
          <div className="admin-panel-heading"><span>All coupons</span><span>{coupons.length} codes</span></div>
          {isLoading && !data ? (
            <div className="p-5" role="status" aria-label="Loading coupons">
              {Array.from({ length: 4 }).map((_, index) => <Skeleton key={index} className="mb-3 h-10 w-full" />)}
            </div>
          ) : (
            <div className="admin-table">
              <div className="admin-table-head"><span>Code</span><span>Discount</span><span>Min spend</span><span>Expires</span><span>Usage</span><span>Status</span><span>Actions</span></div>
              {coupons.map((coupon) => (
                <div className="admin-table-row" key={coupon._id}>
                  <span className="font-mono text-[11px] font-medium uppercase">{coupon.code}</span>
                  <span>{coupon.kind === 'percent' ? `${coupon.value}%` : currency.format(coupon.value)}</span>
                  <span>{coupon.minSubtotal ? currency.format(coupon.minSubtotal) : '—'}</span>
                  <span>{coupon.expiresAt ? new Date(coupon.expiresAt).toLocaleDateString() : 'Never'}</span>
                  <span>{coupon.usageLimit ? `${coupon.usedCount}/${coupon.usageLimit}` : `${coupon.usedCount} used`}</span>
                  <span className={coupon.active ? 'text-success' : 'text-muted'}>{coupon.active ? 'Active' : 'Disabled'}</span>
                  <span className="flex gap-2">
                    <button type="button" disabled={busyId === coupon._id} onClick={() => void toggleActive(coupon)} className="admin-row-action disabled:opacity-40">
                      {coupon.active ? 'Disable' : 'Enable'}
                    </button>
                    <button type="button" disabled={busyId === coupon._id} onClick={() => void remove(coupon)} className="admin-row-action text-danger disabled:opacity-40">
                      Delete
                    </button>
                  </span>
                </div>
              ))}
              {!coupons.length ? <div className="p-5 text-xs text-muted">No coupons yet — create your first code above.</div> : null}
            </div>
          )}
        </section>
        <footer className="admin-footer mt-5"><span>NOVA · COUPONS</span><span>{coupons.length} CODES</span></footer>
      </div>
    </AdminLayout>
  )
}
