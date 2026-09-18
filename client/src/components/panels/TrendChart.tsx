import { CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { AXIS, CHART_CATEGORICAL, MARK, TOOLTIP_STYLE } from '@/lib/chart'

export interface TrendSeries {
  key: string
  label: string
}

/** Multi-series line chart. One y-scale only — different units get their own chart. */
export function TrendChart<T extends Record<string, unknown>>({
  data,
  xKey,
  series,
  height = 200,
  unit,
  yDomain,
}: {
  data: T[]
  xKey: string
  series: TrendSeries[]
  height?: number
  unit?: string
  yDomain?: [number | 'auto', number | 'auto']
}) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={data} margin={{ top: 6, right: 10, bottom: 0, left: -14 }}>
        <CartesianGrid {...AXIS.grid} vertical={false} />
        <XAxis dataKey={xKey} tickLine={false} axisLine={{ stroke: AXIS.stroke }} tick={AXIS.tick} />
        <YAxis tickLine={false} axisLine={false} tick={AXIS.tick} width={46} domain={yDomain} />
        <Tooltip
          {...TOOLTIP_STYLE}
          formatter={(value, name) => [unit ? `${value} ${unit}` : String(value), String(name)]}
        />
        {series.length > 1 && (
          <Legend
            verticalAlign="top"
            align="left"
            height={26}
            iconType="plainline"
            iconSize={14}
            wrapperStyle={{ fontSize: 11.5, color: 'var(--color-ink-soft)', paddingLeft: 28 }}
          />
        )}
        {series.map((s, i) => (
          <Line
            key={s.key}
            dataKey={s.key}
            name={s.label}
            stroke={CHART_CATEGORICAL[i % CHART_CATEGORICAL.length]}
            strokeWidth={MARK.lineWidth}
            dot={false}
            activeDot={{ r: MARK.activeDotRadius, strokeWidth: 2, stroke: 'var(--color-card)' }}
            isAnimationActive={false}
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  )
}
