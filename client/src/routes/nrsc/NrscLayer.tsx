import { useState } from 'react'
import { Database, Globe2, Layers, Search, Satellite } from 'lucide-react'
import { PageHeader } from '@/components/shell/PageHeader'
import { Panel } from '@/components/panels/Panel'
import { StatTile } from '@/components/panels/StatTile'
import { ThermalMap } from '@/components/map/ThermalMap'
import { FilterBar } from '@/components/panels/FilterBar'
import { ColumnChooser, SiteTable } from '@/components/panels/SiteTable'
import { SiteCard } from '@/components/panels/SiteCard'
import { EmptyState } from '@/components/panels/EmptyState'
import { SiteDetailDrawer } from '@/components/panels/SiteDetailDrawer'
import { EvidenceReportDialog } from '@/components/panels/EvidenceReportDialog'
import { useNrscData } from './useNrscData'
import { useNrsc } from '@/store/useNrsc'
import { useFilters } from '@/store/useFilters'
import { logLine } from '@/store/useConsole'
import { siteById } from '@/lib/data'
import { nf } from '@/lib/format'
import type { Role } from '@/lib/roles'

/**
 * The cross-publication view: the complete layer, every class, no branch filter. NRSC is not
 * enforcing anything here — they are the ones handing the layer on, so identity, verdict and
 * provenance sit on the same row.
 */
export function NrscLayer({ role }: { role: Role }) {
  const { filtered, states, classes, counts } = useNrscData()
  const columns = useNrsc((s) => s.columns)
  const setColumns = useNrsc((s) => s.setColumns)
  const search = useFilters((s) => s.search)
  const setSearch = useFilters((s) => s.setSearch)
  const selectSite = useFilters((s) => s.selectSite)
  const openDetail = useFilters((s) => s.openDetail)
  const selectedSiteId = useFilters((s) => s.selectedSiteId)
  const selected = siteById(selectedSiteId)
  const [reportFor, setReportFor] = useState<string | null>(null)

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        role={role}
        eyebrow="Cross-publication"
        title="Full site layer"
        description="Every record the pipeline produced — all classes, both branches and the non-thermal controls — with its source and its quality attached."
        meta={[
          { label: 'Records', value: nf(filtered.length) },
          { label: 'Classes', value: nf(classes.length) },
          { label: 'States', value: nf(new Set(filtered.map((s) => s.state)).size) },
        ]}
        action="Generate report"
        onAction={() => {
          setReportFor(selectedSiteId ?? filtered[0]?.id ?? null)
          logLine(role.id, 'Evidence report generated from the site layer')
        }}
      />

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatTile icon={Layers} label="Records in view" value={nf(filtered.length)} caption="Published as one layer" />
        <StatTile
          icon={Database}
          label="Register-backed"
          value={nf(counts.registerBacked)}
          caption="PPAC, WRI, GEM or CEA join"
          tone="good"
        />
        <StatTile icon={Globe2} label="OSM only" value={nf(counts.osmOnly)} caption="Community mapping, no register join" tone="warning" />
        <StatTile
          icon={Satellite}
          label="Both modalities"
          value={nf(counts.bothModalities)}
          caption="Sentinel-1 and Sentinel-2 both usable"
        />
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <FilterBar role={role.id} classes={classes} states={states} />
        <label className="border-line text-ink-soft ml-auto inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-[12px]">
          <Search size={13} strokeWidth={1.8} />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Find a site or operator"
            className="text-ink w-[190px] bg-transparent outline-none"
          />
        </label>
      </div>

      <ThermalMap
        role={role}
        sites={filtered}
        className="h-[420px] xl:h-[560px]"
        availableLayers={['thermal', 'sites', 'unmapped', 'boundary', 'landcover', 'districts']}
      />

      <div className="grid gap-3 xl:grid-cols-[2.2fr_1fr]">
        <div className="relative min-h-[460px]">
          <Panel
            title="Published layer"
            subtitle={`${nf(filtered.length)} records · sort any column`}
            action={<ColumnChooser value={columns} onChange={setColumns} />}
            className="absolute inset-0"
          >
            <SiteTable
              sites={filtered}
              columns={columns}
              fill
              selectedId={selectedSiteId}
              onRowClick={(site) => {
                selectSite(site.id)
                logLine(role.id, `Selected ${site.name} — ${site.predictedLabel}, ${site.registerSource.toUpperCase()}`)
              }}
            />
          </Panel>
        </div>

        <Panel title="Selected record">
          {selected ? (
            <SiteCard site={selected} onOpenDetail={openDetail} />
          ) : (
            <EmptyState
              title="Nothing selected yet"
              body="Pick a row or a point on the map. The full record, including every provenance field, opens from here."
            />
          )}
        </Panel>
      </div>

      <SiteDetailDrawer role={role} onGenerateReport={setReportFor} />
      <EvidenceReportDialog siteId={reportFor} open={reportFor !== null} onOpenChange={(o) => !o && setReportFor(null)} />
    </div>
  )
}
