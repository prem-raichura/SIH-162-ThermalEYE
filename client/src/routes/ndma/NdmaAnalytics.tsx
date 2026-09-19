import { useMemo } from 'react'
import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { Activity, Clock, MapPin, Radio } from 'lucide-react'
import { PageHeader } from '@/components/shell/PageHeader'
import { Panel } from '@/components/panels/Panel'
import { StatTile } from '@/components/panels/StatTile'
import { DistributionDonut } from '@/components/panels/DistributionDonut'
import { TrendChart } from '@/components/panels/TrendChart'
import { EmptyState } from '@/components/panels/EmptyState'
import { useNdmaFeed } from './useNdmaData'
import { useNdma } from '@/store/useNdma'
import { ROUTE_LABEL, SEVERITY_LABEL, SEVERITY_ORDER } from '@/lib/severity'
import { CLASS_COLOR, SEVERITY_COLOR } from '@/lib/thermal'
import { AXIS, MARK, TOOLTIP_STYLE } from '@/lib/chart'
import { CLASS_LABELS } from '@/lib/classes'
import { nf, pctRaw } from '@/lib/format'
import type { Role } from '@/lib/roles'

const AGE_BUCKETS = [
  { label: '0–6 h', from: 0, to: 360 },
  { label: '6–12 h', from: 360, to: 720 },
  { label: '12–24 h', from: 720, to: 1440 },
  { label: '24–48 h', from: 1440, to: 2880 },
  { label: '48 h+', from: 2880, to: Number.POSITIVE_INFINITY },
]

