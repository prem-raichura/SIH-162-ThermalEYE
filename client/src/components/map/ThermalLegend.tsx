import { useState } from 'react'
import { RAMP, T_HOT_DOMAIN, FRP_DOMAIN } from '@/lib/thermal'
import { cn } from '@/lib/utils'

/**
 * One ramp, two readings. Whatever is shown, the colour means the same thing.
 *
 * It sits beside the time-window picker rather than above it, so the bottom of the map keeps
 * a single row of chrome. Only the ends of the scale are labelled — the midpoints were four
 * more numbers to read for no decision they changed.
 */
export function ThermalLegend() {
  const [scale, setScale] = useState<'tHot' | 'frp'>('tHot')
  const domain = scale === 'tHot' ? T_HOT_DOMAIN : FRP_DOMAIN
  const unit = scale === 'tHot' ? 'K' : 'MW'

  return (
    <div className="bg-card/92 border-line flex items-center gap-2.5 rounded-full border py-1 pr-3 pl-1 shadow-sm backdrop-blur">
      <div className="flex shrink-0 gap-0.5">
        {(['tHot', 'frp'] as const).map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => setScale(s)}
            aria-pressed={scale === s}
            className={cn(
              'rounded-full px-2 py-1 text-[11px] transition-colors',
              scale === s ? 'bg-ink text-paper' : 'text-ink-faint hover:text-ink',
            )}
          >
            {s === 'tHot' ? 'T_hot' : 'FRP'}
          </button>
        ))}
      </div>

      <span className="text-ink-faint tnum shrink-0 font-mono text-[10px]">{domain[0]}</span>
      <span
        className="h-2 w-[76px] shrink-0 rounded-full"
        style={{ background: `linear-gradient(90deg, ${RAMP.join(', ')})` }}
        aria-hidden="true"
      />
      <span className="text-ink-faint tnum shrink-0 font-mono text-[10px]">
        {domain[1]} {unit}
      </span>
    </div>
  )
}
