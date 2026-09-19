import { AlertOctagon, CheckCircle2, Cpu, Database, GitBranch } from 'lucide-react'
import { PageHeader } from '@/components/shell/PageHeader'
import { Panel } from '@/components/panels/Panel'
import { StatTile } from '@/components/panels/StatTile'
import { meta, sourceReport } from '@/lib/data'
import { STATUS } from '@/lib/chart'
import { nf } from '@/lib/format'
import type { Role } from '@/lib/roles'

const RISK_STYLE: Record<string, { color: string; bg: string }> = {
  none: { color: STATUS.good, bg: 'var(--color-forest-dim)' },
  low: { color: STATUS.good, bg: 'var(--color-forest-dim)' },
  medium: { color: STATUS.warning, bg: 'var(--color-amber-dim)' },
  high: { color: STATUS.critical, bg: 'var(--color-terra-dim)' },
}

const COUNT_LABEL: Record<string, string> = {
  sites: 'Thermal sites',
  unmapped: 'Unmapped candidates',
  detections: 'Detections',
  series: 'Baseline series',
  alerts: 'Alerts',
  states: 'State polygons',
  districts: 'District polygons',
}

/** Milestones, build provenance and what the shipped data actually contains. */
export function AdminSystem({ role }: { role: Role }) {
  const blocked = sourceReport.milestones.filter((m) => m.risk === 'high').length
  const counts = Object.entries(meta.counts)

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        role={role}
        eyebrow="Build"
        title="System"
        description="The delivery milestones with what each one depends on, and the exact contents of the data this build was compiled against."
        meta={[
          { label: 'Milestones', value: nf(sourceReport.milestones.length) },
          { label: 'High risk', value: nf(blocked) },
          { label: 'Seed', value: meta.seed },
        ]}
      />

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatTile icon={GitBranch} label="Milestones" value={nf(sourceReport.milestones.length)} caption="M1 through M4" />
        <StatTile
          icon={AlertOctagon}
          label="High-risk milestones"
          value={nf(blocked)}
          caption="All of it sits on Copernicus access"
          tone={blocked > 0 ? 'critical' : 'good'}
        />
        <StatTile icon={Database} label="Sites in the build" value={nf(meta.counts.sites)} caption="From the registers and OSM" />
        <StatTile
          icon={Cpu}
          label="Detections shipped"
          value={nf(meta.counts.detections)}
          caption={`Sampled from ${nf(meta.firms.totalDetections)} collected`}
        />
      </div>

      <Panel title="Milestones" subtitle="Section 23 — what each stage needs before it can start">
        <ul className="divide-line divide-y">
          {sourceReport.milestones.map((milestone) => {
            const style = RISK_STYLE[milestone.risk] ?? RISK_STYLE.medium
            return (
              <li key={milestone.id} className="py-3">
                <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                  <p className="text-[13px] font-medium">
                    {milestone.id} · {milestone.name}
                  </p>
                  <span
                    className="rounded-full px-2 py-0.5 text-[10.5px]"
                    style={{ backgroundColor: style.bg, color: style.color }}
                  >
                    {milestone.risk === 'none' ? 'no risk' : `${milestone.risk} risk`}
                  </span>
                  <span className="text-ink-faint ml-auto text-[11.5px]">{milestone.status}</span>
                </div>
                <p className="text-ink-soft mt-1 text-[12.5px]">{milestone.scope}</p>
                <p className="text-ink-faint mt-0.5 text-[11.5px]">
                  Depends on: {milestone.dependency === 'none' ? 'nothing outstanding' : milestone.dependency}
                </p>
              </li>
            )
          })}
        </ul>
      </Panel>

      <div className="grid gap-3 xl:grid-cols-2">
        <Panel title="Shipped data" subtitle="Record counts per generated file">
          <ul className="divide-line divide-y">
            {counts.map(([key, value]) => (
              <li key={key} className="flex items-center justify-between gap-4 py-2 text-[12.5px]">
                <span>{COUNT_LABEL[key] ?? key}</span>
                <span className="tnum font-mono">{nf(value)}</span>
              </li>
            ))}
          </ul>
        </Panel>

        <Panel title="Build provenance" subtitle="How this data came to exist">
          <dl className="divide-line divide-y text-[12.5px]">
            <Row label="Generated from" value={meta.generatedFrom} />
            <Row label="PRNG seed" value={meta.seed} />
            <Row label="Observation window" value={`${meta.windowStart} to ${meta.windowEnd}`} />
            <Row label="FIRMS holding" value={`${nf(meta.firms.totalDetections)} detections`} />
            <Row label="Registers" value={`${nf(meta.realSources.ppacRefineries)} PPAC · ${nf(meta.realSources.wriThermalPlants)} WRI · ${nf(meta.realSources.gemCoalPlants)} GEM`} />
            <Row label="Validation sites" value={nf(meta.realSources.validationSites)} />
          </dl>
          <p className="text-ink-soft mt-3 flex items-start gap-2 text-[12px]">
            <CheckCircle2 size={14} strokeWidth={1.8} className="mt-0.5 shrink-0" style={{ color: STATUS.good }} />
            Identity, coordinates, capacities and register counts are read from the collected dataset. Thermal series,
            model metrics and alert timings come from a fixed seed, so regenerating produces a byte-identical build.
          </p>
        </Panel>
      </div>
    </div>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-6 py-2">
      <dt className="text-ink-soft shrink-0">{label}</dt>
      <dd className="tnum text-right font-mono text-[11.5px]">{value}</dd>
    </div>
  )
}
