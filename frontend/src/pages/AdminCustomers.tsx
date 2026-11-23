import { useCallback, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { AdminLayout } from '../components/layout/admin-layout'
import { useFetch } from '../hooks/useFetch'
import { usersService, type BackendUser } from '../lib/api/users.service'
import { ordersService, type BackendOrder } from '../lib/api/orders.service'

const currency = new Intl.NumberFormat('en-IE', { style: 'currency', currency: 'EUR', maximumFractionDigits: 2 })

const STATUS_STYLES: Record<string, string> = {
  pending: 'text-warning',
  confirmed: 'text-accent',
  delivered: 'text-success',
  cancelled: 'text-danger',
}

export default function AdminCustomers() {
  const [expandedUserId, setExpandedUserId] = useState<number | null>(null)
  const usersRequest = useCallback((signal: AbortSignal) => usersService.getUsers(signal), [])
  const ordersRequest = useCallback((signal: AbortSignal) => ordersService.getAllOrders(signal), [])

  const usersResult = useFetch<BackendUser[]>(usersRequest)
  const ordersResult = useFetch<BackendOrder[]>(ordersRequest)

  const isLoading = usersResult.isLoading || ordersResult.isLoading
  const error = usersResult.error ?? ordersResult.error

  const customers = useMemo(() => {
    const users = usersResult.data ?? []
    return users.filter((user) => user.role === 'customer')
  }, [usersResult.data])

  const ordersByCustomerKey = useMemo(() => {
    const map = new Map<string, BackendOrder[]>()
    const push = (key: string, order: BackendOrder) => {
      const list = map.get(key) ?? []
      list.push(order)
      map.set(key, list)
    }
    for (const order of ordersResult.data ?? []) {
      if (typeof order.userId === 'number') push(`id:${order.userId}`, order)
      push(`email:${order.email.toLowerCase()}`, order)
    }
    return map
  }, [ordersResult.data])

  const ordersFor = (user: BackendUser): BackendOrder[] => {
    const byId = ordersByCustomerKey.get(`id:${user.id}`) ?? []
    const byEmail = ordersByCustomerKey.get(`email:${user.email.toLowerCase()}`) ?? []
    const seen = new Set<string>()
    return [...byId, ...byEmail].filter((order) => {
      if (seen.has(order._id)) return false
      seen.add(order._id)
      return true
    })
  }

  const statsFor = (user: BackendUser) => {
    const orders = ordersFor(user)
    return { count: orders.length, total: orders.reduce((sum, order) => sum + order.total, 0) }
  }

  const totalOrderValue = customers.reduce((sum, user) => sum + statsFor(user).total, 0)

  return (
    <AdminLayout activePage="customers" searchPlaceholder="Search customers">
      <div className="admin-content">
        <div className="admin-page-intro">
          <div>
            <p className="eyebrow">Store operations · Customers</p>
            <h1>Your shoppers,<br /><em>up close.</em></h1>
            <p>Every registered customer account and their order activity. Click a row to inspect their orders.</p>
          </div>
          <Link to="/admin/dashboard" className="admin-outline-button">Back to dashboard</Link>
        </div>

        <section className="admin-metrics" aria-label="Customer summary">
          <article><span>Customers</span><strong>{isLoading ? '—' : customers.length}</strong><small>Registered accounts</small></article>
          <article><span>With orders</span><strong>{isLoading ? '—' : customers.filter((user) => statsFor(user).count > 0).length}</strong><small>Placed at least one order</small></article>
          <article><span>Total orders</span><strong>{isLoading ? '—' : (ordersResult.data ?? []).length}</strong><small>Across all customers</small></article>
          <article><span>Customer spend</span><strong>{isLoading ? '—' : currency.format(totalOrderValue)}</strong><small>Lifetime order value</small></article>
        </section>

        {error ? (
          <div className="admin-api-error" role="alert">
            <span>Could not load customers: {error}</span>
            <button type="button" onClick={() => { usersResult.refetch(); ordersResult.refetch() }}>Retry</button>
          </div>
        ) : null}

        <section className="admin-panel admin-orders-panel" aria-label="All customers">
          <div className="admin-panel-heading"><span>All customers</span><span>{customers.length} records</span></div>
          {isLoading && !usersResult.data ? (
            <div className="p-5 text-xs text-muted" role="status">Loading customers...</div>
          ) : (
            <div className="admin-table">
              <div className="admin-table-head admin-all-orders-head">
                <span>Customer</span><span>Orders</span><span>Spent</span><span>Joined</span>
              </div>
              {customers.map((user) => {
                const stats = statsFor(user)
                const isExpanded = expandedUserId === user.id
                const userOrders = isExpanded ? ordersFor(user) : []
                return (
                  <div key={user.id}>
                    <button
                      type="button"
                      onClick={() => setExpandedUserId(isExpanded ? null : user.id)}
                      className="admin-table-row admin-all-orders-row w-full text-left"
                    >
                      <span className="truncate">{user.name}<small className="block text-muted">{user.email}</small></span>
                      <span>{stats.count}</span>
                      <span>{currency.format(stats.total)}</span>
                      <span className="flex items-center justify-between gap-2">
                        {new Date(user.createdAt).toLocaleDateString()}
                        <span className={`font-mono text-xs text-muted transition-transform ${isExpanded ? 'rotate-180' : ''}`}>⌄</span>
                      </span>
                    </button>
                    {isExpanded ? (
                      <div className="border-b border-line bg-canvas/50 px-5 py-4">
                        {userOrders.length ? (
                          <ul className="space-y-3">
                            {userOrders.map((order) => (
                              <li key={order._id} className="border border-line bg-surface p-4">
                                <div className="flex flex-wrap items-center justify-between gap-2">
                                  <div>
                                    <p className="font-mono text-[10px] uppercase tracking-[0.1em] text-muted">
                                      {order.orderNumber} · {new Date(order.createdAt).toLocaleDateString()}
                                    </p>
                                    <p className="mt-1 text-[12px] text-ink">
                                      {order.items.map((item) => `${item.title} ×${item.quantity}`).join(', ')}
                                    </p>
                                  </div>
                                  <div className="text-right">
                                    <p className="font-mono text-[11px] tabular text-ink">{currency.format(order.total)}</p>
                                    <p className={`mt-1 text-[9px] uppercase tracking-[0.1em] ${STATUS_STYLES[order.status] ?? 'text-muted'}`}>
                                      {order.status} · {order.branch.name}
                                    </p>
                                  </div>
                                </div>
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <p className="text-[11px] text-muted">No orders recorded for this customer.</p>
                        )}
                      </div>
                    ) : null}
                  </div>
                )
              })}
              {!customers.length && !error ? <div className="p-5 text-xs text-muted">No customer accounts yet.</div> : null}
            </div>
          )}
        </section>
        <footer className="admin-footer mt-5"><span>NOVA · CUSTOMER MANAGEMENT</span><span>{customers.length} CUSTOMERS</span></footer>
      </div>
    </AdminLayout>
  )
}
