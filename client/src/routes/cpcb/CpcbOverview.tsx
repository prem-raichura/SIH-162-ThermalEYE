import { useMemo, useState } from 'react'
import { AlertTriangle, Factory, Radar, ThermometerSun } from 'lucide-react'
import { PageHeader } from '@/components/shell/PageHeader'
import { ThermalMap } from '@/components/map/ThermalMap'
import { Panel, PanelLink } from '@/components/panels/Panel'
import { StatTile } from '@/components/panels/StatTile'
import { DistributionDonut } from '@/components/panels/DistributionDonut'
import { RankedQueue } from '@/components/panels/RankedQueue'
import { SiteTable } from '@/components/panels/SiteTable'
import { SiteCard } from '@/components/panels/SiteCard'
import { EmptyState } from '@/components/panels/EmptyState'
import { SiteDetailDrawer } from '@/components/panels/SiteDetailDrawer'
import { EvidenceReportDialog } from '@/components/panels/EvidenceReportDialog'
import { useCpcbSites, useUnmappedQueue } from './useCpcbData'
import { useFilters } from '@/store/useFilters'
import { siteById } from '@/lib/data'
import { useSettings, formatTemp } from '@/store/useSettings'
import { logLine } from '@/store/useConsole'
import { CLASS_COLOR } from '@/lib/thermal'
import { istClock, istDate, nf } from '@/lib/format'
import { useNavigate } from 'react-router-dom'
import type { Role } from '@/lib/roles'

export function CpcbOverview({ role }: { role: Role }) {
  const navigate = useNavigate()
  const { filtered } = useCpcbSites()
  const unmapped = useUnmappedQueue()
  const units = useSettings((s) => s.units)
  const selectSite = useFilters((s) => s.selectSite)
  const selectUnmapped = useFilters((s) => s.selectUnmapped)
  const selectedSiteId = useFilters((s) => s.selectedSiteId)
  const openDetail = useFilters((s) => s.openDetail)
  const selected = siteById(selectedSiteId)
  const [reportFor, setReportFor] = useState<string | null>(null)

  const stats = useMemo(() => {
    const mapped = filtered.filter((s) => s.registerSource !== 'none').length
    const highPriority = unmapped.filter((u) => u.assessment === 'industrial-like' && u.persistenceDays > 180).length
    const withTemp = filtered.filter((s) => s.tHot !== null)
    const meanT = withTemp.length ? Math.round(withTemp.reduce((a, s) => a + (s.tHot ?? 0), 0) / withTemp.length) : 0
    const abnormal = filtered.filter((s) => s.behaviour === 'abnormal').length
    return { mapped, highPriority, meanT, abnormal }
  }, [filtered, unmapped])

  const classSlices = useMemo(() => {
    const counts = new Map<string, { value: number; color: string }>()
    for (const s of filtered) {
      const row = counts.get(s.predictedLabel) ?? { value: 0, color: CLASS_COLOR[s.predictedClass] }
      row.value += 1
      counts.set(s.predictedLabel, row)
    }
    const ordered = [...counts.entries()].sort((a, b) => b[1].value - a[1].value)
    const head = ordered.slice(0, 5).map(([label, row]) => ({ label, value: row.value, color: row.color }))
    const tail = ordered.slice(5).reduce((a, [, row]) => a + row.value, 0)
    return tail > 0 ? [...head, { label: 'Other', value: tail, color: 'var(--color-ink-faint)' }] : head
  }, [filtered])

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        role={role}
        eyebrow="National overview"
        title="Industrial thermal sites"
        description="Persistent industrial heat across India, with the sources no register lists yet."
        meta={[
          { label: 'Date', value: istDate() },
          { label: 'Time (IST)', value: istClock() },
          { label: 'Sites in view', value: nf(filtered.length) },
          { label: 'Unmapped queue', value: nf(unmapped.length) },
        ]}
        action="Generate report"
        onAction={() => {
          const target = selectedSiteId ?? filtered[0]?.id ?? null
          setReportFor(target)
          logLine(role.id, 'Evidence report opened from the overview')
        }}
      />

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatTile
          icon={Factory}
          label="Mapped industrial sites"
          value={nf(stats.mapped)}
          caption="Matched to OSM or an authoritative register"
        />
        <StatTile
          icon={Radar}
          label="Unmapped candidates"
          value={nf(unmapped.length)}
          caption="Persistent heat with no facility within 1 km"
          tone="warning"
        />
        <StatTile
          icon={AlertTriangle}
          label="High priority"
          value={nf(stats.highPriority)}
          caption="Industrial-like and persistent beyond 180 days"
          tone="critical"
        />
        <StatTile
          icon={ThermometerSun}
          label="Mean source temperature"
          value={formatTemp(stats.meanT, units).split(' ')[0]}
          unit={units === 'C' ? '°C' : 'K'}
          caption="Dual-band retrieval across sites in view"
        />
      </div>

      <div className="grid gap-3 xl:grid-cols-[1.55fr_1fr]">
        <ThermalMap role={role} sites={filtered} unmapped={unmapped} className="min-h-[520px]" />

        <div className="flex min-w-0 flex-col gap-3">
          <Panel title="Facilities by type" subtitle="Predicted class across the sites in view">
            <DistributionDonut slices={classSlices} centerLabel="sites" centerValue={nf(filtered.length)} height={152} />
          </Panel>

          <Panel
            title="Top unmapped sources"
            subtitle="Ranked by persistence and retrieved temperature"
            action={<PanelLink onClick={() => navigate('/cpcb/unmapped')}>View all</PanelLink>}
            className="min-h-0 flex-1"
          >
            <RankedQueue
              rows={unmapped}
              limit={6}
              maxHeight={252}
              showAssessment={false}
              onSelect={(row) => {
                selectUnmapped(row.id)
                logLine(role.id, `Selected unmapped candidate #${row.rank} — ${row.state}`)
              }}
            />
          </Panel>
        </div>
      </div>

      <div className="grid gap-3 xl:grid-cols-[1.5fr_1fr]">
        <div className="relative min-h-[380px]">
          <Panel
            title="Recent industrial events"
            subtitle="Most recently detected sites in the current filter"
            action={<PanelLink onClick={() => navigate('/cpcb/sites')}>Open site list</PanelLink>}
            className="absolute inset-0"
          >
            <SiteTable
              sites={[...filtered].sort((a, b) => (b.lastDetection ?? '').localeCompare(a.lastDetection ?? ''))}
              columns={['name', 'class', 'state', 'tHot', 'frpDensity', 'persistence', 'lastDetection', 'status']}
              fill
              selectedId={selectedSiteId}
              onRowClick={(site) => {
                selectSite(site.id)
                logLine(role.id, `Selected ${site.name} — ${site.predictedLabel}, ${site.state}`)
              }}
            />
          </Panel>
        </div>

        <div>
          <Panel title="Selected site" subtitle="Readings for whatever is picked on the map or in the table">
            {selected ? (
              <SiteCard site={selected} onOpenDetail={openDetail} />
            ) : (
              <EmptyState
                title="Nothing selected yet"
                body="Click a point on the map or a row in the table. The full record opens from here."
              />
            )}
          </Panel>
        </div>
      </div>

      <SiteDetailDrawer role={role} onGenerateReport={setReportFor} />
      <EvidenceReportDialog siteId={reportFor} open={reportFor !== null} onOpenChange={(o) => !o && setReportFor(null)} />
    </div>
  )
}
