import { useMemo } from 'react'
import {
  CartesianGrid,
  Legend,
  ReferenceLine,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis,
  ZAxis,
} from 'recharts'
import { AXIS, CHART_CATEGORICAL, TOOLTIP_STYLE } from '@/lib/chart'
import { ChartFigure } from './ChartFigure'
import type { ThermalSite } from '@/lib/types'
import { nf } from '@/lib/format'

/**
 * Section 7.1 made visible. A small, very hot source — a flare, a kiln, a smelter — produces
 * a large dual-band contrast. A broad, cooler burn of crop residue or forest produces a small
 * one. This is a measured separation, not an assumption read off a facility map, and it is
 * the discriminator FSI does not currently apply to their fire feed.
 */
export function SeparationScatter({
  industrial,
  vegetation,
  boundary,
  height = 300,
}: {
  industrial: ThermalSite[]
  vegetation: ThermalSite[]
  boundary: number
  height?: number
}) {
  const toPoints = (rows: ThermalSite[]) =>
    rows
      .filter((s) => s.deltaT !== null && s.frpDensity > 0)
      .map((s) => ({ x: s.deltaT as number, y: s.frpDensity, name: s.name, label: s.predictedLabel }))

  const industrialPoints = useMemo(() => toPoints(industrial), [industrial])
  const vegetationPoints = useMemo(() => toPoints(vegetation), [vegetation])

  const misread = vegetationPoints.filter((p) => p.x > boundary).length
  const shareClean = 1 - misread / Math.max(vegetationPoints.length, 1)

  // The scatter carries the separation claim, so the same split is available as counts for
  // anyone who cannot read the plot.
  const band = (points: { x: number }[], from: number, to: number) =>
    points.filter((p) => p.x >= from && p.x < to).length
  const BANDS: [number, number][] = [
    [0, 15],
    [15, boundary],
    [boundary, 45],
    [45, 60],
    [60, Number.POSITIVE_INFINITY],
  ]

  return (
    <ChartFigure
      label="Dual-band contrast against scan-normalised intensity"
      summary={`Each point is one site: dual-band contrast in kelvin across, FRP density in megawatts per square kilometre up. At the ${boundary} K boundary, ${nf(shareClean * 100, 0)} percent of ${nf(vegetationPoints.length, 0)} vegetation burns fall below it and most of the ${nf(industrialPoints.length, 0)} industrial sources fall above it.`}
      table={{
        caption: `Sites per ΔT band. The stated boundary is ${boundary} K.`,
        columns: ['ΔT band', 'Vegetation burns', 'Industrial sources'],
        rows: BANDS.map(([from, to]) => [
          to === Number.POSITIVE_INFINITY ? `${from} K and above` : `${from}–${to} K`,
          band(vegetationPoints, from, to),
          band(industrialPoints, from, to),
        ]),
      }}
    >
      <ResponsiveContainer width="100%" height={height}>
        <ScatterChart margin={{ top: 8, right: 12, bottom: 18, left: -8 }}>
          <CartesianGrid {...AXIS.grid} />
          <XAxis
            type="number"
            dataKey="x"
            name="Dual-band contrast"
            unit=" K"
            tickLine={false}
            axisLine={{ stroke: AXIS.stroke }}
            tick={AXIS.tick}
            label={{
              value: 'ΔT  (K)',
              position: 'insideBottom',
              offset: -10,
              fill: 'var(--color-ink-faint)',
              fontSize: 11,
            }}
          />
          <YAxis
            type="number"
            dataKey="y"
            name="FRP density"
            unit=" MW/km²"
            tickLine={false}
            axisLine={false}
            tick={AXIS.tick}
            width={56}
          />
          <ZAxis range={[26, 26]} />
          <Tooltip
            {...TOOLTIP_STYLE}
            cursor={{ strokeDasharray: '3 3', stroke: 'var(--color-ink-faint)' }}
            formatter={(value, name) => [`${nf(Number(value), 1)}`, String(name)]}
          />
          <Legend
            verticalAlign="top"
            align="left"
            height={26}
            iconType="circle"
            iconSize={9}
            wrapperStyle={{ fontSize: 11.5, color: 'var(--color-ink-soft)', paddingLeft: 24 }}
          />
          <ReferenceLine
            x={boundary}
            stroke="var(--color-ink-faint)"
            strokeDasharray="4 4"
            label={{
              value: `ΔT = ${boundary} K`,
              position: 'top',
              fill: 'var(--color-ink-faint)',
              fontSize: 10.5,
            }}
          />
          <Scatter
            name="Vegetation burns"
            data={vegetationPoints}
            fill={CHART_CATEGORICAL[0]}
            fillOpacity={0.72}
            isAnimationActive={false}
          />
          <Scatter
            name="Industrial sources"
            data={industrialPoints}
            fill={CHART_CATEGORICAL[1]}
            fillOpacity={0.72}
            isAnimationActive={false}
          />
        </ScatterChart>
      </ResponsiveContainer>

      <p className="text-ink-soft mt-2 text-[12.5px]">
        A small very hot source gives a large ΔT; a broad cooler burn gives a small one. At the stated{' '}
        <span className="tnum font-mono">{boundary} K</span> boundary,{' '}
        <strong className="text-ink">{nf(shareClean * 100, 0)}%</strong> of vegetation burns fall on the correct side —{' '}
        {nf(misread, 0)} of {nf(vegetationPoints.length, 0)} do not, and those are the ones worth reading by hand.
      </p>
      <p className="text-ink-faint mt-1 text-[11px]">
        Both axes are retrieved from the FIRMS dual-band signal. Neither uses a facility map, so this separation is
        measured rather than assumed.
      </p>
    </ChartFigure>
  )
}
