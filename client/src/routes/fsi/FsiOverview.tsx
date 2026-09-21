import { useMemo, useState } from 'react'
import { ThermalMap } from '@/components/map/ThermalMap'
import { MapConsole } from '@/components/map/MapConsole'
import { MapDock } from '@/components/map/MapDock'
import { ReadingsStrip, type Reading } from '@/components/map/ReadingsStrip'
import { Panel } from '@/components/panels/Panel'
import { SiteCard } from '@/components/panels/SiteCard'
import { EmptyState } from '@/components/panels/EmptyState'
import { SeparationScatter } from '@/components/panels/SeparationScatter'
import { SiteDetailDrawer } from '@/components/panels/SiteDetailDrawer'
import { EvidenceReportDialog } from '@/components/panels/EvidenceReportDialog'
import { useFsiSites } from './useFsiData'
import { useSettingsFor } from '@/store/useRoleSettings'
import { useFilters } from '@/store/useFilters'
import { siteById } from '@/lib/data'
import { nf } from '@/lib/format'
import { useNavigate } from 'react-router-dom'
import type { Role } from '@/lib/roles'

const TABLE_HINT = 'The full event list is on the All Events page.'
const FSI_LAYERS = ['thermal', 'sites', 'landcover', 'districts'] as const

export function FsiOverview({ role }: { role: Role }) {
  const settings = useSettingsFor('fsi')
  const navigate = useNavigate()
  const { filtered, industrial, counts } = useFsiSites()
  const openDetail = useFilters((s) => s.openDetail)
  const selectedSiteId = useFilters((s) => s.selectedSiteId)
  const selected = siteById(selectedSiteId)
  const [reportFor, setReportFor] = useState<string | null>(null)

  const excluded = useMemo(() => industrial.reduce((a, s) => a + s.detectionCount, 0), [industrial])

  const readings: Reading[] = [
    { label: 'Events', value: nf(filtered.length) },
    { label: 'Forest fires', value: nf(counts.get('forest_fire') ?? 0) },
    { label: 'Industrial heat removed', value: nf(excluded), tone: 'good' },
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

  const separation = (height?: number) => (
    <SeparationScatter industrial={industrial} vegetation={filtered} boundary={settings.deltaTBoundary} height={height} />
  )


  return (
    <>
      <MapConsole
        role={role}
        title="Vegetation and waste fires"
        readings={readings}
        listAction={{ label: 'Event list', onClick: () => navigate('/fsi/events') }}
        action={{ label: 'Generate report', onClick: generateReport }}
        map={
          <ThermalMap
            role={role}
            sites={filtered}
            availableLayers={[...FSI_LAYERS]}
            chrome={{ window: false, legend: false }}
            controlPosition="bottom-left"
            panelSide="left"
            tableHint={TABLE_HINT}
            className="absolute inset-0 rounded-none"
          />
        }
        docks={
          <>
            <MapDock title="Selected event">{selectedCard}</MapDock>
            {/* Folded by default — this is the evidence for the filter, not a reading the duty
                officer needs on every glance. */}
            <MapDock title="Why industrial heat separates" summary="§7.1" defaultOpen={false} maxBodyHeight={300}>
              {separation(240)}
            </MapDock>
          </>
        }
        fallback={
          <div className="flex flex-col gap-4">
            <div className="bg-card border-line rounded-[14px] border px-4 py-3">
              <h2 className="font-display text-[22px] leading-none">Vegetation and waste fires</h2>
              <ReadingsStrip items={readings} className="mt-3 flex-wrap" />
            </div>

            <Panel
              title="Why industrial heat can be separated"
              subtitle="Section 7.1 — dual-band contrast against scan-normalised intensity"
            >
              {separation()}
            </Panel>

            <ThermalMap
              role={role}
              sites={filtered}
              availableLayers={[...FSI_LAYERS]}
              className="h-[420px]"
              tableHint={TABLE_HINT}
            />

            <Panel title="Selected event">{selectedCard}</Panel>

          </div>
        }
      />

      <SiteDetailDrawer onGenerateReport={setReportFor} />
      <EvidenceReportDialog siteId={reportFor} open={reportFor !== null} onOpenChange={(o) => !o && setReportFor(null)} />
    </>
  )
}
