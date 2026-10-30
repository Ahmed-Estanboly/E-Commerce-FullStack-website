import { Link } from 'react-router-dom'
import { ArrowUpRight, Mail } from '../ui/icons'
import { Logo } from '../ui/logo'
import { HOME_DEPARTMENTS } from '../../data/home'
import type { Department } from '../../types/home'
import { STORE } from '../../lib/utils'

export interface FooterProps {
  brandName?: string
  supportEmail?: string
  departments?: Department[]
}

/**
 * Storefront footer.
 *
 * Content is adapted to the team project: departments instead of NOVA's seeded
 * categories, no settings store, no authentication links and no branches.
 */
export function Footer({
  brandName = 'NOVA',
  supportEmail = STORE.supportEmail,
  departments = HOME_DEPARTMENTS,
}: FooterProps) {
  return (
    <footer
      id="contact"
      className="site-footer mt-auto scroll-mt-28 border-t border-cream/15 bg-charcoal text-cream"
    >
      <div className="container-nova">
        <div className="grid gap-10 py-12 sm:grid-cols-2 lg:grid-cols-[1.45fr_1fr_1fr_1fr] lg:gap-8 lg:py-16">
          <div className="max-w-sm">
            <Logo size="md" className="text-cream" brandName={brandName} />
            <p className="mt-4 max-w-xs text-[12px] leading-relaxed text-cream/60">
              Six departments, one deliberately short edit. Everyday pieces chosen for the way they
              live, not for the season they belong to.
            </p>
            <p className="mt-5 flex items-center gap-2 text-[11px] text-cream/55">
              <Mail className="h-3.5 w-3.5" strokeWidth={1.5} aria-hidden="true" />
              <a
                href={`mailto:${supportEmail}`}
                className="link-underline text-cream/75 transition-colors hover:text-accent"
              >
                {supportEmail}
              </a>
            </p>
            <p className="mt-6 inline-flex border border-cream/20 px-2.5 py-1 font-mono text-[8px] uppercase tracking-[0.16em] text-cream/50">
              Demo storefront · Simulated orders
            </p>
          </div>

          <div>
            <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-cream/40">Shop</p>
            <ul className="mt-4 space-y-2.5">
              {departments.map((department) => (
                <li key={department.id}>
                  <Link
                    to={`/shop?category=${department.slug}`}
                    className="link-underline text-[12px] text-cream/65 transition-colors hover:text-accent"
                  >
                    {department.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-cream/40">The house</p>
            <ul className="mt-4 space-y-2.5">
              <li>
                <Link
                  to="/#universes"
                  className="link-underline text-[12px] text-cream/65 transition-colors hover:text-accent"
                >
                  Our point of view
                </Link>
              </li>
              <li>
                <Link
                  to="/shop"
                  className="link-underline text-[12px] text-cream/65 transition-colors hover:text-accent"
                >
                  The current edit
                </Link>
              </li>
              <li>
                <Link
                  to="/cart"
                  className="link-underline text-[12px] text-cream/65 transition-colors hover:text-accent"
                >
                  Your bag
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-cream/40">Care</p>
            <ul className="mt-4 space-y-2.5">
              <li>
                <Link
                  to="/#services"
                  className="link-underline text-[12px] text-cream/65 transition-colors hover:text-accent"
                >
                  Delivery &amp; returns
                </Link>
              </li>
              <li>
                <a
                  href={`mailto:${supportEmail}`}
                  className="link-underline text-[12px] text-cream/65 transition-colors hover:text-accent"
                >
                  Contact the studio
                </a>
              </li>
              <li>
                <Link
                  to="/checkout"
                  className="link-underline text-[12px] text-cream/65 transition-colors hover:text-accent"
                >
                  Demo checkout
                </Link>
              </li>
              <li>
                <a
                  href="https://unsplash.com"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 text-[12px] text-cream/65 transition-colors hover:text-accent"
                >
                  Demo photography <ArrowUpRight className="h-3 w-3" aria-hidden="true" />
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="flex flex-col gap-3 border-t border-cream/15 py-5 sm:flex-row sm:items-center sm:justify-between">
          <p className="font-mono text-[9px] uppercase tracking-[0.14em] text-cream/45">
            © 2026 {brandName} · Demo storefront
          </p>
          <p className="max-w-xl text-[10px] leading-relaxed text-cream/40">
            No real orders, payments or personal data are processed. Product imagery is
            illustrative; specifications, stock and addresses are simulated. Store currency:{' '}
            <span className="text-cream/65">{STORE.currency}</span>.
          </p>
        </div>
      </div>
    </footer>
  )
}
