import { useEffect, useMemo, useState } from 'react'
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { CloudSun, Radar, ShieldAlert, Timer } from 'lucide-react'
import { PageHeader } from '@/components/shell/PageHeader'
import { Panel } from '@/components/panels/Panel'
import { StatTile } from '@/components/panels/StatTile'
import { scoreHistogram, useNrscData } from './useNrscData'
import { loadDetections, meta } from '@/lib/data'
import { NON_CLAIMS, PREFERRED_WORDING } from '@/lib/nonClaims'
import { AXIS, CHART_CATEGORICAL, MARK, TOOLTIP_STYLE } from '@/lib/chart'
import { nf, pctRaw } from '@/lib/format'
import type { Detection } from '@/lib/types'
import type { Role } from '@/lib/roles'

const GAP_BINS = [
  { label: '0–7 d', from: 0, to: 8 },
  { label: '8–14 d', from: 8, to: 15 },
  { label: '15–21 d', from: 15, to: 22 },
  { label: '22–30 d', from: 22, to: 31 },
  { label: '31–45 d', from: 31, to: 46 },
  { label: '46 d+', from: 46, to: Number.POSITIVE_INFINITY },
]

/**
 * How good the evidence behind the layer actually is, and — because this is the role that
 * republishes — the section 32 non-claims in full, so the caveats travel with the data.
 */