/** What the feed looks like in aggregate: where incidents are, what they are, and how old. */
export function NdmaAnalytics({ role }: { role: Role }) {
  const feed = useNdmaFeed()
  const windowHours = useNdma((s) => s.windowHours)
  const config = useNdma((s) => s.config)
  const rows = feed.visible

  const byClass = useMemo(() => {
    const counts = new Map<string, number>()
    for (const a of rows) counts.set(a.sourceClass, (counts.get(a.sourceClass) ?? 0) + 1)
    return [...counts.entries()]
      .map(([cls, count]) => ({ cls, label: CLASS_LABELS[cls as keyof typeof CLASS_LABELS], count }))
      .sort((a, b) => b.count - a.count)
  }, [rows])

  const byState = useMemo(() => {
    const counts = new Map<string, number>()
    for (const a of rows) counts.set(a.state, (counts.get(a.state) ?? 0) + 1)
    return [...counts.entries()]
      .map(([state, count]) => ({ state, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10)
  }, [rows])

  // Buckets past the window would always read zero, which is an artefact of the filter rather
  // than a fact about the feed, so they are dropped.
  const byAge = useMemo(
    () =>
      AGE_BUCKETS.filter((bucket) => windowHours === 0 || bucket.from < windowHours * 60).map((bucket) => {
        const inBucket = rows.filter((a) => a.minutesAgo >= bucket.from && a.minutesAgo < bucket.to)
        return {
          bucket: bucket.label,
          high: inBucket.filter((a) => a.severity === 'high').length,
          medium: inBucket.filter((a) => a.severity === 'medium').length,
          low: inBucket.filter((a) => a.severity === 'low').length,
        }
      }),
    [rows, windowHours],
  )

  const medianDeviation = useMemo(() => {
    if (rows.length === 0) return 0
    const values = rows.map((a) => a.deviationPct).sort((a, b) => a - b)
    return values[Math.floor(values.length / 2)]
  }, [rows])

  const pagedShare = useMemo(() => {
    if (rows.length === 0) return 0
    const paged = rows.filter((a) => a.routing.route !== 'log_only').length
    return Math.round((paged / rows.length) * 100)
  }, [rows])

  const nonIndustrial = rows.filter((a) => a.branch === 'non_industrial').length

  if (rows.length === 0) {
    return (
      <div className="flex flex-col gap-4">
        <PageHeader
          role={role}
          eyebrow="Aggregate"
          title="Analytics"
          description="The shape of the response feed: composition, geography and how old the incidents in it are."
        />
        <Panel>
          <EmptyState
            title="Nothing in the current window"
            body="Widen the alert window on the incident map, or relax the confidence floor in Severity Settings."
          />
        </Panel>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        role={role}
        eyebrow="Aggregate"
        title="Analytics"
        description="The shape of the response feed: composition, geography and how old the incidents in it are."
        meta={[
          { label: 'Incidents', value: nf(rows.length) },
          { label: 'States', value: nf(new Set(rows.map((a) => a.state)).size) },
          { label: 'Median deviation', value: `+${nf(medianDeviation)}%` },
        ]}
      />

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatTile
          icon={Radio}
          label="Paged, not just logged"
          value={pctRaw(pagedShare)}
          caption="Share of the feed that reaches a control room"
          tone="warning"
        />
        <StatTile
          icon={Activity}
          label="Median deviation"
          value={`+${nf(medianDeviation)}%`}
          caption="Above each site's own normal ceiling"
        />
        <StatTile
          icon={MapPin}
          label="States with an incident"
          value={nf(new Set(rows.map((a) => a.state)).size)}
          caption={byState[0] ? `${byState[0].state} leads with ${nf(byState[0].count)}` : '—'}
        />
        <StatTile
          icon={Clock}
          label="Vegetation and waste"
          value={nf(nonIndustrial)}
          caption="Non-industrial branch inside the multi-hazard view"
          tone="good"
        />
      </div>

      <div className="grid gap-3 xl:grid-cols-[1fr_1.4fr]">
        <Panel title="Severity mix" subtitle="Under the configuration currently set">
          <DistributionDonut
            slices={SEVERITY_ORDER.map((severity) => ({
              label: SEVERITY_LABEL[severity],
              value: feed.counts[severity],
              color: SEVERITY_COLOR[severity],
            }))}
            centerLabel="Incidents"
            centerValue={nf(rows.length)}
          />

          <ul className="border-line divide-line mt-4 divide-y border-t pt-1">
            {SEVERITY_ORDER.map((severity) => (
              <li key={severity} className="flex items-center justify-between gap-3 py-2 text-[12.5px]">
                <span className="text-ink-soft">{SEVERITY_LABEL[severity]} routes to</span>
                <span>{ROUTE_LABEL[config.routing[severity]]}</span>
              </li>
            ))}
          </ul>
        </Panel>

        <Panel title="Incidents by source class" subtitle="Predicted class, never the register's class">
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={byClass} margin={{ top: 4, right: 8, bottom: 0, left: -18 }} barGap={MARK.barGap}>
              <CartesianGrid {...AXIS.grid} vertical={false} />
              <XAxis
                dataKey="label"
                tickLine={false}
                axisLine={{ stroke: AXIS.stroke }}
                tick={{ ...AXIS.tick, fontSize: 9.5 }}
                interval={0}
                angle={-32}
                textAnchor="end"
                height={70}
              />
              <YAxis tickLine={false} axisLine={false} tick={AXIS.tick} width={42} allowDecimals={false} />
              <Tooltip {...TOOLTIP_STYLE} formatter={(value) => [`${nf(Number(value))} alerts`, 'Incidents']} />
              <Bar dataKey="count" radius={MARK.barRadius} isAnimationActive={false}>
                {byClass.map((row) => (
                  <Cell key={row.cls} fill={CLASS_COLOR[row.cls] ?? 'var(--color-ink-faint)'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </Panel>
      </div>

      <div className="grid gap-3 xl:grid-cols-2">
        <Panel title="Age profile" subtitle="How long each tier has been sitting in the feed">
          <TrendChart
            data={byAge}
            xKey="bucket"
            series={[
              { key: 'high', label: 'High' },
              { key: 'medium', label: 'Medium' },
              { key: 'low', label: 'Low' },
            ]}
            height={240}
            unit="alerts"
          />
        </Panel>

        <Panel title="Top states" subtitle="Where the current incidents are">
          <ResponsiveContainer width="100%" height={240}>
            <BarChart
              data={byState}
              layout="vertical"
              margin={{ top: 4, right: 12, bottom: 0, left: 6 }}
              barGap={MARK.barGap}
            >
              <CartesianGrid {...AXIS.grid} horizontal={false} />
              <XAxis type="number" tickLine={false} axisLine={false} tick={AXIS.tick} allowDecimals={false} />
              <YAxis
                type="category"
                dataKey="state"
                tickLine={false}
                axisLine={{ stroke: AXIS.stroke }}
                tick={{ ...AXIS.tick, fontSize: 10 }}
                width={112}
              />
              <Tooltip {...TOOLTIP_STYLE} formatter={(value) => [`${nf(Number(value))} alerts`, 'Incidents']} />
              <Bar dataKey="count" fill={SEVERITY_COLOR.high} radius={[0, 4, 4, 0]} isAnimationActive={false} />
            </BarChart>
          </ResponsiveContainer>
        </Panel>
      </div>

      <p className="text-ink-faint text-[11.5px]">
        Counts follow the alert window and the severity policy currently set, so this page moves when the configuration
        does. Alert timings are deterministic stand-ins for satellite pass times; the deviation each one reports is
        measured against that site's own historical range.
      </p>
    </div>
  )
}
