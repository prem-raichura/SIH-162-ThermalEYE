import { useState } from 'react'
import { RAMP, T_HOT_DOMAIN, FRP_DOMAIN } from '@/lib/thermal'
import { cn } from '@/lib/utils'

/** One ramp, two readings. Whatever is shown, the colour means the same thing. */
export function ThermalLegend() {
  const [scale, setScale] = useState<'tHot' | 'frp'>('tHot')
  const domain = scale === 'tHot' ? T_HOT_DOMAIN : FRP_DOMAIN
  const unit = scale === 'tHot' ? 'K' : 'MW'
  const ticks = [0, 0.25, 0.5, 0.75, 1].map((t) => Math.round(domain[0] + (domain[1] - domain[0]) * t))

  return (
    <div className="bg-card/92 border-line w-[236px] rounded-[12px] border px-3 py-2.5 shadow-sm backdrop-blur">
      <div className="flex items-center justify-between">
        <p className="text-[11.5px] font-semibold">Thermal scale</p>
        <div className="flex gap-1">
          {(['tHot', 'frp'] as const).map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setScale(s)}
              className={cn(
                'rounded-full px-2 py-0.5 text-[10.5px] transition-colors',
                scale === s ? 'bg-ink text-paper' : 'text-ink-faint hover:text-ink',
              )}
            >
              {s === 'tHot' ? 'T_hot' : 'FRP'}
            </button>
          ))}
        </div>
      </div>
      <div
        className="mt-2 h-2.5 w-full rounded-full"
        style={{ background: `linear-gradient(90deg, ${RAMP.join(', ')})` }}
      />
      <div className="text-ink-faint tnum mt-1 flex justify-between font-mono text-[9.5px]">
        {ticks.map((t) => (
          <span key={t}>{t}</span>
        ))}
      </div>
      <p className="text-ink-faint mt-0.5 text-right font-mono text-[9.5px]">{unit}</p>
    </div>
  )
}
