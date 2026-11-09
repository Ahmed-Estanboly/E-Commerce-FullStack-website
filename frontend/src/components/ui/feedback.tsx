import type { ComponentType, ReactNode } from 'react'
import type { IconProps } from './icons'
import { cn } from '../../lib/utils'

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn('skeleton', className)} aria-hidden="true" />
}

export interface EmptyStateProps {
  icon?: ComponentType<IconProps>
  title: string
  description?: ReactNode
  action?: ReactNode
  className?: string
}

export function EmptyState({ icon, title, description, action, className }: EmptyStateProps) {
  const Icon = icon
  return (
    <div
      className={cn(
        'flex flex-col items-start justify-end border border-dashed border-line-strong/70 px-6 py-12 text-left',
        className,
      )}
    >
      {Icon ? (
        <span className="mb-5 flex h-11 w-11 items-center justify-center rounded-full border border-line text-muted">
          <Icon className="h-5 w-5" strokeWidth={1.25} aria-hidden="true" />
        </span>
      ) : null}
      <h2 className="font-display text-2xl leading-tight">{title}</h2>
      {description ? (
        <p className="mt-2 max-w-md text-[12px] leading-relaxed text-muted">{description}</p>
      ) : null}
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  )
}
