import { useEffect, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, Check, ShoppingBag, Users } from '../components/ui/icons'
import { Button } from '../components/ui/button'
import { CartItemRow } from '../components/cart/CartItemRow'
import { Skeleton } from '../components/ui/feedback'
import { useCart } from '../store/cart-context'
import { formatPrice } from '../lib/utils'

const PROFILE_STORAGE_KEY = 'nova-account-profile'

type Profile = {
  firstName: string
  lastName: string
  email: string
  phone: string
}

type Order = {
  id: string
  date: string
  status: string
  total: number
  items: number
}

const defaultProfile: Profile = {
  firstName: 'Alex',
  lastName: 'Morgan',
  email: 'alex@example.com',
  phone: '',
}

function loadProfile(): Profile {
  try {
    const saved = window.localStorage.getItem(PROFILE_STORAGE_KEY)
    return saved ? { ...defaultProfile, ...JSON.parse(saved) } : defaultProfile
  } catch {
    return defaultProfile
  }
}

function UserDashboardSkeleton() {
  return (
    <div className="container-nova py-12 sm:py-16" aria-label="Loading account dashboard">
      <header className="border-b border-line pb-8"><Skeleton className="h-2 w-32" /><Skeleton className="mt-4 h-20 w-72" /><Skeleton className="mt-5 h-3 w-80 max-w-full" /></header>
      <div className="mt-8 grid gap-5 lg:grid-cols-[minmax(0,1.35fr)_minmax(300px,0.65fr)]">
        {Array.from({ length: 2 }, (_, index) => <section className="border border-line bg-surface p-5 sm:p-7" key={index}><div className="flex justify-between border-b border-line pb-4"><Skeleton className="h-8 w-36" /><Skeleton className="h-2 w-14" /></div><div className="space-y-4 py-8">{Array.from({ length: index ? 4 : 5 }, (_, row) => <Skeleton className="h-4 w-full" key={row} />)}</div></section>)}
      </div>
      <section className="mt-5 border border-line bg-surface p-5 sm:p-7"><div className="flex gap-3 border-b border-line pb-4"><Skeleton className="h-9 w-9" /><Skeleton className="h-8 w-48" /></div><div className="mt-6 grid gap-5 sm:grid-cols-2">{Array.from({ length: 4 }, (_, index) => <Skeleton className="h-11 w-full" key={index} />)}</div></section>
    </div>
  )
}

