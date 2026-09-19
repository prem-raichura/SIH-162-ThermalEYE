import { useEffect, useMemo, useState } from 'react'
import {
  Area,
  CartesianGrid,
  ComposedChart,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { AXIS, MARK, STATUS, TOOLTIP_STYLE } from '@/lib/chart'
import { expandSeries, loadTimeseries } from '@/lib/data'
import type { SiteSeries, ThermalSite } from '@/lib/types'
import { EmptyState } from './EmptyState'
import { ChartFigure } from './ChartFigure'

/**
 * A site against its own history (section 18): the shaded band is that site's normal p10-p90
 * range, the line is what it actually did. Deviation is only meaningful against this band,
 * never against a global threshold.
 */
export function BaselineBandChart({ site, height = 210 }: { site: ThermalSite; height?: number }) {
  const [series, setSeries] = useState<Record<string, SiteSeries> | null>(null)

  useEffect(() => {
    loadTimeseries().then(setSeries)
  }, [])

  const data = useMemo(() => {
    const raw = series?.[site.id]
    if (!raw) return []
    // 365 daily points is more than the axis can show, so plot a weekly mean.
    const points = expandSeries(raw)
    const weeks: { date: string; frp: number; low: number; high: number }[] = []
    for (let i = 0; i < points.length; i += 7) {
      const slice = points.slice(i, i + 7)
      const mean = (key: 'frp' | 'low' | 'high') =>
        Math.round((slice.reduce((a, p) => a + p[key], 0) / slice.length) * 10) / 10
      weeks.push({ date: slice[0].date, frp: mean('frp'), low: mean('low'), high: mean('high') })
    }
    return weeks.map((w) => ({ ...w, bandBase: w.low, bandSpan: Math.max(0, w.high - w.low) }))
  }, [series, site.id])

  if (series && data.length === 0) {
    return (
      <EmptyState
        title="No baseline for this site yet"
        body="Historical series are built for the 260 most-detected sites. This one needs more passes before a normal range means anything."
      />
    )
  }

  const tickFmt = (iso: string) =>
    new Date(`${iso}T00:00:00Z`).toLocaleDateString('en-IN', { month: 'short', timeZone: 'UTC' })

  const last = data.at(-1)
  const summary = last
    ? `Weekly mean fire radiative power for ${site.name} against the band this site normally sits in. The most recent week reads ${last.frp} megawatts against a normal ${last.low} to ${last.high}.`
    : `Weekly mean fire radiative power for ${site.name} against the band this site normally sits in.`

  return (
    <ChartFigure
      label="Observed FRP against this site's own normal range"
      summary={summary}
      table={{
        caption: `Weekly means for ${site.name}, in megawatts.`,
        columns: ['Week of', 'Observed FRP', 'Normal low', 'Normal high'],
        rows: data.map((w) => [w.date, w.frp, w.low, w.high]),
      }}
    >
      <div className="text-ink-soft mb-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-[11.5px]">
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2 w-4 rounded-sm" style={{ background: 'var(--color-slate-dim)' }} />
          Normal range for this site
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="h-0.5 w-4 rounded-full" style={{ background: 'var(--color-terracotta)' }} />
          Observed FRP
        </span>
      </div>

      <ResponsiveContainer width="100%" height={height}>
        <ComposedChart data={data} margin={{ top: 4, right: 8, bottom: 0, left: -12 }}>
          <CartesianGrid {...AXIS.grid} vertical={false} />
          <XAxis
            dataKey="date"
            tickFormatter={(value) => tickFmt(String(value))}
            interval={4}
            tickLine={false}
            axisLine={{ stroke: AXIS.stroke }}
            tick={AXIS.tick}
          />
          <YAxis
            tickLine={false}
            axisLine={false}
            tick={AXIS.tick}
            width={44}
            label={undefined}
          />
          <Tooltip
            {...TOOLTIP_STYLE}
            formatter={(value, name) => [`${value} MW`, String(name)]}
            labelFormatter={(label) =>
              new Date(`${String(label)}T00:00:00Z`).toLocaleDateString('en-IN', {
                day: '2-digit',
                month: 'short',
                year: 'numeric',
                timeZone: 'UTC',
              })
            }
          />
          <Area
            dataKey="bandBase"
            stackId="band"
            stroke="none"
            fill="transparent"
            isAnimationActive={false}
            name="Band floor"
            legendType="none"
            tooltipType="none"
          />
          <Area
            dataKey="bandSpan"
            stackId="band"
            stroke="none"
            fill="var(--color-slate-dim)"
            fillOpacity={1}
            isAnimationActive={false}
            name="Normal range"
          />
          <Line
            dataKey="frp"
            stroke="var(--color-terracotta)"
            strokeWidth={MARK.lineWidth}
            dot={false}
            activeDot={{ r: MARK.activeDotRadius, strokeWidth: 2, stroke: 'var(--color-card)' }}
            isAnimationActive={false}
            name="Observed FRP"
          />
        </ComposedChart>
      </ResponsiveContainer>

      <dl className="border-line tnum mt-2 flex gap-5 border-t pt-2 font-mono text-[11px]">
        <div>
          <dt className="text-ink-faint">Normal</dt>
          <dd>
            {site.normalLow}–{site.normalHigh} MW
          </dd>
        </div>
        <div>
          <dt className="text-ink-faint">Current</dt>
          <dd style={{ color: site.behaviour === 'abnormal' ? STATUS.critical : 'inherit' }}>{site.currentFrp} MW</dd>
        </div>
        <div>
          <dt className="text-ink-faint">Deviation</dt>
          <dd>{site.deviationPct > 0 ? `+${site.deviationPct}%` : 'within range'}</dd>
        </div>
      </dl>
    </ChartFigure>
  )
}
