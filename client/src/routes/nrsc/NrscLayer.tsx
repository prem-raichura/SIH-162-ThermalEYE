import { useState } from 'react'
import { Search } from 'lucide-react'
import { ThermalMap } from '@/components/map/ThermalMap'
import { MapConsole } from '@/components/map/MapConsole'
import { MapDock } from '@/components/map/MapDock'
import { ReadingsStrip, type Reading } from '@/components/map/ReadingsStrip'
import { Panel } from '@/components/panels/Panel'
import { FilterBar } from '@/components/panels/FilterBar'
import { SiteCard } from '@/components/panels/SiteCard'
import { EmptyState } from '@/components/panels/EmptyState'
import { SiteDetailDrawer } from '@/components/panels/SiteDetailDrawer'
import { EvidenceReportDialog } from '@/components/panels/EvidenceReportDialog'
import { useNavigate } from 'react-router-dom'
import { useNrscData } from './useNrscData'
import { useFilters } from '@/store/useFilters'
import { siteById } from '@/lib/data'
import { nf } from '@/lib/format'
import type { Role } from '@/lib/roles'

const TABLE_HINT = 'Every record is listed, with its provenance columns, on the Site Records page.'
const NRSC_LAYERS = ['thermal', 'sites', 'unmapped', 'boundary', 'landcover', 'districts'] as const

/**
 * The cross-publication view: the complete layer, every class, no branch filter. NRSC is not
 * enforcing anything here — they are the ones handing the layer on, so identity, verdict and
 * provenance sit on the same row.
 */
export function NrscLayer({ role }: { role: Role }) {
  const navigate = useNavigate()
  const { filtered, states, classes, counts } = useNrscData()
  const search = useFilters((s) => s.search)
  const setSearch = useFilters((s) => s.setSearch)
  const openDetail = useFilters((s) => s.openDetail)
  const selectedSiteId = useFilters((s) => s.selectedSiteId)
  const selected = siteById(selectedSiteId)
  const [reportFor, setReportFor] = useState<string | null>(null)

  const readings: Reading[] = [
    { label: 'Records', value: nf(filtered.length) },
    { label: 'Register-backed', value: nf(counts.registerBacked), tone: 'good' },
    { label: 'OSM only', value: nf(counts.osmOnly), tone: 'warning' },
  ]

  const generateReport = () => {
    setReportFor(selectedSiteId ?? filtered[0]?.id ?? null)
  }

  const searchBox = (
    <label className="border-line text-ink-soft inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-[12px]">
      <Search size={13} strokeWidth={1.8} />
      <input
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Find a site or operator"
        className="text-ink w-[190px] bg-transparent outline-none"
      />
    </label>
  )

  const filters = (
    <div className="flex flex-col gap-2.5">
      <FilterBar
        classes={classes} states={states} />
      {searchBox}
    </div>
  )


  const selectedCard = selected ? (
    <SiteCard site={selected} onOpenDetail={openDetail} />
  ) : (
    <EmptyState
      compact
      title="Nothing selected yet"
      body="Click a point on the map. The full record, including every provenance field, opens from the card."
    />
  )


  return (
    <>
      <MapConsole
        role={role}
        title="Full site layer"
        readings={readings}
        listAction={{ label: 'Site records', onClick: () => navigate('/nrsc/records') }}
        action={{ label: 'Generate report', onClick: generateReport }}
        map={
          <ThermalMap
            role={role}
            sites={filtered}
            availableLayers={[...NRSC_LAYERS]}
            chrome={{ window: false, legend: false }}
            controlPosition="bottom-left"
            panelSide="left"
            tableHint={TABLE_HINT}
            className="absolute inset-0 rounded-none"
          />
        }
        docks={
          <>
            <MapDock title="Filters" summary={`${nf(filtered.length)} shown`} defaultOpen={false} maxBodyHeight={300}>
              {filters}
            </MapDock>
            <MapDock title="Selected record" grow>
              {selectedCard}
            </MapDock>
          </>
        }
        fallback={
          <div className="flex flex-col gap-4">
            <div className="bg-card border-line rounded-[14px] border px-4 py-3">
              <h2 className="font-display text-[22px] leading-none">Full site layer</h2>
              <ReadingsStrip items={readings} className="mt-3 flex-wrap" />
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <FilterBar
        classes={classes} states={states} />
              <div className="ml-auto">{searchBox}</div>
            </div>

            <ThermalMap
              role={role}
              sites={filtered}
              availableLayers={[...NRSC_LAYERS]}
              className="h-[420px]"
              tableHint={TABLE_HINT}
            />

            <Panel title="Selected record">{selectedCard}</Panel>

          </div>
        }
      />

      <SiteDetailDrawer onGenerateReport={setReportFor} />
      <EvidenceReportDialog siteId={reportFor} open={reportFor !== null} onOpenChange={(o) => !o && setReportFor(null)} />
    </>
  )
}
