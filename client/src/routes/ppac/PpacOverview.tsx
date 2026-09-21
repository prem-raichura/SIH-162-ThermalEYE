import { useMemo, useState } from 'react'
import { ThermalMap } from '@/components/map/ThermalMap'
import { MapConsole } from '@/components/map/MapConsole'
import { MapDock } from '@/components/map/MapDock'
import { ReadingsStrip, type Reading } from '@/components/map/ReadingsStrip'
import { Panel } from '@/components/panels/Panel'
import { SiteCard } from '@/components/panels/SiteCard'
import { EmptyState } from '@/components/panels/EmptyState'
import { AlertStream } from '@/components/panels/AlertStream'
import { SiteDetailDrawer } from '@/components/panels/SiteDetailDrawer'
import { EvidenceReportDialog } from '@/components/panels/EvidenceReportDialog'
import { usePpacSites } from './usePpacData'
import { useFilters } from '@/store/useFilters'
import { alerts as allAlerts, siteById } from '@/lib/data'
import { nf } from '@/lib/format'
import { useNavigate } from 'react-router-dom'
import type { Role } from '@/lib/roles'

const TABLE_HINT = 'The full site list is on the Refineries and Flares page.'

export function PpacOverview({ role }: { role: Role }) {
  const navigate = useNavigate()
  const { filtered, flares, refineries } = usePpacSites()
  const selectSite = useFilters((s) => s.selectSite)
  const openDetail = useFilters((s) => s.openDetail)
  const selectedSiteId = useFilters((s) => s.selectedSiteId)
  const selected = siteById(selectedSiteId)
  const [reportFor, setReportFor] = useState<string | null>(null)

  const abnormal = useMemo(() => filtered.filter((s) => s.behaviour === 'abnormal').length, [filtered])
  const siteIds = useMemo(() => new Set(filtered.map((s) => s.id)), [filtered])
  const roleAlerts = useMemo(() => allAlerts.filter((a) => siteIds.has(a.siteId)), [siteIds])

  const readings: Reading[] = [
    { label: 'Flare sites', value: nf(flares.length) },
    { label: 'Abnormal', value: nf(abnormal), tone: abnormal > 0 ? 'critical' : 'neutral' },
    { label: 'Refineries', value: nf(refineries.length) },
  ]

  const generateReport = () => {
    setReportFor(selectedSiteId ?? filtered[0]?.id ?? null)
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

  const onAlert = (_alertId: string, siteId: string) => {
    selectSite(siteId)
  }

  const stream = (
    <AlertStream alerts={roleAlerts} fill onSelect={(a) => onAlert(a.id, a.siteId)} />
  )


  return (
    <>
      <MapConsole
        role={role}
        title="Refineries, flares and gas infrastructure"
        readings={readings}
        listAction={{ label: 'Site list', onClick: () => navigate('/ppac/flares') }}
        action={{ label: 'Generate report', onClick: generateReport }}
        map={
          <ThermalMap
            role={role}
            sites={filtered}
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
            <MapDock title="Flaring alerts" summary={nf(roleAlerts.length)} grow>
              {stream}
            </MapDock>
          </>
        }
        fallback={
          <div className="flex flex-col gap-4">
            <div className="bg-card border-line rounded-[14px] border px-4 py-3">
              <h2 className="font-display text-[22px] leading-none">Refineries, flares and gas infrastructure</h2>
              <ReadingsStrip items={readings} className="mt-3 flex-wrap" />
            </div>

            <ThermalMap role={role} sites={filtered} className="h-[420px]" tableHint={TABLE_HINT} />

            <Panel title="Selected site">{selectedCard}</Panel>

            <Panel title="Flaring alerts" subtitle="Deviation from each site's own baseline">
              {stream}
            </Panel>

          </div>
        }
      />

      <SiteDetailDrawer onGenerateReport={setReportFor} />
      <EvidenceReportDialog siteId={reportFor} open={reportFor !== null} onOpenChange={(o) => !o && setReportFor(null)} />
    </>
  )
}
