import type { LucideIcon } from 'lucide-react'
import { ArrowDown, ArrowUp } from 'lucide-react'
import { cn } from '@/lib/utils'

export type Tone = 'neutral' | 'good' | 'warning' | 'critical'

const TONE: Record<Tone, { bg: string; fg: string }> = {
  neutral: { bg: 'var(--color-paper-deep)', fg: 'var(--color-ink-soft)' },
  good: { bg: 'var(--color-forest-dim)', fg: 'var(--color-forest)' },
  warning: { bg: 'var(--color-amber-dim)', fg: 'var(--color-amber)' },
  critical: { bg: 'var(--color-terra-dim)', fg: 'var(--color-terracotta)' },
}

/**
 * The headline reading: circular icon badge, the number in the display face, its unit, an
 * optional delta chip and one line of context.
 */
export function StatTile({
  icon: Icon,
  label,
  value,
  unit,
  delta,
  deltaLabel,
  caption,
  tone = 'neutral',
  className,
}: {
  icon: LucideIcon
  label: string
  value: string | number
  unit?: string
  delta?: number
  deltaLabel?: string
  caption?: string
  tone?: Tone
  className?: string
}) {
  const up = (delta ?? 0) >= 0
  const showDelta = delta !== undefined && delta !== 0

  return (
    <div className={cn('bg-card border-line flex items-start gap-3.5 rounded-[12px] border px-4 py-3.5', className)}>
      <span
        className="grid h-11 w-11 shrink-0 place-items-center rounded-full"
        style={{ backgroundColor: TONE[tone].bg, color: TONE[tone].fg }}
      >
        <Icon size={19} strokeWidth={1.8} />
      </span>

      <div className="min-w-0">
        <p className="text-ink-soft truncate text-[12.5px]">{label}</p>
        <p className="mt-0.5 flex items-baseline gap-1.5">
          <span className="font-display tnum text-[27px] leading-none">{value}</span>
          {unit && <span className="text-ink-soft text-[12.5px]">{unit}</span>}
          {showDelta && (
            <span
              className="tnum ml-0.5 inline-flex items-center gap-0.5 text-[11.5px]"
              style={{ color: up ? 'var(--color-forest)' : 'var(--color-terracotta)' }}
            >
              {up ? <ArrowUp size={11} /> : <ArrowDown size={11} />}
              {Math.abs(delta ?? 0)}
              {deltaLabel ?? '%'}
            </span>
          )}
        </p>
        {caption && <p className="text-ink-faint mt-1 truncate text-[11.5px]">{caption}</p>}
      </div>
    </div>
  )
}
