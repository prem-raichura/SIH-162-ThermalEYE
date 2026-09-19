import type { ThermalSite } from '@/lib/types'
import { CLASS_COLOR, tHotColor } from '@/lib/thermal'
import { days, kelvin, megawatt } from '@/lib/format'
import { QualityChip } from './QualityChip'
import { cn } from '@/lib/utils'

/** A site at a glance: identity, what it is doing, and how far to trust the map around it. */
export function SiteCard({
  site,
  onClick,
  onOpenDetail,
  selected,
  className,
}: {
  site: ThermalSite
  onClick?: () => void
  /** Reopens the full-record drawer for a site that is already selected. */
  onOpenDetail?: () => void
  selected?: boolean
  className?: string
}) {
  const readings: [string, string][] = [
    ['Detections', String(site.detectionCount)],
    ['Active days', days(site.activeDays)],
    ['Night ratio', site.nightRatio.toFixed(2)],
    ['FRP slope', site.frpSlope > 0 ? `+${site.frpSlope.toFixed(3)}` : site.frpSlope.toFixed(3)],
  ]

  return (
    <article
      onClick={onClick}
      className={cn(
        'bg-card border-line rounded-[12px] border px-4 py-3',
        onClick && 'hover:border-ink-faint/60 cursor-pointer',
        selected && 'border-ink-faint',
        className,
      )}
    >
      <div className="flex items-start gap-2">
        <span
          className="mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full"
          style={{ backgroundColor: CLASS_COLOR[site.predictedClass] }}
        />
        <div className="min-w-0 flex-1">
          <h4 className="truncate text-[13.5px] font-medium">{site.name}</h4>
          <p className="text-ink-soft truncate text-[12px]">
            {site.predictedLabel} · {site.state}
            {site.operator ? ` · ${site.operator}` : ''}
          </p>
        </div>
        <span
          className="shrink-0 rounded-full px-2 py-0.5 text-[10.5px]"
          style={{
            backgroundColor: site.behaviour === 'abnormal' ? 'var(--color-terra-dim)' : 'var(--color-forest-dim)',
            color: site.behaviour === 'abnormal' ? 'var(--color-terracotta)' : 'var(--color-forest)',
          }}
        >
          {site.behaviour === 'abnormal' ? 'Abnormal' : 'Normal'}
        </span>
      </div>

      <div className="mt-3 flex items-baseline gap-4">
        <span className="font-display tnum text-[21px] leading-none" style={{ color: tHotColor(site.tHot) }}>
          {kelvin(site.tHot)}
        </span>
        <span className="text-ink-soft tnum font-mono text-[11.5px]">{megawatt(site.frpMean)} mean FRP</span>
      </div>

      <dl className="text-ink-soft mt-3 grid grid-cols-2 gap-x-4 gap-y-1 text-[11.5px]">
        {readings.map(([label, value]) => (
          <div key={label} className="flex justify-between gap-2">
            <dt className="truncate">{label}</dt>
            <dd className="tnum font-mono">{value}</dd>
          </div>
        ))}
      </dl>

      <div className="border-line mt-3 flex items-center justify-between gap-3 border-t pt-2">
        <QualityChip label="Coverage quality" score={site.coverageQualityScore} />
        {onOpenDetail && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              onOpenDetail()
            }}
            className="text-ink-soft hover:text-ink shrink-0 text-[12px] underline-offset-4 hover:underline"
          >
            Full record
          </button>
        )}
      </div>
    </article>
  )
}
