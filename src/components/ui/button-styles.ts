import { cn } from '../../lib/utils'

export type ButtonVariant = 'primary' | 'accent' | 'outline' | 'ghost' | 'danger' | 'link'
export type ButtonSize = 'sm' | 'md' | 'lg' | 'icon'

const base =
  'inline-flex items-center justify-center gap-2 rounded-[2px] font-medium uppercase tracking-[0.13em] transition-[background-color,color,border-color,opacity] duration-200 disabled:pointer-events-none disabled:border-line disabled:bg-canvas-alt disabled:text-ink-soft disabled:opacity-100 select-none'

const variants: Record<ButtonVariant, string> = {
  primary: 'bg-inverse text-inverse-ink hover:bg-accent hover:text-accent-ink',
  accent: 'bg-accent text-accent-ink hover:bg-accent-strong',
  outline: 'border border-line-strong bg-transparent text-ink hover:border-ink hover:bg-canvas-alt',
  ghost: 'bg-transparent text-ink-soft hover:bg-canvas-alt hover:text-ink',
  danger: 'border border-danger/40 bg-transparent text-danger hover:bg-danger-soft',
  link: 'h-auto rounded-none bg-transparent p-0 text-ink underline-offset-4 hover:underline',
}

const sizes: Record<ButtonSize, string> = {
  sm: 'h-9 px-3.5 text-[10px]',
  md: 'h-11 px-5 text-[11px]',
  lg: 'h-[52px] px-7 text-[11px]',
  icon: 'h-10 w-10 p-0',
}

/**
 * Styles for links that need to look exactly like a button.
 * Kept separate from `button.tsx` so the component file only exports
 * components (React Fast Refresh requirement).
 */
export const buttonStyles = (
  variant: ButtonVariant = 'primary',
  size: ButtonSize = 'md',
  fullWidth = false,
): string => cn(base, variants[variant], sizes[size], fullWidth && 'w-full')
