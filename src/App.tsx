import { BrowserRouter, Link, Route, Routes } from 'react-router-dom'
import { StoreLayout } from './components/layout/store-layout'
import { HomePage } from './pages/HomePage'
import { buttonStyles } from './components/ui/button-styles'

/**
 * Temporary fallback for routes that have not been merged yet.
 * Remove this route once the team's page routes are registered.
 */
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

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<StoreLayout />}>
          <Route index element={<HomePage />} />

          {/* Reserved storefront paths. Replace each placeholder with the real
              page when its owner merges; the wildcard stays last. */}
          <Route path="shop" element={<RoutePlaceholder />} />
          <Route path="products/:id" element={<RoutePlaceholder />} />
          <Route path="cart" element={<RoutePlaceholder />} />
          <Route path="checkout" element={<RoutePlaceholder />} />
          <Route path="login" element={<RoutePlaceholder />} />
          <Route path="register" element={<RoutePlaceholder />} />

          <Route path="*" element={<RoutePlaceholder />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default App
