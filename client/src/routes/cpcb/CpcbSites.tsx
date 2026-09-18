import { useState } from 'react'
import { PageHeader } from '@/components/shell/PageHeader'
import { ThermalMap } from '@/components/map/ThermalMap'
import { Panel } from '@/components/panels/Panel'
import { FilterBar } from '@/components/panels/FilterBar'
import { SiteTable } from '@/components/panels/SiteTable'
import { SiteCard } from '@/components/panels/SiteCard'
import { SiteDetailDrawer } from '@/components/panels/SiteDetailDrawer'
import { EvidenceReportDialog } from '@/components/panels/EvidenceReportDialog'
import { useCpcbSites } from './useCpcbData'
import { useFilters } from '@/store/useFilters'
import { logLine } from '@/store/useConsole'
import { INDUSTRIAL_CLASSES, siteById } from '@/lib/data'
import { nf } from '@/lib/format'
import type { Role } from '@/lib/roles'

export function CpcbSites({ role }: { role: Role }) {
  const { filtered, industrial, states } = useCpcbSites()
  const selectSite = useFilters((s) => s.selectSite)
  const selectedSiteId = useFilters((s) => s.selectedSiteId)
  const selected = siteById(selectedSiteId)
  const [reportFor, setReportFor] = useState<string | null>(null)

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        role={role}
        eyebrow="Industrial branch"
        title="Industrial sites"
        description="Refinery, chemical, steel, cement, kiln and other industrial heat, classified from thermal physics rather than from the map."
        meta={[
          { label: 'In view', value: nf(filtered.length) },
          { label: 'Industrial total', value: nf(industrial.length) },
          { label: 'Abnormal', value: nf(filtered.filter((s) => s.behaviour === 'abnormal').length) },
        ]}
      />

      <Panel bodyClassName="py-2.5">
        <FilterBar role="cpcb" classes={INDUSTRIAL_CLASSES} states={states} />
      </Panel>

      <div className="grid gap-3 xl:grid-cols-[1.35fr_1fr]">
        <Panel title="Sites" subtitle="Sort any column. Selecting a row flies the map and opens the full record.">
          <SiteTable
            sites={filtered}
            columns={[
              'name',
              'class',
              'state',
              'tHot',
              'deltaT',
              'frpDensity',
              'nightRatio',
              'detections',
              'persistence',
              'status',
            ]}
            maxRows={40}
            selectedId={selectedSiteId}
            onRowClick={(site) => {
              selectSite(site.id)
              logLine(role.id, `Selected ${site.name} — ${site.predictedLabel}, ${site.state}`)
            }}
          />
        </Panel>

        <div className="flex min-w-0 flex-col gap-3">
          <ThermalMap role={role} sites={filtered} className="min-h-[360px]" />
          {selected ? (
            <SiteCard site={selected} />
          ) : (
            <Panel>
              <p className="text-ink-soft py-6 text-center text-[12.5px]">
                Select a site to see its readings here, or search with ⌘K.
              </p>
            </Panel>
          )}
        </div>
      </div>

      <SiteDetailDrawer role={role} onGenerateReport={setReportFor} />
      <EvidenceReportDialog siteId={reportFor} open={reportFor !== null} onOpenChange={(o) => !o && setReportFor(null)} />
    </div>
  )
}