export function NrscQuality({ role }: { role: Role }) {
  const { filtered, counts } = useNrscData()
  const [detections, setDetections] = useState<Detection[]>([])

  useEffect(() => {
    loadDetections().then(setDetections)
  }, [])

  const sar = useMemo(
    () => scoreHistogram(filtered.filter((s) => s.sentinel1Available).map((s) => s.sarQualityScore)),
    [filtered],
  )
  const optical = useMemo(
    () => scoreHistogram(filtered.filter((s) => s.sentinel2Available).map((s) => s.opticalQualityScore)),
    [filtered],
  )
  const cloud = useMemo(
    () => scoreHistogram(filtered.filter((s) => s.sentinel2Available).map((s) => s.cloudFraction)),
    [filtered],
  )
  const gaps = useMemo(
    () =>
      GAP_BINS.map((bin) => ({
        bucket: bin.label,
        count: filtered.filter((s) => s.temporalGapDays >= bin.from && s.temporalGapDays < bin.to).length,
      })),
    [filtered],
  )

  const sampled = useMemo(() => {
    const rows = new Map<string, { satellite: string; standard: number; nrt: number }>()
    for (const d of detections) {
      const row = rows.get(d.satellite) ?? { satellite: d.satellite, standard: 0, nrt: 0 }
      if (d.dataQuality === 'nrt') row.nrt += 1
      else row.standard += 1
      rows.set(d.satellite, row)
    }
    return [...rows.values()].sort((a, b) => b.standard + b.nrt - (a.standard + a.nrt))
  }, [detections])

  const share = (n: number) => (filtered.length === 0 ? 0 : Math.round((n / filtered.length) * 100))

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        role={role}
        eyebrow="Section 20 · Section 4"
        title="Data quality"
        description="What the evidence behind each record is worth: acquisition availability, usability scores, cloud, and the gap between the event and the nearest usable pass."
        meta={[
          { label: 'Records', value: nf(filtered.length) },
          { label: 'FIRMS holding', value: nf(meta.firms.totalDetections) },
          { label: 'Sampled', value: nf(detections.length) },
        ]}
      />

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatTile
          icon={Radar}
          label="Sentinel-1 available"
          value={pctRaw(share(counts.sentinel1))}
          caption={`${nf(counts.sentinel1)} records with a usable SAR pass`}
        />
        <StatTile
          icon={CloudSun}
          label="Sentinel-2 available"
          value={pctRaw(share(counts.sentinel2))}
          caption={`${nf(counts.sentinel2)} records with a usable optical scene`}
          tone="warning"
        />
        <StatTile
          icon={Timer}
          label="Within a week"
          value={pctRaw(share(filtered.filter((s) => s.temporalGapDays <= 7).length))}
          caption="Nearest usable acquisition inside 7 days"
        />
        <StatTile
          icon={ShieldAlert}
          label="NRT rows"
          value={nf(counts.nrt)}
          caption="Carried for coverage, never for baselines"
          tone="critical"
        />
      </div>

      <div className="grid gap-3 xl:grid-cols-2">
        <Panel title="SAR quality score" subtitle="Records with a Sentinel-1 acquisition only (section 10)">
          <Histogram data={sar} xKey="bucket" color={CHART_CATEGORICAL[0]} />
        </Panel>
        <Panel title="Optical quality score" subtitle="Records with a Sentinel-2 acquisition only (section 9)">
          <Histogram data={optical} xKey="bucket" color={CHART_CATEGORICAL[2]} />
        </Panel>
        <Panel title="Cloud fraction" subtitle="Of the nearest optical scene — the reason optical so often drops out">
          <Histogram data={cloud} xKey="bucket" color={CHART_CATEGORICAL[3]} />
        </Panel>
        <Panel title="Temporal gap" subtitle="Days between the event and the nearest usable acquisition">
          <Histogram data={gaps} xKey="bucket" color={CHART_CATEGORICAL[4]} />
        </Panel>
      </div>

      <Panel
        title="NRT and standard quality"
        subtitle="The NOAA-20/21 split of section 4, carried on every row as data_quality"
      >
        <div className="panel-scroll overflow-auto overscroll-contain">
          <table className="w-full min-w-[520px] text-[12.5px]">
            <thead className="text-ink-faint text-[10.5px] [&_th]:border-line [&_th]:border-b">
              <tr>
                <th className="py-2 pr-3 text-left font-normal">Satellite</th>
                <th className="px-3 py-2 text-left font-normal">Instrument</th>
                <th className="px-3 py-2 text-left font-normal">Years</th>
                <th className="px-3 py-2 text-right font-normal">Detections collected</th>
                <th className="py-2 pl-3 text-right font-normal">Quality</th>
              </tr>
            </thead>
            <tbody className="divide-line divide-y">
              {meta.firms.satellites.map((sat) => (
                <tr key={sat.satellite}>
                  <td className="py-2 pr-3">{sat.satellite}</td>
                  <td className="px-3 py-2">{sat.instrument}</td>
                  <td className="tnum px-3 py-2 font-mono text-[11.5px]">{sat.years}</td>
                  <td className="tnum px-3 py-2 text-right font-mono text-[11.5px]">{nf(sat.detections)}</td>
                  <td className="py-2 pl-3 text-right">
                    <span
                      className="rounded-full px-2 py-0.5 text-[10.5px]"
                      style={{
                        backgroundColor: sat.quality === 'nrt' ? 'var(--color-amber-dim)' : 'var(--color-forest-dim)',
                        color: sat.quality === 'nrt' ? 'var(--color-amber)' : 'var(--color-forest)',
                      }}
                    >
                      {sat.quality === 'nrt' ? 'NRT' : 'Standard'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="text-ink-soft mt-3 space-y-2 text-[12.5px]">
          <p>{meta.firms.note}</p>
          <p>{meta.firms.caveat}</p>
        </div>

        {sampled.length > 0 && (
          <div className="border-line mt-3 border-t pt-3">
            <p className="text-[12.5px] font-medium">In the demo sample</p>
            <p className="text-ink-faint mt-0.5 text-[11.5px]">
              The {nf(detections.length)} detections shipped with this build keep the same satellite mix, so the NRT
              share on screen matches the holding it stands in for.
            </p>
            <ul className="text-ink-soft mt-2 flex flex-wrap gap-x-5 gap-y-1 text-[12px]">
              {sampled.map((row) => (
                <li key={row.satellite}>
                  {row.satellite} <span className="tnum font-mono">{nf(row.standard + row.nrt)}</span>
                  {row.nrt > 0 && <span className="text-amber"> · NRT</span>}
                </li>
              ))}
            </ul>
          </div>
        )}
      </Panel>

      <Panel title="Non-claims" subtitle="Section 32 — what this layer must never be said to show">
        <ul className="grid gap-x-8 gap-y-2 md:grid-cols-2">
          {NON_CLAIMS.map((claim) => (
            <li key={claim} className="text-ink-soft flex gap-2 text-[12.5px]">
              <span className="text-terracotta mt-[3px] shrink-0 text-[11px]">✕</span>
              <span>{claim}</span>
            </li>
          ))}
        </ul>
        <blockquote className="border-teal-deep bg-paper-deep mt-4 rounded-r-[10px] border-l-2 px-4 py-3 text-[13px]">
          <p className="text-ink-faint text-[10px] tracking-[0.1em] uppercase">Preferred wording</p>
          <p className="mt-1.5">{PREFERRED_WORDING}</p>
        </blockquote>
      </Panel>
    </div>
  )
}

function Histogram({
  data,
  xKey,
  color,
}: {
  data: { bucket: string; count: number }[]
  xKey: string
  color: string
}) {
  return (
    <ResponsiveContainer width="100%" height={210}>
      <BarChart data={data} margin={{ top: 4, right: 8, bottom: 0, left: -6 }} barGap={MARK.barGap}>
        <CartesianGrid {...AXIS.grid} vertical={false} />
        <XAxis
          dataKey={xKey}
          tickLine={false}
          axisLine={{ stroke: AXIS.stroke }}
          tick={{ ...AXIS.tick, fontSize: 9.5 }}
          interval={0}
        />
        <YAxis tickLine={false} axisLine={false} tick={AXIS.tick} width={46} allowDecimals={false} />
        <Tooltip {...TOOLTIP_STYLE} formatter={(value) => [`${nf(Number(value))} records`, 'Count']} />
        <Bar dataKey="count" fill={color} radius={MARK.barRadius} isAnimationActive={false} />
      </BarChart>
    </ResponsiveContainer>
  )
}
