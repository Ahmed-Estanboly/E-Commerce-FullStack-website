import { useEffect, useState } from 'react'
import { Check, Monitor, Moon, Sun } from '../ui/icons'
import { useClickOutside } from '../../hooks/use-click-outside'
import { useTheme, type ThemePreference } from '../../hooks/use-theme'
import { cn } from '../../lib/utils'

const options: { value: ThemePreference; label: string; icon: typeof Sun }[] = [
  { value: 'light', label: 'Light', icon: Sun },
  { value: 'dark', label: 'Dark', icon: Moon },
  { value: 'system', label: 'System', icon: Monitor },
]

/**
 * Appearance menu. The preference is persisted under `nova.theme`, the same
 * payload the pre-paint script in index.html reads to avoid a theme flash.
 */
export function ThemeToggle({ className }: { className?: string }) {
  const { preference, setPreference } = useTheme()
  const [open, setOpen] = useState(false)
  const containerRef = useClickOutside<HTMLDivElement>(() => setOpen(false))
  const current = options.find((option) => option.value === preference) ?? options[2]
  const CurrentIcon = current.icon

  useEffect(() => {
    if (!open) return
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false)
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [open])

  return (
    <div className={cn('relative', className)} ref={containerRef}>
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="focus-ring flex h-10 w-10 items-center justify-center border border-transparent text-ink-soft transition-colors hover:border-line hover:bg-canvas-alt hover:text-ink"
        aria-label={`Theme: ${current.label}. Change theme`}
        aria-haspopup="menu"
        aria-expanded={open}
      >
        <CurrentIcon className="h-[17px] w-[17px]" strokeWidth={1.5} aria-hidden="true" />
      </button>
      {open ? (
        <div
          role="menu"
          aria-label="Theme preference"
          className="animate-menu absolute right-0 top-[calc(100%+8px)] z-50 w-44 border border-line bg-surface p-1.5 shadow-lift"
        >
          <p className="px-2.5 pb-2 pt-1.5 font-mono text-[8px] uppercase tracking-[0.2em] text-muted">
            Appearance
          </p>
          {options.map((option) => {
            const Icon = option.icon
            const selected = option.value === preference
            return (
              <button
                key={option.value}
                type="button"
                role="menuitemradio"
                aria-checked={selected}
                onClick={() => {
                  setPreference(option.value)
                  setOpen(false)
                }}
                className={cn(
                  'flex w-full items-center gap-2.5 px-2.5 py-2 text-left text-[12px] transition-colors hover:bg-canvas-alt',
                  selected ? 'text-ink' : 'text-ink-soft',
                )}
              >
                <Icon className="h-3.5 w-3.5 text-muted" strokeWidth={1.5} aria-hidden="true" />
                <span className="flex-1">{option.label}</span>
                {selected ? <Check className="h-3.5 w-3.5 text-ink" aria-hidden="true" /> : null}
              </button>
            )
          })}
        </div>
      ) : null}
    </div>
  )
}
