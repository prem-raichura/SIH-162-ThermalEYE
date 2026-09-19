import { useMemo } from 'react'
import { AlertOctagon, CheckCircle2, CircleDot, Database } from 'lucide-react'
import { PageHeader } from '@/components/shell/PageHeader'
import { Panel } from '@/components/panels/Panel'
import { StatTile } from '@/components/panels/StatTile'
import { sourceReport } from '@/lib/data'
import { STATUS } from '@/lib/chart'
import { nf } from '@/lib/format'
import type { SourceStatus } from '@/lib/types'
import type { Role } from '@/lib/roles'

const STATUS_STYLE = {
  DONE: { color: STATUS.good, bg: 'var(--color-forest-dim)', icon: CheckCircle2, label: 'Collected' },
  MANUAL: { color: STATUS.warning, bg: 'var(--color-amber-dim)', icon: CircleDot, label: 'Manual step' },
  BLOCKED: { color: STATUS.critical, bg: 'var(--color-terra-dim)', icon: AlertOctagon, label: 'Blocked' },
} as const

/** The data-source board, straight from dataset/SOURCES.md by way of sources.json. */
export function AdminSources({ role }: { role: Role }) {
  const byStatus = useMemo(() => {
    const groups: Record<SourceStatus['status'], SourceStatus[]> = { DONE: [], MANUAL: [], BLOCKED: [] }
    for (const row of sourceReport.sources) groups[row.status].push(row)
    return groups
  }, [])

  const tiers = useMemo(() => [...new Set(sourceReport.sources.map((s) => s.tier))], [])

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        role={role}
        eyebrow="Inventory"
        title="Data sources"
        description="What is actually in hand, what needs a manual step, and what is blocked. The statuses are the ones recorded in the dataset's own source notes."
        meta={[
          { label: 'Requirements', value: nf(sourceReport.sources.length) },
          { label: 'Collected', value: nf(byStatus.DONE.length) },
          { label: 'Blocked', value: nf(byStatus.BLOCKED.length) },
        ]}
      />

      <div className="grid gap-3 sm:grid-cols-3">
        <StatTile
          icon={CheckCircle2}
          label="Collected"
          value={nf(byStatus.DONE.length)}
          caption="Data is on disk and usable"
          tone="good"
        />
        <StatTile
          icon={CircleDot}
          label="Manual step"
          value={nf(byStatus.MANUAL.length)}
          caption="Obtainable, needs a person to fetch it"
          tone="warning"
        />
        <StatTile
          icon={AlertOctagon}
          label="Blocked"
          value={nf(byStatus.BLOCKED.length)}
          caption="Waiting on access that is not granted yet"
          tone="critical"
        />
      </div>

      {tiers.map((tier) => (
        <Panel key={tier} title={tier} subtitle={`${nf(sourceReport.sources.filter((s) => s.tier === tier).length)} requirements`}>
          <ul className="divide-line divide-y">
            {sourceReport.sources
              .filter((s) => s.tier === tier)
              .map((row) => {
                const style = STATUS_STYLE[row.status]
                const Icon = style.icon
                return (
                  <li key={row.requirement} className="flex items-start gap-3 py-2.5">
                    <span
                      className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full"
                      style={{ backgroundColor: style.bg, color: style.color }}
                    >
                      <Icon size={14} strokeWidth={1.9} />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-[13px] font-medium">{row.requirement}</p>
                      <p className="text-ink-soft mt-0.5 text-[12px]">{row.detail}</p>
                    </div>
                    <span
                      className="shrink-0 rounded-full px-2 py-0.5 text-[10.5px]"
                      style={{ backgroundColor: style.bg, color: style.color }}
                    >
                      {row.status}
                    </span>
                  </li>
                )
              })}
          </ul>
        </Panel>
      ))}

      <Panel title="Why Sentinel is the one that hurts" subtitle="It gates the ablations, not the spine">
        <p className="text-ink-soft flex items-start gap-2 text-[12.5px]">
          <Database size={15} strokeWidth={1.8} className="mt-0.5 shrink-0" />
          Everything the thermal spine needs — FIRMS, OSM, the registers, the boundaries — is collected. The blocked rows
          are Copernicus-side, which is why milestone M4 carries the only high risk on the board and why ablations C to F
          are reported as pending rather than as results.
        </p>
      </Panel>
    </div>
  )
}
