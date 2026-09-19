import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts'
import { CHART_CATEGORICAL, TOOLTIP_STYLE } from '@/lib/chart'
import { nf } from '@/lib/format'

export interface Slice {
  label: string
  value: number
  color?: string
}

/**
 * Composition with a headline in the middle. Slices are always legended with their counts —
 * colour alone never carries the identity.
 */
export function DistributionDonut({
  slices,
  centerLabel,
  centerValue,
  height = 168,
  unit,
}: {
  slices: Slice[]
  centerLabel: string
  centerValue: string | number
  height?: number
  unit?: string
}) {
  const total = slices.reduce((a, s) => a + s.value, 0) || 1

  return (
    <div className="flex items-center gap-5">
      <div className="relative shrink-0" style={{ width: height, height }}>
        <ResponsiveContainer width="100%" height="100%">
          {/* Recharts puts role="application" and a tab stop on its own surface. The legend
              beside the donut already carries every label and count, so the graphic is
              marked presentational rather than made a second, unlabelled tab stop. */}
          <PieChart accessibilityLayer={false} role="presentation" tabIndex={-1}>
            <Pie
              data={slices}
              dataKey="value"
              nameKey="label"
              innerRadius="62%"
              outerRadius="96%"
              paddingAngle={2}
              // Recharts still tab-stops the <g> layer, so it is taken out explicitly.
              tabIndex={-1}
              rootTabIndex={-1}
              stroke="var(--color-card)"
              strokeWidth={2}
              isAnimationActive={false}
            >
              {slices.map((s, i) => (
                <Cell key={s.label} fill={s.color ?? CHART_CATEGORICAL[i % CHART_CATEGORICAL.length]} />
              ))}
            </Pie>
            <Tooltip
              {...TOOLTIP_STYLE}
              formatter={(value, name) => [
                `${nf(Number(value))}${unit ? ` ${unit}` : ''} · ${Math.round((Number(value) / total) * 100)}%`,
                String(name),
              ]}
            />
          </PieChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 grid place-content-center text-center">
          <span className="font-display tnum text-[22px] leading-none">{centerValue}</span>
          <span className="text-ink-faint mt-1 text-[10.5px]">{centerLabel}</span>
        </div>
      </div>

      <ul className="min-w-0 flex-1 space-y-1.5">
        {slices.map((s, i) => (
          <li key={s.label} className="flex items-center gap-2 text-[12px]">
            <span
              className="h-2.5 w-2.5 shrink-0 rounded-[3px]"
              style={{ backgroundColor: s.color ?? CHART_CATEGORICAL[i % CHART_CATEGORICAL.length] }}
            />
            <span className="text-ink-soft min-w-0 flex-1 truncate">{s.label}</span>
            <span className="tnum font-mono text-[11.5px]">{nf(s.value)}</span>
            <span className="text-ink-faint tnum w-9 text-right font-mono text-[11px]">
              {Math.round((s.value / total) * 100)}%
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}
