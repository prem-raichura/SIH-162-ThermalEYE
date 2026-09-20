import { useMemo, useState } from 'react'
import { ThermalMap } from '@/components/map/ThermalMap'
import { MapConsole } from '@/components/map/MapConsole'
import { MapDock } from '@/components/map/MapDock'
import { ReadingsStrip, type Reading } from '@/components/map/ReadingsStrip'
import { Panel, PanelLink } from '@/components/panels/Panel'
import { RankedQueue } from '@/components/panels/RankedQueue'
import { SiteCard } from '@/components/panels/SiteCard'
import { EmptyState } from '@/components/panels/EmptyState'
import { SiteDetailDrawer } from '@/components/panels/SiteDetailDrawer'
import { EvidenceReportDialog } from '@/components/panels/EvidenceReportDialog'
import { useCpcbSites, useUnmappedQueue } from './useCpcbData'
import { useFilters } from '@/store/useFilters'
import { siteById } from '@/lib/data'
import { logLine } from '@/store/useConsole'
import { nf } from '@/lib/format'
import { useNavigate } from 'react-router-dom'
import type { Role } from '@/lib/roles'

const TABLE_HINT = 'The full site list is on the Industrial Sites page.'

export function CpcbOverview({ role }: { role: Role }) {
  const navigate = useNavigate()
  const { filtered } = useCpcbSites()
  const unmapped = useUnmappedQueue()
  const selectUnmapped = useFilters((s) => s.selectUnmapped)
  const selectedSiteId = useFilters((s) => s.selectedSiteId)
  const openDetail = useFilters((s) => s.openDetail)
  const selected = siteById(selectedSiteId)
  const [reportFor, setReportFor] = useState<string | null>(null)

  const highPriority = useMemo(
    () => unmapped.filter((u) => u.assessment === 'industrial-like' && u.persistenceDays > 180).length,
    [unmapped],
  )

  const readings: Reading[] = [
    { label: 'Sites', value: nf(filtered.length) },
    { label: 'Unmapped', value: nf(unmapped.length), tone: 'warning' },
    { label: 'High priority', value: nf(highPriority), tone: 'critical' },
  ]

  const generateReport = () => {
    setReportFor(selectedSiteId ?? filtered[0]?.id ?? null)
    logLine(role.id, 'Evidence report generated from the overview')
  }


  const selectedCard = selected ? (
    <SiteCard site={selected} onOpenDetail={openDetail} />
  ) : (
    <EmptyState
      compact
      title="Nothing selected yet"
      body="Click a point on the map to see its readings here. The full record opens from the card."
    />
  )

  const queue = (
    <RankedQueue
      rows={unmapped}
      limit={6}
      fill
      variant="list"
      showAssessment={false}
      onSelect={(row) => {
        selectUnmapped(row.id)
        logLine(role.id, `Selected unmapped candidate #${row.rank} — ${row.state}`)
      }}
    />
  )


  return (
    <>
      <MapConsole
        role={role}
        title="Industrial thermal sites"
        readings={readings}
        listAction={{ label: 'Site list', onClick: () => navigate('/cpcb/sites') }}
        action={{ label: 'Generate report', onClick: generateReport }}
        map={
          <ThermalMap
            role={role}
            sites={filtered}
            unmapped={unmapped}
            chrome={{ window: false, legend: false }}
            controlPosition="bottom-left"
            panelSide="left"
            tableHint={TABLE_HINT}
            className="absolute inset-0 rounded-none"
          />
        }
        docks={
          <>
            <MapDock title="Selected site">{selectedCard}</MapDock>
            <MapDock
              title="Top unmapped sources"
              summary={nf(unmapped.length)}
              grow
              action={<PanelLink onClick={() => navigate('/cpcb/unmapped')}>View all</PanelLink>}
            >
              {queue}
            </MapDock>
          </>
        }
        fallback={
          <div className="flex flex-col gap-4">
            <div className="bg-card border-line rounded-[14px] border px-4 py-3">
              <h2 className="font-display text-[22px] leading-none">Industrial thermal sites</h2>
              <ReadingsStrip items={readings} className="mt-3 flex-wrap" />
            </div>

            <ThermalMap
              role={role}
              sites={filtered}
              unmapped={unmapped}
              className="h-[420px]"
              tableHint={TABLE_HINT}
            />

            <Panel
              title="Top unmapped sources"
              subtitle="Ranked by persistence and retrieved temperature"
              action={<PanelLink onClick={() => navigate('/cpcb/unmapped')}>View all</PanelLink>}
            >
              {queue}
            </Panel>

            <Panel title="Selected site">{selectedCard}</Panel>

          </div>
        }
      />

      <SiteDetailDrawer role={role} onGenerateReport={setReportFor} />
      <EvidenceReportDialog siteId={reportFor} open={reportFor !== null} onOpenChange={(o) => !o && setReportFor(null)} />
    </>
  )
}
