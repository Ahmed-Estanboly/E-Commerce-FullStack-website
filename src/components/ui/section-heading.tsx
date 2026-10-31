import type { HTMLAttributes, ReactNode } from 'react'
import { cn } from '../../lib/utils'

export interface SectionHeadingProps extends Omit<HTMLAttributes<HTMLDivElement>, 'title'> {
  eyebrow: string
  title: ReactNode
  description?: ReactNode
  action?: ReactNode
  className?: string
}

/**
 * The editorial section header used across the storefront: hairline rule,
 * mono eyebrow, serif title and an optional right-hand action.
 */
export function SectionHeading({
  eyebrow,
  title,
  description,
  action,
  className,
  ...rest
}: SectionHeadingProps) {
  return (
    <div
      className={cn(
        'flex flex-col gap-5 border-t border-line pt-6 sm:flex-row sm:items-end sm:justify-between sm:gap-10',
        className,
      )}
      {...rest}
    >
      <div className="max-w-2xl">
        <p className="eyebrow">{eyebrow}</p>
        <h2 className="mt-3 font-display text-[clamp(2.4rem,5vw,4.6rem)] leading-[0.92] tracking-[-0.045em]">
          {title}
        </h2>
        {description ? (
          <p className="mt-3 max-w-lg text-[13px] leading-relaxed text-muted">{description}</p>
        ) : null}
      </div>
      {action ? <div className="shrink-0 pb-1">{action}</div> : null}
    </div>
  )
}
