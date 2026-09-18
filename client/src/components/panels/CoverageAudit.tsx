import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { AXIS, CHART_CATEGORICAL, MARK, TOOLTIP_STYLE } from '@/lib/chart'
import { coverage } from '@/lib/data'
import { nf } from '@/lib/format'

/**
 * The facility-coverage audit of section 21.1: how many persistent thermal sites have a
 * mapped facility within 1 km, in OSM alone and with the authoritative registers merged.
 * Feature counts are the measured India PBF extraction, not an estimate.
 */
export function CoverageAudit({ height = 260 }: { height?: number }) {
  const data = coverage.rows.map((r) => ({
    label: r.label,
    osmOnly: r.osmOnly,
    withRegisters: r.withRegisters,
    features: r.features,
    typedNamed: r.typedNamed,
  }))

  return (
    <div>
      <ResponsiveContainer width="100%" height={height}>
        <BarChart data={data} margin={{ top: 4, right: 8, bottom: 0, left: -18 }} barGap={MARK.barGap}>
          <CartesianGrid {...AXIS.grid} vertical={false} />
          <XAxis
            dataKey="label"
            tickLine={false}
            axisLine={{ stroke: AXIS.stroke }}
            tick={{ ...AXIS.tick, fontSize: 9.5 }}
            interval={0}
            angle={-32}
            textAnchor="end"
            height={64}
          />
          <YAxis tickLine={false} axisLine={false} tick={AXIS.tick} width={44} domain={[0, 100]} unit="%" />
          <Tooltip {...TOOLTIP_STYLE} formatter={(value, name) => [`${value}%`, String(name)]} />
          <Legend
            verticalAlign="top"
            align="left"
            height={24}
            iconType="square"
            iconSize={10}
            wrapperStyle={{ fontSize: 11.5, color: 'var(--color-ink-soft)', paddingLeft: 24 }}
          />
          <Bar
            dataKey="osmOnly"
            name="OSM only"
            fill={CHART_CATEGORICAL[2]}
            radius={MARK.barRadius}
            isAnimationActive={false}
          />
          <Bar
            dataKey="withRegisters"
            name="With registers"
            fill={CHART_CATEGORICAL[0]}
            radius={MARK.barRadius}
            isAnimationActive={false}
          />
        </BarChart>
      </ResponsiveContainer>

      <div className="mt-3 overflow-x-auto">
        <table className="w-full min-w-[420px] text-[12px]">
          <thead className="text-ink-faint border-line border-b text-[10.5px] tracking-wide">
            <tr>
              <th className="py-1.5 pr-3 text-left font-normal">Facility class</th>
              <th className="px-3 py-1.5 text-right font-normal last:pr-0">OSM features</th>
              <th className="px-3 py-1.5 text-right font-normal last:pr-0">Typed + named</th>
              <th className="px-3 py-1.5 text-right font-normal last:pr-0">OSM only</th>
              <th className="px-3 py-1.5 text-right font-normal last:pr-0">With registers</th>
            </tr>
          </thead>
          <tbody className="divide-line divide-y">
            {data.map((r) => (
              <tr key={r.label}>
                <td className="py-1.5 pr-3">{r.label}</td>
                <td className="tnum px-3 py-1.5 text-right font-mono last:pr-0">{nf(r.features)}</td>
                <td className="tnum px-3 py-1.5 text-right font-mono last:pr-0">{nf(r.typedNamed)}</td>
                <td className="tnum px-3 py-1.5 text-right font-mono last:pr-0">{r.osmOnly}%</td>
                <td className="tnum px-3 py-1.5 text-right font-mono last:pr-0">{r.withRegisters}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="text-ink-soft mt-3 text-[12px]">
        Coverage for persistent thermal sites is <strong>{coverage.osmOnlyOverall}%</strong> with OSM alone, rising to{' '}
        <strong>{coverage.withRegistersOverall}%</strong> once PPAC, WRI, GEM and CEA are merged in.
      </p>
      <p className="text-ink-faint mt-1.5 text-[11px]">{coverage.note}</p>
    </div>
  )
}
