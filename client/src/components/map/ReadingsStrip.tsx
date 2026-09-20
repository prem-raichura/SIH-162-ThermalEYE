import { cn } from '@/lib/utils'

export type ReadingTone = 'neutral' | 'good' | 'warning' | 'critical'

const TONE: Record<ReadingTone, string | undefined> = {
  neutral: undefined,
  good: 'var(--color-forest)',
  warning: 'var(--color-amber)',
  critical: 'var(--color-terracotta)',
}

export interface Reading {
  label: string
  value: string | number
  unit?: string
  tone?: ReadingTone
}

/**
 * The headline numbers as one line of text rather than a grid of cards.
 *
 * A map console has no room for four icon badges, and the numbers were never the reason to
 * open the page — they are context for the map. Labels are small caps, values are tabular so
 * they do not jitter as the filters change.
 */
export function ReadingsStrip({ items, className }: { items: Reading[]; className?: string }) {
  return (
    <dl className={cn('flex min-w-0 items-center gap-3.5', className)}>
      {items.map((item, i) => (
        <div key={item.label} className="flex min-w-0 items-center gap-3.5">
          {i > 0 && <span className="bg-line h-3.5 w-px shrink-0" aria-hidden="true" />}
          <div className="flex min-w-0 items-baseline gap-1.5">
            <dt className="text-ink-faint shrink-0 font-mono text-[10px] tracking-[0.1em] whitespace-nowrap uppercase">
              {item.label}
            </dt>
            <dd
              className="tnum shrink-0 font-mono text-[15px] leading-none font-medium"
              style={{ color: TONE[item.tone ?? 'neutral'] }}
            >
              {item.value}
              {item.unit && <span className="text-ink-soft ml-0.5 text-[11px]">{item.unit}</span>}
            </dd>
          </div>
        </div>
      ))}
    </dl>
  )
}
