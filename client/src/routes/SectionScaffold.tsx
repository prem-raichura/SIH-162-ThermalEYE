import { useMemo, useState } from 'react'
import { Factory, Flame, Radar, ThermometerSun } from 'lucide-react'
import { PageHeader } from '@/components/shell/PageHeader'
import { ThermalMap } from '@/components/map/ThermalMap'
import { Panel } from '@/components/panels/Panel'
import { StatTile } from '@/components/panels/StatTile'
import { SiteTable } from '@/components/panels/SiteTable'
import { CoverageCaveat, RankedQueue } from '@/components/panels/RankedQueue'
import { DistributionDonut } from '@/components/panels/DistributionDonut'
import { CoverageAudit } from '@/components/panels/CoverageAudit'
import { AlertStream } from '@/components/panels/AlertStream'
import { SiteCard } from '@/components/panels/SiteCard'
import { EmptyState } from '@/components/panels/EmptyState'
import { SiteDetailDrawer } from '@/components/panels/SiteDetailDrawer'
import { EvidenceReportDialog } from '@/components/panels/EvidenceReportDialog'
import type { Role } from '@/lib/roles'
import { useActiveSettings } from '@/store/useRoleSettings'
import { alerts as allAlerts, sites as allSites, siteById, unmapped } from '@/lib/data'
import { CLASS_COLOR } from '@/lib/thermal'
import { istClock, istDate, nf } from '@/lib/format'
import { useFilters } from '@/store/useFilters'

/**
 * Shared composition used until each role plan (07-14) replaces it with its own dashboard.
 * It runs the real map, tables and panels against the role's own slice of the data.
 */
export function SectionScaffold({
  role,
  section,
  note,
  withMap,
}: {
  role: Role
  section: string
  note: string
  withMap: boolean
}) {
  const [reportFor, setReportFor] = useState<string | null>(null)
  const selectSite = useFilters((s) => s.selectSite)
  const selectUnmapped = useFilters((s) => s.selectUnmapped)
  const selectedSiteId = useFilters((s) => s.selectedSiteId)
  const openDetail = useFilters((s) => s.openDetail)
  const selected = siteById(selectedSiteId)

  const sites = useMemo(
    () => (role.classFilter === 'all' ? allSites : allSites.filter((s) => role.classFilter.includes(s.class))),
    [role],
  )
  const siteIds = useMemo(() => new Set(sites.map((s) => s.id)), [sites])
  const roleAlerts = useMemo(() => allAlerts.filter((a) => siteIds.has(a.siteId)), [siteIds])

  const active = useActiveSettings()
  const longBurningDays = 'longBurningDays' in active ? active.longBurningDays : 365

  const stats = useMemo(() => {
    const abnormal = sites.filter((s) => s.behaviour === 'abnormal').length
    const persistent = sites.filter((s) => s.persistenceDays > longBurningDays).length
    const withTemp = sites.filter((s) => s.tHot !== null)
    const meanT = withTemp.length
      ? Math.round(withTemp.reduce((a, s) => a + (s.tHot ?? 0), 0) / withTemp.length)
      : 0
    return { abnormal, persistent, meanT }
  }, [sites, longBurningDays])

  const classSlices = useMemo(() => {
    const counts = new Map<string, number>()
    for (const s of sites) counts.set(s.predictedLabel, (counts.get(s.predictedLabel) ?? 0) + 1)
    const ordered = [...counts.entries()].sort((a, b) => b[1] - a[1])
    const head = ordered.slice(0, 5)
    const tail = ordered.slice(5).reduce((a, [, v]) => a + v, 0)
    const colorFor = (label: string) =>
      CLASS_COLOR[sites.find((s) => s.predictedLabel === label)?.predictedClass ?? 'other_industrial']
    const slices = head.map(([label, value]) => ({ label, value, color: colorFor(label) }))
    return tail > 0 ? [...slices, { label: 'Other', value: tail, color: 'var(--color-ink-faint)' }] : slices
  }, [sites])

  if (!withMap) {
    return (
      <div className="flex flex-col gap-4">
        <PageHeader role={role} eyebrow={role.short} title={section} description={role.remit} />
        <Panel>
          <p className="text-ink-soft mx-auto max-w-[56ch] py-8 text-center text-[13.5px]">{note}</p>
        </Panel>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        role={role}
        eyebrow={role.short}
        title={section}
        description={role.remit}
        meta={[
          { label: 'Date', value: istDate() },
          { label: 'Time (IST)', value: istClock() },
          { label: 'Sites in view', value: nf(sites.length) },
        ]}
        action="Generate report"
        onAction={() => {
          const target = selectedSiteId ?? sites[0]?.id ?? null
          setReportFor(target)
        }}
      />

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatTile icon={Factory} label="Sites monitored" value={nf(sites.length)} caption="In this role's class filter" />
        <StatTile
          icon={ThermometerSun}
          label="Mean source temperature"
          value={nf(stats.meanT)}
          unit="K"
          caption="Dual-band retrieval across the set"
        />
        <StatTile
          icon={Radar}
          label="Persistent over a year"
          value={nf(stats.persistent)}
          caption="Detected across more than 365 days"
          tone="good"
        />
        <StatTile
          icon={Flame}
          label="Abnormal now"
          value={nf(stats.abnormal)}
          caption="Above each site's own normal range"
          tone={stats.abnormal > 0 ? 'critical' : 'neutral'}
        />
      </div>

      <ThermalMap role={role} sites={sites} className="h-[420px] xl:h-[500px]" />

      <div className="grid gap-3 xl:grid-cols-[1.4fr_1fr]">
        <Panel title="Sites" subtitle="Select a row to fly the map and fill the card beside it">
          <SiteTable
            sites={sites}
            columns={['name', 'state', 'tHot', 'frpMean', 'persistence', 'status']}
            maxHeight={420}
            selectedId={selectedSiteId}
            onRowClick={(site) => {
              selectSite(site.id)
            }}
          />
        </Panel>

        <div className="flex flex-col gap-3">
          <Panel title="Selected site">
            {selected ? (
              <SiteCard site={selected} onOpenDetail={openDetail} />
            ) : (
              <EmptyState
                title="Nothing selected yet"
                body="Click a point on the map or a row in the table to see its readings."
              />
            )}
          </Panel>
          <Panel title="Classes in view">
            <DistributionDonut slices={classSlices} centerLabel="sites" centerValue={nf(sites.length)} />
          </Panel>
          <Panel title="Live alerts" subtitle="Current behaviour against each site's own baseline">
            <AlertStream
              alerts={roleAlerts}
              limit={4}
              onSelect={(alert) => {
                selectSite(alert.siteId)
              }}
            />
          </Panel>
        </div>
      </div>

      <Panel title="Persistent unmapped thermal sources" subtitle="Ranked by persistence and retrieved temperature">
        <CoverageCaveat />
        <div className="mt-3">
          <RankedQueue
            rows={unmapped}
            limit={8}
            maxHeight={300}
            onSelect={(row) => {
              selectUnmapped(row.id)
            }}
          />
        </div>
      </Panel>

      <Panel title="Facility coverage audit" subtitle="Persistent thermal sites with a mapped facility within 1 km">
        <CoverageAudit />
      </Panel>

      <SiteDetailDrawer onGenerateReport={setReportFor} />
      <EvidenceReportDialog siteId={reportFor} open={reportFor !== null} onOpenChange={(o) => !o && setReportFor(null)} />
    </div>
  )
}
