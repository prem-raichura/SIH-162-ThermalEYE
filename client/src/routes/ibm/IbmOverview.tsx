import { useMemo, useState } from 'react'
import { ThermalMap } from '@/components/map/ThermalMap'
import { MapConsole } from '@/components/map/MapConsole'
import { MapDock } from '@/components/map/MapDock'
import { ReadingsStrip, type Reading } from '@/components/map/ReadingsStrip'
import { Panel, PanelLink } from '@/components/panels/Panel'
import { SiteCard } from '@/components/panels/SiteCard'
import { EmptyState } from '@/components/panels/EmptyState'
import { RankedQueue } from '@/components/panels/RankedQueue'
import { SiteDetailDrawer } from '@/components/panels/SiteDetailDrawer'
import { EvidenceReportDialog } from '@/components/panels/EvidenceReportDialog'
import { candidateRank, useIbmSites } from './useIbmData'
import { useFilters } from '@/store/useFilters'
import { logLine } from '@/store/useConsole'
import { siteById } from '@/lib/data'
import { nf } from '@/lib/format'
import { useNavigate } from 'react-router-dom'
import type { Role } from '@/lib/roles'
import { useSettingsFor } from '@/store/useRoleSettings'

const TABLE_HINT = 'The full site list is on the Mining Sites page.'

export function IbmOverview({ role }: { role: Role }) {
  const settings = useSettingsFor('ibm')
  const navigate = useNavigate()
  const { filtered, candidates } = useIbmSites()
  const selectUnmapped = useFilters((s) => s.selectUnmapped)
  const openDetail = useFilters((s) => s.openDetail)
  const selectedSiteId = useFilters((s) => s.selectedSiteId)
  const selected = siteById(selectedSiteId)
  const [reportFor, setReportFor] = useState<string | null>(null)

  const longBurning = useMemo(
    () => filtered.filter((s) => s.persistenceDays > settings.longBurningDays).length,
    [filtered, settings.longBurningDays],
  )
  const ranked = useMemo(() => candidateRank(candidates), [candidates])

  const readings: Reading[] = [
    { label: 'Mine sites', value: nf(filtered.length) },
    { label: 'Candidates', value: nf(ranked.length), tone: 'warning' },
    { label: 'Burning over a year', value: nf(longBurning), tone: 'critical' },
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
      rows={ranked}
      fill
      variant="list"
      showAssessment={false}
      onSelect={(row) => {
        selectUnmapped(row.id)
        logLine(role.id, `Selected candidate #${row.rank} — ${row.state}`)
      }}
    />
  )


  return (
    <>
      <MapConsole
        role={role}
        title="Mine fires and persistent heat"
        readings={readings}
        listAction={{ label: 'Site list', onClick: () => navigate('/ibm/sites') }}
        action={{ label: 'Generate report', onClick: generateReport }}
        map={
          <ThermalMap
            role={role}
            sites={filtered}
            unmapped={candidates}
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
              title="Unmapped candidates"
              summary={nf(ranked.length)}
              grow
              action={<PanelLink onClick={() => navigate('/ibm/unmapped')}>View all</PanelLink>}
            >
              {queue}
            </MapDock>
          </>
        }
        fallback={
          <div className="flex flex-col gap-4">
            <div className="bg-card border-line rounded-[14px] border px-4 py-3">
              <h2 className="font-display text-[22px] leading-none">Mine fires and persistent heat</h2>
              <ReadingsStrip items={readings} className="mt-3 flex-wrap" />
            </div>

            <ThermalMap
              role={role}
              sites={filtered}
              unmapped={candidates}
              className="h-[420px]"
              tableHint={TABLE_HINT}
            />

            <Panel title="Selected site">{selectedCard}</Panel>

            <Panel
              title="Unmapped candidates"
              subtitle="Persistent heat with no mine within 1 km"
              action={<PanelLink onClick={() => navigate('/ibm/unmapped')}>View all</PanelLink>}
            >
              {queue}
            </Panel>

          </div>
        }
      />

      <SiteDetailDrawer role={role} onGenerateReport={setReportFor} />
      <EvidenceReportDialog siteId={reportFor} open={reportFor !== null} onOpenChange={(o) => !o && setReportFor(null)} />
    </>
  )
}
