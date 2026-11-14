import { BrowserRouter, Navigate, Link, Route, Routes, useParams } from 'react-router-dom'
import type { ReactNode } from 'react'
import { StoreLayout } from './components/layout/store-layout'
import { HomePage } from './pages/HomePage'
import { ProductPage } from './pages/ProductPage'
import Login from './pages/Login'
import Signup from './pages/Signup'
import AdminDashboard from './pages/AdminDashboard'
import AdminAnalytics from './pages/AdminAnalytics'
import AdminBranches from './pages/AdminBranches'
import { buttonStyles } from './components/ui/button-styles'
import { CartPage } from './pages/CartPage'
import ProductsPage from './pages/ProductsPage'
import UserDashboard from './pages/UserDashboard'
import { getStoredFakeAccount, type FakeAccountRole } from './lib/fake-auth'
import CheckoutPage from './pages/CheckoutPage'



function RoutePlaceholder() {
  return (
    <section className="container-nova flex min-h-[58vh] flex-col justify-center py-20">
      <p className="eyebrow">In progress</p>

      <h1 className="mt-4 max-w-2xl font-display text-[clamp(2.6rem,5vw,4.6rem)] leading-[0.95] tracking-[-0.045em]">
        This room is <em className="font-light italic">being prepared.</em>
      </h1>

      <p className="mt-4 max-w-md text-[13px] leading-relaxed text-muted">
        The shared shell, header, footer and homepage are in place. Product, cart and admin routes
        arrive with the rest of the team's branches.
      </p>

      <div className="mt-7 flex flex-wrap gap-2">
        <Link to="/" className={buttonStyles('accent', 'md')}>
          Back to the homepage
        </Link>

        <Link to="/shop" className={buttonStyles('outline', 'md')}>
          Open the shop
        </Link>
      </div>
    </section>
  )
}

function FakeRoleRoute({ role, children }: { role: FakeAccountRole; children: ReactNode }) {
  const account = getStoredFakeAccount()
  const { branchName } = useParams<{ branchName?: string }>()

  if (!account) return <Navigate to="/login" replace />
  if (account.role !== role) return <Navigate to={account.destination} replace />
  if (role === 'branch-owner' && account.branchName !== branchName) return <Navigate to={account.destination} replace />

  return <>{children}</>
}

export function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="login" element={<Login />} />
        <Route path="register" element={<Signup />} />
        <Route path="account" element={<StoreLayout header={{ dashboardHref: '/account' }} />}>
          <Route index element={<UserDashboard />} />
        </Route>

        <Route path="admin/dashboard" element={<FakeRoleRoute role="admin"><AdminDashboard /></FakeRoleRoute>} />
        <Route path="admin/analytics" element={<FakeRoleRoute role="admin"><AdminAnalytics /></FakeRoleRoute>} />
        <Route path="admin/branches" element={<FakeRoleRoute role="admin"><AdminBranches /></FakeRoleRoute>} />
        <Route path=":branchName/dashboard" element={<FakeRoleRoute role="branch-owner"><AdminBranches /></FakeRoleRoute>} />

        <Route element={<StoreLayout header={{ dashboardHref: '/account' }} />}>
          <Route index element={<HomePage />} />
          <Route path="products/:id" element={<ProductPage />} />

          <Route path="shop" element={<ProductsPage />} />
          <Route path="products" element={<Navigate to="/shop" replace />} />
          <Route path="cart" element={<CartPage />} />
          <Route path="checkout" element={<CheckoutPage />} />

          <Route path="*" element={<RoutePlaceholder />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}