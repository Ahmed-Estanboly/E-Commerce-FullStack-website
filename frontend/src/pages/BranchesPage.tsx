import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { AdminLayout } from '../components/layout/admin-layout'
import { Dialog } from '../components/ui/dialog'
import { Plus } from '../components/ui/icons'
import { useBranches } from '../hooks/use-branches'
import { Skeleton } from '../components/ui/feedback'

interface BranchFormValues {
  name: string;
  address: string;
  city: string;
  description: string;
  phone: string;
  workingHours: string;
  isActive: boolean;
  ownerName: string;
  ownerEmail: string;
  ownerPassword: string;
}

const EMPTY_FORM: BranchFormValues = {
  name: '',
  address: '',
  city: '',
  description: '',
  phone: '',
  workingHours: '09:00 AM - 11:00 PM',
  isActive: true,
  ownerName: '',
  ownerEmail: '',
  ownerPassword: '',
}

export default function BranchesPage() {
  const {
    branches,
    isLoading,
    error,
    refetch,
    createBranch,
    updateBranch,
    deleteBranch,
    mutatingBranchId,
    mutationError,
  } = useBranches()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingBranchId, setEditingBranchId] = useState<string | null>(null)
  const [form, setForm] = useState(EMPTY_FORM)

  const openAddDialog = () => {
    setEditingBranchId(null)
    setForm(EMPTY_FORM)
    setDialogOpen(true)
  }

  const openEditDialog = (branch: (typeof branches)[number]) => {
    setEditingBranchId(branch._id)
    setForm({
      name: branch.name,
      address: branch.address,
      city: branch.city ?? '',
      description: branch.description ?? '',
      phone: branch.phone,
      workingHours: branch.workingHours,
      isActive: branch.isActive,
      ownerName: '',
      ownerEmail: branch.ownerEmail ?? '',
      ownerPassword: '',
    })
    setDialogOpen(true)
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const branchDetails = {
      name: form.name.trim(),
      address: form.address.trim(),
      city: form.city.trim() || undefined,
      description: form.description.trim() || undefined,
      phone: form.phone.trim(),
      workingHours: form.workingHours.trim(),
      isActive: form.isActive,
    }
    const branch = editingBranchId
      ? await updateBranch(editingBranchId, branchDetails)
      : await createBranch({
          ...branchDetails,
          ownerName: form.ownerName.trim() || undefined,
          ownerEmail: form.ownerEmail.trim(),
          ownerPassword: form.ownerPassword,
        })
    if (!branch) return
    setForm(EMPTY_FORM)
    setEditingBranchId(null)
    setDialogOpen(false)
  }

  const handleDelete = async (branchId: string, branchName: string) => {
    if (!window.confirm(`Delete "${branchName}"? This action cannot be undone.`)) return
    await deleteBranch(branchId)
  }

  return (
    <AdminLayout activePage="branches" searchPlaceholder="Search branches">
      <div className="admin-content">
        <div className="admin-page-intro">
          <div>
            <p className="eyebrow">Store operations · Branches</p>
            <h1>Everywhere<br /><em>we meet.</em></h1>
            <p>Manage your store locations and the details customers use to find and contact each branch.</p>
          </div>
          <button
            type="button"
            className="admin-accent-button"
            onClick={openAddDialog}
          >
            <Plus aria-hidden="true" />
            Add New Branch
          </button>
        </div>

        <section className="mt-6" aria-labelledby="branches-heading">
          <div className="mb-4 flex flex-wrap items-baseline justify-between gap-3">
            <h2 id="branches-heading" className="font-display text-2xl text-ink">Store branches</h2>
            <p className="font-mono text-[9px] uppercase tracking-[0.12em] text-muted">
              {branches.length} {branches.length === 1 ? 'location' : 'locations'}
            </p>
          </div>

          {isLoading && branches.length === 0 ? (
            <div className="admin-panel p-5" role="status" aria-label="Loading branches">
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {Array.from({ length: 6 }).map((_, index) => (
                  <div key={index} className="border border-line p-4">
                    <Skeleton className="h-5 w-2/3" />
                    <Skeleton className="mt-2 h-3 w-1/2" />
                    <Skeleton className="mt-3 h-8 w-full" />
                  </div>
                ))}
              </div>
            </div>
          ) : error && branches.length === 0 ? (
            <div className="admin-api-error" role="alert">
              <span>Could not load branches: {error}</span>
              <button type="button" onClick={refetch}>Retry</button>
            </div>
          ) : branches.length === 0 ? (
            <div className="admin-panel p-8 text-center text-sm text-muted">No branches found.</div>
          ) : (
            <>
              {mutationError ? <div className="admin-api-error mb-4" role="alert">{mutationError}</div> : null}
              {error ? (
                <div className="admin-api-error" role="alert">
                  <span>Could not refresh branches: {error}</span>
                  <button type="button" onClick={refetch}>Retry</button>
                </div>
              ) : null}
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {branches.map((branch) => (
                  <article key={branch._id} className="border border-line bg-surface p-5">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="font-mono text-[8px] uppercase tracking-[0.15em] text-muted">NOVA · STORE</p>
                        <h3 className="mt-2 font-display text-xl leading-tight text-ink">{branch.name}</h3>
                      </div>
                      <span className={`shrink-0 border px-2 py-1 font-mono text-[8px] uppercase tracking-[0.08em] ${branch.isActive ? 'border-success/30 bg-success-soft text-success' : 'border-line bg-canvas-alt text-muted'}`}>
                        {branch.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </div>

                    <dl className="mt-5 space-y-3 border-t border-line pt-4 text-xs">
                      <div>
                        <dt className="font-mono text-[8px] uppercase tracking-[0.1em] text-muted">Address</dt>
                        <dd className="mt-1 leading-relaxed text-ink-soft">{branch.address}</dd>
                      </div>
                      {branch.city ? <div>
                        <dt className="font-mono text-[8px] uppercase tracking-[0.1em] text-muted">City</dt>
                        <dd className="mt-1 text-ink-soft">{branch.city}</dd>
                      </div> : null}
                      {branch.description ? <div>
                        <dt className="font-mono text-[8px] uppercase tracking-[0.1em] text-muted">About this branch</dt>
                        <dd className="mt-1 leading-relaxed text-ink-soft">{branch.description}</dd>
                      </div> : null}
                      <div>
                        <dt className="font-mono text-[8px] uppercase tracking-[0.1em] text-muted">Phone</dt>
                        <dd className="mt-1 text-ink-soft">
                          <a href={`tel:${branch.phone}`} className="hover:text-ink">{branch.phone}</a>
                        </dd>
                      </div>
                      <div>
                        <dt className="font-mono text-[8px] uppercase tracking-[0.1em] text-muted">Working hours</dt>
                        <dd className="mt-1 text-ink-soft">{branch.workingHours}</dd>
                      </div>
                      {branch.ownerEmail ? <div>
                        <dt className="font-mono text-[8px] uppercase tracking-[0.1em] text-muted">Branch login</dt>
                        <dd className="mt-1 text-ink-soft">{branch.ownerEmail}</dd>
                      </div> : null}
                    </dl>
                    <div className="mt-5 flex flex-wrap gap-2 border-t border-line pt-4">
                      <Link
                        to={`/admin/branches/${branch._id}/inventory`}
                        className="admin-accent-button"
                      >
                        Manage inventory
                      </Link>
                      <button
                        type="button"
                        className="admin-outline-button"
                        onClick={() => openEditDialog(branch)}
                        disabled={mutatingBranchId !== null}
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        className="admin-outline-button text-danger"
                        onClick={() => void handleDelete(branch._id, branch.name)}
                        disabled={mutatingBranchId !== null}
                      >
                        {mutatingBranchId === branch._id ? 'Deleting...' : 'Delete'}
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            </>
          )}
        </section>

        <footer className="admin-footer mt-6">
          <span>NOVA · BRANCH DIRECTORY</span>
          <span>{isLoading ? 'SYNCING' : `${branches.length} BRANCHES`}</span>
        </footer>
      </div>

      <Dialog
        open={dialogOpen}
        onClose={() => {
          setDialogOpen(false)
          setEditingBranchId(null)
        }}
        title={editingBranchId ? 'Edit branch' : 'Add a branch'}
        description={editingBranchId ? 'Update this branch’s details and status.' : 'Add a new location to your store directory.'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <label className="block">
            <span className="eyebrow">Name</span>
            <input
              required
              maxLength={120}
              value={form.name}
              onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
              className="mt-2 h-11 w-full border border-line bg-canvas/40 px-3 text-sm text-ink outline-none focus:border-line-strong"
              autoComplete="organization"
            />
          </label>
          {!editingBranchId ? (
            <>
              <label className="block">
                <span className="eyebrow">Manager name (optional)</span>
                <input
                  maxLength={120}
                  value={form.ownerName}
                  onChange={(event) => setForm((current) => ({ ...current, ownerName: event.target.value }))}
                  className="mt-2 h-11 w-full border border-line bg-canvas/40 px-3 text-sm text-ink outline-none focus:border-line-strong"
                  autoComplete="name"
                />
              </label>
              <label className="block">
                <span className="eyebrow">Branch login email</span>
                <input
                  required
                  type="email"
                  value={form.ownerEmail}
                  onChange={(event) => setForm((current) => ({ ...current, ownerEmail: event.target.value }))}
                  className="mt-2 h-11 w-full border border-line bg-canvas/40 px-3 text-sm text-ink outline-none focus:border-line-strong"
                  autoComplete="email"
                />
              </label>
              <label className="block">
                <span className="eyebrow">Branch login password</span>
                <input
                  required
                  type="password"
                  minLength={8}
                  value={form.ownerPassword}
                  onChange={(event) => setForm((current) => ({ ...current, ownerPassword: event.target.value }))}
                  className="mt-2 h-11 w-full border border-line bg-canvas/40 px-3 text-sm text-ink outline-none focus:border-line-strong"
                  autoComplete="new-password"
                />
                <span className="mt-1 block text-[10px] text-muted">Use at least 8 characters. The password is stored securely and cannot be viewed later.</span>
              </label>
            </>
          ) : (
            <p className="text-[11px] text-muted">Login email: {form.ownerEmail || 'Not set'} · Passwords are never displayed.</p>
          )}
          <label className="block">
            <span className="eyebrow">Address</span>
            <input
              required
              maxLength={240}
              value={form.address}
              onChange={(event) => setForm((current) => ({ ...current, address: event.target.value }))}
              className="mt-2 h-11 w-full border border-line bg-canvas/40 px-3 text-sm text-ink outline-none focus:border-line-strong"
              autoComplete="street-address"
            />
          </label>
          <label className="block">
            <span className="eyebrow">City</span>
            <input
              maxLength={100}
              value={form.city}
              onChange={(event) => setForm((current) => ({ ...current, city: event.target.value }))}
              className="mt-2 h-11 w-full border border-line bg-canvas/40 px-3 text-sm text-ink outline-none focus:border-line-strong"
              autoComplete="address-level2"
            />
          </label>
          <label className="block">
            <span className="eyebrow">Description</span>
            <textarea
              maxLength={500}
              value={form.description}
              onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))}
              className="mt-2 min-h-20 w-full border border-line bg-canvas/40 px-3 py-2 text-sm text-ink outline-none focus:border-line-strong"
            />
          </label>
          <label className="block">
            <span className="eyebrow">Phone</span>
            <input
              required
              type="tel"
              maxLength={40}
              value={form.phone}
              onChange={(event) => setForm((current) => ({ ...current, phone: event.target.value }))}
              className="mt-2 h-11 w-full border border-line bg-canvas/40 px-3 text-sm text-ink outline-none focus:border-line-strong"
              autoComplete="tel"
            />
          </label>
          <label className="block">
            <span className="eyebrow">Working hours</span>
            <input
              required
              maxLength={120}
              value={form.workingHours}
              onChange={(event) => setForm((current) => ({ ...current, workingHours: event.target.value }))}
              className="mt-2 h-11 w-full border border-line bg-canvas/40 px-3 text-sm text-ink outline-none focus:border-line-strong"
              placeholder="09:00 AM - 11:00 PM"
            />
          </label>

          <label className="block">
            <span className="eyebrow">Status</span>
            <select
              value={form.isActive ? 'active' : 'inactive'}
              onChange={(event) => setForm((current) => ({ ...current, isActive: event.target.value === 'active' }))}
              className="mt-2 h-11 w-full border border-line bg-canvas/40 px-3 text-sm text-ink outline-none focus:border-line-strong"
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </label>

          {mutationError ? <p className="text-xs text-danger" role="alert">{mutationError}</p> : null}

          <div className="flex justify-end gap-2 border-t border-line pt-4">
            <button type="button" className="admin-outline-button" onClick={() => setDialogOpen(false)}>Cancel</button>
            <button type="submit" className="admin-accent-button" disabled={mutatingBranchId !== null}>
              {mutatingBranchId !== null ? 'Saving...' : editingBranchId ? 'Save changes' : 'Add branch'}
            </button>
          </div>
        </form>
      </Dialog>
    </AdminLayout>
  )
}
