import { createPortal } from 'react-dom'
import type { ReactNode } from 'react'
import { X } from './icons'
import { cn } from '../../lib/utils'
import { useOverlay } from './use-overlay'

const widths = {
  sm: 'sm:max-w-md',
  md: 'sm:max-w-lg',
  lg: 'sm:max-w-2xl',
  xl: 'sm:max-w-4xl',
}

export interface DialogProps {
  open: boolean
  onClose: () => void
  title?: string
  description?: string
  children: ReactNode
  footer?: ReactNode
  size?: keyof typeof widths
  className?: string
}

export function Dialog({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  size = 'md',
  className,
}: DialogProps) {
  const panelRef = useOverlay<HTMLDivElement>(open, onClose)
  if (!open) return null

  return createPortal(
    <div className="fixed inset-0 z-[80] flex items-end justify-center sm:items-center sm:p-6">
      <button
        type="button"
        className="animate-overlay absolute inset-0 cursor-default bg-[rgba(15,15,14,0.55)] backdrop-blur-[3px]"
        aria-label="Close dialog"
        onClick={onClose}
        tabIndex={-1}
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? 'dialog-title' : undefined}
        aria-label={title ? undefined : 'Dialog'}
        className={cn(
          'animate-menu relative max-h-[92dvh] w-full overflow-y-auto border border-line bg-surface text-ink shadow-lift sm:rounded-[3px]',
          widths[size],
          className,
        )}
      >
        <div className="sticky top-0 z-10 flex items-start justify-between gap-6 border-b border-line bg-surface/95 px-5 py-4 backdrop-blur sm:px-6">
          <div>
            {title ? (
              <h2 id="dialog-title" className="font-display text-2xl leading-tight">
                {title}
              </h2>
            ) : null}
            {description ? <p className="mt-1 text-[13px] text-muted">{description}</p> : null}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="focus-ring -mr-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-muted transition-colors hover:bg-canvas-alt hover:text-ink"
            aria-label="Close"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
        <div className="px-5 py-5 sm:px-6">{children}</div>
        {footer ? (
          <div className="sticky bottom-0 border-t border-line bg-surface/95 px-5 py-4 backdrop-blur sm:px-6">
            {footer}
          </div>
        ) : null}
      </div>
    </div>,
    document.body,
  )
}
