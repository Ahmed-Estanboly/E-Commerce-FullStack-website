import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { cn } from '../../lib/utils'

export interface QuantityStepperProps {
  value: number
  onChange: (value: number) => void
  min?: number
  max?: number
  label?: string
  tone?: 'default' | 'inverse'
  className?: string
}

function MinusIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      aria-hidden="true"
      className="h-3 w-3"
    >
      <path d="M5 12h14" />
    </svg>
  )
}

function PlusIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      aria-hidden="true"
      className="h-3 w-3"
    >
      <path d="M12 5v14" />
      <path d="M5 12h14" />
    </svg>
  )
}

function StepperButton({
  label,
  disabled,
  onClick,
  children,
  tone,
}: {
  label: string
  disabled: boolean
  onClick: ButtonHTMLAttributes<HTMLButtonElement>['onClick']
  children: ReactNode
  tone: 'default' | 'inverse'
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'focus-ring flex h-full w-7 items-center justify-center transition-colors disabled:cursor-not-allowed disabled:opacity-40',
        tone === 'inverse'
          ? 'text-cream/65 hover:bg-cream/10 hover:text-cream'
          : 'text-ink-soft hover:bg-canvas-alt hover:text-ink',
      )}
      aria-label={label}
    >
      {children}
    </button>
  )
}

/** Reusable accessible quantity control with configurable lower and upper bounds. */
export function QuantityStepper({
  value,
  onChange,
  min = 1,
  max = Number.POSITIVE_INFINITY,
  label = 'quantity',
  tone = 'default',
  className = '',
}: QuantityStepperProps) {
  const canDecrease = value > min
  const canIncrease = value < max

  return (
    <div
      className={cn(
        'flex h-7 items-center border',
        tone === 'inverse' ? 'border-cream/20' : 'border-line',
        className,
      )}
    >
      <StepperButton
        label={`Decrease ${label}`}
        disabled={!canDecrease}
        onClick={() => canDecrease && onChange(value - 1)}
        tone={tone}
      >
        <MinusIcon />
      </StepperButton>
      <span
        className={cn(
          'min-w-6 text-center font-mono text-[9px] tabular',
          tone === 'inverse' ? 'text-cream' : 'text-ink',
        )}
        aria-live="polite"
      >
        {value}
      </span>
      <StepperButton
        label={`Increase ${label}`}
        disabled={!canIncrease}
        onClick={() => canIncrease && onChange(value + 1)}
        tone={tone}
      >
        <PlusIcon />
      </StepperButton>
    </div>
  )
}
