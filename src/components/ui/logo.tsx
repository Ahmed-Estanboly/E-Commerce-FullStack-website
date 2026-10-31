import { Link } from 'react-router-dom'
import { cn } from '../../lib/utils'

export interface LogoProps {
  className?: string
  size?: 'sm' | 'md' | 'lg'
  withDot?: boolean
  brandName?: string
  to?: string
}

export function Logo({
  className,
  size = 'md',
  withDot = true,
  brandName = 'NOVA',
  to = '/',
}: LogoProps) {
  const sizes = {
    sm: 'text-[15px] tracking-[0.3em]',
    md: 'text-[19px] tracking-[0.34em]',
    lg: 'text-[26px] tracking-[0.32em]',
  }

  return (
    <Link
      to={to}
      aria-label={`${brandName} — home`}
      className={cn('focus-ring inline-flex items-center gap-1.5 text-ink', className)}
    >
      <span className={cn('wordmark', sizes[size])}>{brandName}</span>
      {withDot ? (
        <span className="mb-[2px] h-1.5 w-1.5 self-end bg-accent" aria-hidden="true" />
      ) : null}
    </Link>
  )
}
