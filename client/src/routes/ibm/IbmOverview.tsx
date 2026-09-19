import { useMemo, useState } from 'react'
import { Mountain, Radar, Timer, TriangleAlert } from 'lucide-react'
import { PageHeader } from '@/components/shell/PageHeader'
import { ThermalMap } from '@/components/map/ThermalMap'
import { Panel, PanelLink } from '@/components/panels/Panel'
import { StatTile } from '@/components/panels/StatTile'
import { SiteTable } from '@/components/panels/SiteTable'
import { SiteCard } from '@/components/panels/SiteCard'
import { EmptyState } from '@/components/panels/EmptyState'
import { RankedQueue } from '@/components/panels/RankedQueue'
import { SiteDetailDrawer } from '@/components/panels/SiteDetailDrawer'
import { EvidenceReportDialog } from '@/components/panels/EvidenceReportDialog'
import { candidateRank, fireSubtype, useIbmSites } from './useIbmData'
import { useFilters } from '@/store/useFilters'
import { logLine } from '@/store/useConsole'
import { siteById } from '@/lib/data'
import { istClock, istDate, nf } from '@/lib/format'
import { useNavigate } from 'react-router-dom'
import type { Role } from '@/lib/roles'

export function IbmOverview({ role }: { role: Role }) {
  const navigate = useNavigate()
  const { filtered, candidates } = useIbmSites()
  const selectSite = useFilters((s) => s.selectSite)
  const selectUnmapped = useFilters((s) => s.selectUnmapped)
  const openDetail = useFilters((s) => s.openDetail)
  const selectedSiteId = useFilters((s) => s.selectedSiteId)
  const selected = siteById(selectedSiteId)
  const [reportFor, setReportFor] = useState<string | null>(null)

  const stats = useMemo(() => {
    const seam = filtered.filter((s) => fireSubtype(s) === 'coal-seam-like').length
    const highPersistence = filtered.filter((s) => s.persistenceDays > 365).length
    const abnormal = filtered.filter((s) => s.behaviour === 'abnormal').length
    return { seam, highPersistence, abnormal }
  }, [filtered])

  const ranked = useMemo(() => candidateRank(candidates), [candidates])

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        role={role}
        eyebrow="Mining overview"
        title="Mine fires and persistent heat"
        description="Coal-seam and waste-dump fires burn for years and no register tracks them over time. This does."
        meta={[
          { label: 'Date', value: istDate() },
          { label: 'Time (IST)', value: istClock() },
          { label: 'Mine sites', value: nf(filtered.length) },
          { label: 'Candidates', value: nf(ranked.length) },
        ]}
        action="Generate report"
        onAction={() => {
          const target = selectedSiteId ?? filtered[0]?.id ?? null
          setReportFor(target)
          logLine(role.id, 'Evidence report generated from the overview')
        }}
      />

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatTile icon={Mountain} label="Known mine sites" value={nf(filtered.length)} caption="Mapped to OSM or a register" />
        <StatTile
          icon={Radar}
          label="Unmapped candidates"
          value={nf(ranked.length)}
          caption="Persistent heat on bare or built-up ground"
          tone="warning"
        />
        <StatTile
          icon={Timer}
          label="Burning over a year"
          value={nf(stats.highPersistence)}
          caption="Sustained beyond 365 days"
          tone="critical"
        />
        <StatTile
          icon={TriangleAlert}
          label="Seam-fire signature"
          value={nf(stats.seam)}
          caption="Long persistence with night activity"
        />
      </div>

      <ThermalMap role={role} sites={filtered} unmapped={candidates} className="h-[420px] xl:h-[560px]" />

      <div className="grid gap-3 xl:grid-cols-[1.5fr_1fr]">
        <div className="relative min-h-[380px]">
          <Panel
            title="Mine sites"
            subtitle="Ranked by how long the heat has persisted"
            action={<PanelLink onClick={() => navigate('/ibm/sites')}>Open site list</PanelLink>}
            className="absolute inset-0"
          >
            <SiteTable
              sites={[...filtered].sort((a, b) => b.persistenceDays - a.persistenceDays)}
              columns={['name', 'state', 'tHot', 'persistence', 'activeDays', 'nightRatio', 'status']}
              fill
              selectedId={selectedSiteId}
              onRowClick={(site) => {
                selectSite(site.id)
                logLine(role.id, `Selected ${site.name} — ${site.state}`)
              }}
            />
          </Panel>
        </div>

        <div className="flex flex-col gap-3">
          <Panel title="Selected site">
            {selected ? (
              <SiteCard site={selected} onOpenDetail={openDetail} />
            ) : (
              <EmptyState
                title="Nothing selected yet"
                body="Click a point on the map or a row in the table. The full record opens from here."
              />
            )}
          </Panel>

          <Panel
            title="Unmapped candidates"
            subtitle="Persistent heat with no mine within 1 km"
            action={<PanelLink onClick={() => navigate('/ibm/unmapped')}>View all</PanelLink>}
          >
            <RankedQueue
              rows={ranked}
              limit={5}
              showAssessment={false}
              maxHeight={220}
              onSelect={(row) => {
                selectUnmapped(row.id)
                logLine(role.id, `Selected candidate #${row.rank} — ${row.state}`)
              }}
            />
          </Panel>
        </div>
      </div>

      <SiteDetailDrawer role={role} onGenerateReport={setReportFor} />
      <EvidenceReportDialog siteId={reportFor} open={reportFor !== null} onOpenChange={(o) => !o && setReportFor(null)} />
    </div>
  )
}
