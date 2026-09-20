import { useMemo, useState } from 'react'
import { ThermalMap } from '@/components/map/ThermalMap'
import { MapConsole } from '@/components/map/MapConsole'
import { MapDock } from '@/components/map/MapDock'
import { ReadingsStrip, type Reading } from '@/components/map/ReadingsStrip'
import { Panel, PanelLink } from '@/components/panels/Panel'
import { SiteCard } from '@/components/panels/SiteCard'
import { EmptyState } from '@/components/panels/EmptyState'
import { AlertStream } from '@/components/panels/AlertStream'
import { SiteDetailDrawer } from '@/components/panels/SiteDetailDrawer'
import { EvidenceReportDialog } from '@/components/panels/EvidenceReportDialog'
import { useCeaSites } from './useCeaData'
import { useFilters } from '@/store/useFilters'
import { logLine } from '@/store/useConsole'
import { siteById } from '@/lib/data'
import { nf } from '@/lib/format'
import { useNavigate } from 'react-router-dom'
import type { Role } from '@/lib/roles'

const TABLE_HINT = 'The full station list is on the Power Plants page.'

export function CeaOverview({ role }: { role: Role }) {
  const navigate = useNavigate()
  const { filtered, alerts } = useCeaSites()
  const selectSite = useFilters((s) => s.selectSite)
  const openDetail = useFilters((s) => s.openDetail)
  const selectedSiteId = useFilters((s) => s.selectedSiteId)
  const selected = siteById(selectedSiteId)
  const [reportFor, setReportFor] = useState<string | null>(null)

  const stats = useMemo(() => {
    const abnormal = filtered.filter((s) => s.behaviour === 'abnormal').length
    const watch = filtered.filter((s) => s.behaviour === 'normal' && s.frpSlope > 0.03).length
    return { abnormal, watch }
  }, [filtered])

  const readings: Reading[] = [
    { label: 'Stations', value: nf(filtered.length) },
    { label: 'Abnormal', value: nf(stats.abnormal), tone: stats.abnormal > 0 ? 'critical' : 'neutral' },
    { label: 'Under watch', value: nf(stats.watch), tone: 'warning' },
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

  const stream = (
    <AlertStream
      alerts={alerts}
      fill
      onSelect={(alert) => {
        selectSite(alert.siteId)
        logLine(role.id, `Opened alert ${alert.id} — ${alert.siteName}`)
      }}
    />
  )


  return (
    <>
      <MapConsole
        role={role}
        title="Thermal power stations"
        readings={readings}
        listAction={{ label: 'Plant list', onClick: () => navigate('/cea/plants') }}
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
            <MapDock title="Selected station">{selectedCard}</MapDock>
            <MapDock
              title="Deviation alerts"
              summary={nf(alerts.length)}
              grow
              action={<PanelLink onClick={() => navigate('/cea/alerts')}>View all</PanelLink>}
            >
              {stream}
            </MapDock>
          </>
        }
        fallback={
          <div className="flex flex-col gap-4">
            <div className="bg-card border-line rounded-[14px] border px-4 py-3">
              <h2 className="font-display text-[22px] leading-none">Thermal power stations</h2>
              <ReadingsStrip items={readings} className="mt-3 flex-wrap" />
            </div>

            <ThermalMap role={role} sites={filtered} className="h-[420px]" tableHint={TABLE_HINT} />

            <Panel title="Selected station">{selectedCard}</Panel>

            <Panel
              title="Deviation alerts"
              subtitle="Current FRP against each station's own normal"
              action={<PanelLink onClick={() => navigate('/cea/alerts')}>View all</PanelLink>}
            >
              {stream}
            </Panel>

          </div>
        }
      />

      <SiteDetailDrawer role={role} onGenerateReport={setReportFor} />
      <EvidenceReportDialog siteId={reportFor} open={reportFor !== null} onOpenChange={(o) => !o && setReportFor(null)} />
    </>
  )
}
