import { useEffect } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { Header, type HeaderProps } from './header'
import { Footer, type FooterProps } from './footer'

function ScrollManager() {
  const { pathname, search, hash } = useLocation()

  useEffect(() => {
    if (hash) {
      const target = document.getElementById(hash.slice(1))
      if (target) {
        window.requestAnimationFrame(() => target.scrollIntoView({ block: 'start' }))
        return
      }
    }
    window.scrollTo(0, 0)
  }, [pathname, search, hash])

  return null
}

export interface StoreLayoutProps {
  header?: HeaderProps
  footer?: FooterProps
}

/**
 * Shared storefront shell: skip link, header, page outlet and footer.
 * Cart drawer, account menu and branch selector from NOVA are intentionally
 * absent — those belong to other owners in the team project.
 */
export function StoreLayout({ header, footer }: StoreLayoutProps) {
  return (
    <div className="flex min-h-dvh flex-col bg-canvas">
      <a
        href="#main-content"
        className="sr-only z-[100] bg-accent px-4 py-2 text-accent-ink focus:not-sr-only focus:fixed focus:left-4 focus:top-4"
      >
        Skip to content
      </a>
      <ScrollManager />
      <Header {...header} />
      <main id="main-content" className="flex-1">
        <Outlet />
      </main>
      <Footer {...footer} />
    </div>
  )
}