const UserDashboard = () => {
  const [isLoading, setIsLoading] = useState(true)
  const { items, itemCount, subtotal, updateQuantity, removeItem } = useCart()
  const [profile, setProfile] = useState<Profile>(loadProfile)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => setIsLoading(false))
    return () => window.cancelAnimationFrame(frame)
  }, [])

  const orders: Order[] = []

  function updateProfile(field: keyof Profile, value: string) {
    setSaved(false)
    setProfile((current) => ({ ...current, [field]: value }))
  }

  function saveProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    window.localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(profile))
    setSaved(true)
  }

  if (isLoading) return <UserDashboardSkeleton />

  return (
    <div className="container-nova py-12 sm:py-16">
      <header className="border-b border-line pb-8">
        <p className="eyebrow">Your NOVA account</p>
        <div className="mt-3 flex flex-wrap items-end justify-between gap-5">
          <div>
            <h1 className="font-display text-[clamp(2.7rem,6vw,5.2rem)] leading-[0.88] tracking-[-0.04em]">Welcome back,<br /><em className="font-light">{profile.firstName}.</em></h1>
            <p className="mt-5 max-w-md text-[13px] leading-relaxed text-muted">Keep track of your orders, pick up your edit and keep your details current.</p>
          </div>
          <Link to="/shop" className="focus-ring inline-flex items-center gap-2 border border-line px-3 py-2 font-mono text-[9px] uppercase tracking-[0.12em] text-ink-soft transition-colors hover:border-ink hover:text-ink">Continue shopping <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" /></Link>
        </div>
      </header>

      <div className="mt-8 grid gap-5 lg:grid-cols-[minmax(0,1.35fr)_minmax(300px,0.65fr)]">
        <section className="border border-line bg-surface p-5 sm:p-7" aria-labelledby="orders-heading">
          <div className="flex items-start justify-between gap-4 border-b border-line pb-4">
            <div><p className="eyebrow">The paper trail</p><h2 id="orders-heading" className="mt-1 font-display text-3xl tracking-[-0.03em]">Order history</h2></div>
            <span className="font-mono text-[9px] uppercase tracking-[0.12em] text-muted">{orders.length} orders</span>
          </div>
          {orders.length ? <div className="divide-y divide-line">{orders.map((order) => <div key={order.id} className="flex flex-wrap items-center justify-between gap-4 py-4"><div><p className="font-mono text-[9px] uppercase tracking-[0.12em] text-muted">{order.id} · {order.date}</p><p className="mt-1 text-[13px] text-ink">{order.items} {order.items === 1 ? 'item' : 'items'}</p></div><div className="text-right"><p className="font-mono text-[11px] tabular text-ink">{formatPrice(order.total)}</p><p className="mt-1 text-[9px] uppercase tracking-[0.1em] text-success">{order.status}</p></div></div>)}</div> : <div className="py-16 text-center"><ShoppingBag className="mx-auto h-7 w-7 text-muted" strokeWidth={1.25} aria-hidden="true" /><h3 className="mt-4 font-display text-2xl">No orders yet.</h3><p className="mx-auto mt-2 max-w-xs text-[12px] leading-relaxed text-muted">Your completed purchases will appear here once you place your first order.</p><Link to="/shop" className="mt-5 inline-flex font-mono text-[9px] uppercase tracking-[0.12em] text-ink underline underline-offset-4">Explore the edit</Link></div>}
        </section>

        <section className="border border-line bg-surface p-5 sm:p-7" aria-labelledby="cart-heading">
          <div className="flex items-start justify-between gap-4 border-b border-line pb-4"><div><p className="eyebrow">Ready when you are</p><h2 id="cart-heading" className="mt-1 font-display text-3xl tracking-[-0.03em]">Your cart</h2></div><span className="font-mono text-[9px] uppercase tracking-[0.12em] text-muted">{itemCount} {itemCount === 1 ? 'item' : 'items'}</span></div>
          {items.length ? <><ul className="divide-y divide-line">{items.map((item) => <CartItemRow key={item.product.id} item={item} onQuantityChange={updateQuantity} onRemove={removeItem} />)}</ul><div className="flex items-center justify-between border-t border-line pt-4"><span className="font-mono text-[9px] uppercase tracking-[0.12em] text-muted">Subtotal</span><strong className="font-display text-2xl font-normal">{formatPrice(subtotal)}</strong></div><Link to="/cart" className="mt-5 flex h-11 items-center justify-center bg-accent px-4 font-mono text-[9px] uppercase tracking-[0.12em] text-accent-ink transition-colors hover:bg-accent-strong">Review cart <ArrowRight className="ml-2 h-3.5 w-3.5" aria-hidden="true" /></Link></> : <div className="py-16 text-center"><ShoppingBag className="mx-auto h-7 w-7 text-muted" strokeWidth={1.25} aria-hidden="true" /><h3 className="mt-4 font-display text-2xl">Your cart is quiet.</h3><p className="mx-auto mt-2 max-w-xs text-[12px] leading-relaxed text-muted">Add something considered and it will wait here for you.</p><Link to="/shop" className="mt-5 inline-flex font-mono text-[9px] uppercase tracking-[0.12em] text-ink underline underline-offset-4">Browse products</Link></div>}
        </section>
      </div>

      <section className="mt-5 border border-line bg-surface p-5 sm:p-7" aria-labelledby="account-heading">
        <div className="flex items-start gap-3 border-b border-line pb-4"><span className="flex h-9 w-9 items-center justify-center bg-accent text-accent-ink"><Users className="h-4 w-4" aria-hidden="true" /></span><div><p className="eyebrow">Personal details</p><h2 id="account-heading" className="mt-1 font-display text-3xl tracking-[-0.03em]">Account information</h2></div></div>
        <form className="mt-6 grid gap-5 sm:grid-cols-2" onSubmit={saveProfile}>
          {([['firstName', 'First name', 'text'], ['lastName', 'Last name', 'text'], ['email', 'Email address', 'email'], ['phone', 'Phone number', 'tel']] as const).map(([field, label, type]) => <label key={field} className="grid gap-2 text-[11px] font-medium uppercase tracking-[0.12em] text-ink-soft">{label}<input className="border-0 border-b border-line-strong bg-transparent px-0 py-3 text-sm font-normal normal-case tracking-normal text-ink outline-none transition-colors placeholder:text-muted/70 focus:border-ink" type={type} value={profile[field]} onChange={(event) => updateProfile(field, event.target.value)} placeholder={field === 'phone' ? 'Add a phone number' : undefined} /></label>)}
          <div className="flex flex-wrap items-center gap-4 sm:col-span-2"><Button variant="accent" type="submit" rightIcon={saved ? <Check className="h-4 w-4" aria-hidden="true" /> : undefined}>{saved ? 'Details saved' : 'Save details'}</Button><p className="text-[11px] text-muted">Saved on this device for your next visit.</p></div>
        </form>
      </section>
    </div>
  )
}

export default UserDashboard
