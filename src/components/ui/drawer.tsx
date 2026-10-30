import { createPortal } from 'react-dom'
import type { ReactNode } from 'react'
import { X } from './icons'
import { cn } from '../../lib/utils'
import { useOverlay } from './use-overlay'

export interface DrawerProps {
  open: boolean
  onClose: () => void
  title: string
  eyebrow?: string
  children: ReactNode
  footer?: ReactNode
  side?: 'right' | 'left'
  className?: string
  bodyClassName?: string
}

export function Drawer({
  open,
  onClose,
  title,
  eyebrow,
  children,
  footer,
  side = 'right',
  className,
  bodyClassName,
}: DrawerProps) {
  const panelRef = useOverlay<HTMLDivElement>(open, onClose)
  if (!open) return null

  return createPortal(
    <div className="fixed inset-0 z-[80]">
      <button
        type="button"
        className="animate-overlay absolute inset-0 cursor-default bg-[rgba(15,15,14,0.55)] backdrop-blur-[2px]"
        aria-label="Close panel"
        onClick={onClose}
        tabIndex={-1}
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={cn(
          'absolute inset-y-0 flex w-full max-w-[440px] flex-col border-line bg-surface shadow-lift',
          side === 'right' ? 'animate-panel right-0 border-l' : 'animate-panel-left left-0 border-r',
          className,
        )}
      >
        <div className="flex items-start justify-between gap-4 border-b border-line px-5 py-5">
          <div>
            {eyebrow ? <p className="eyebrow mb-1.5">{eyebrow}</p> : null}
            <h2 className="font-display text-2xl leading-none">{title}</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="focus-ring -mr-1 flex h-9 w-9 items-center justify-center rounded-full text-muted transition-colors hover:bg-canvas-alt hover:text-ink"
            aria-label="Close"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
        <div className={cn('flex-1 overflow-y-auto px-5 py-5', bodyClassName)}>{children}</div>
        {footer ? <div className="border-t border-line px-5 py-4">{footer}</div> : null}
      </div>
    </div>,
    document.body,
  )
}
