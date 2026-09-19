import { useMemo, useState } from 'react'
import { Filter, Leaf, Trash2, TreePine } from 'lucide-react'
import { PageHeader } from '@/components/shell/PageHeader'
import { ThermalMap } from '@/components/map/ThermalMap'
import { Panel, PanelLink } from '@/components/panels/Panel'
import { StatTile } from '@/components/panels/StatTile'
import { SiteTable } from '@/components/panels/SiteTable'
import { SiteCard } from '@/components/panels/SiteCard'
import { EmptyState } from '@/components/panels/EmptyState'
import { SeparationScatter } from '@/components/panels/SeparationScatter'
import { SiteDetailDrawer } from '@/components/panels/SiteDetailDrawer'
import { EvidenceReportDialog } from '@/components/panels/EvidenceReportDialog'
import { DELTA_T_BOUNDARY, useFsiSites } from './useFsiData'
import { useFilters } from '@/store/useFilters'
import { logLine } from '@/store/useConsole'
import { siteById } from '@/lib/data'
import { istClock, istDate, nf } from '@/lib/format'
import { useNavigate } from 'react-router-dom'
import type { Role } from '@/lib/roles'

export function FsiOverview({ role }: { role: Role }) {
  const navigate = useNavigate()
  const { filtered, industrial, counts } = useFsiSites()
  const selectSite = useFilters((s) => s.selectSite)
  const openDetail = useFilters((s) => s.openDetail)
  const selectedSiteId = useFilters((s) => s.selectedSiteId)
  const selected = siteById(selectedSiteId)
  const [reportFor, setReportFor] = useState<string | null>(null)

  const excluded = useMemo(() => industrial.reduce((a, s) => a + s.detectionCount, 0), [industrial])

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        role={role}
        eyebrow="Fire feed"
        title="Vegetation and waste fires"
        description="The non-industrial branch only, with the industrial heat that would otherwise contaminate the alert feed taken out."
        meta={[
          { label: 'Date', value: istDate() },
          { label: 'Time (IST)', value: istClock() },
          { label: 'Events', value: nf(filtered.length) },
        ]}
        action="Generate report"
        onAction={() => {
          const target = selectedSiteId ?? filtered[0]?.id ?? null
          setReportFor(target)
          logLine(role.id, 'Evidence report generated from the overview')
        }}
      />

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <StatTile icon={TreePine} label="Forest fires" value={nf(counts.get('forest_fire') ?? 0)} caption="Forest cover dominant" />
        <StatTile icon={Leaf} label="Crop burning" value={nf(counts.get('crop_burning') ?? 0)} caption="Cropland dominant" tone="warning" />
        <StatTile icon={Trash2} label="Waste fires" value={nf(counts.get('waste_fire') ?? 0)} caption="Built-up periphery" />
        <StatTile
          icon={Filter}
          label="Other / unknown"
          value={nf(counts.get('other_unknown') ?? 0)}
          caption="Insufficient evidence to classify"
        />
        <StatTile
          icon={Filter}
          label="Industrial heat removed"
          value={nf(excluded)}
          caption={`${nf(industrial.length)} industrial sites kept out of this feed`}
          tone="good"
        />
      </div>

      <Panel
        title="Why industrial heat can be separated"
        subtitle="Section 7.1 — dual-band contrast against scan-normalised intensity"
      >
        <SeparationScatter industrial={industrial} vegetation={filtered} boundary={DELTA_T_BOUNDARY} />
      </Panel>

      <ThermalMap role={role} sites={filtered} className="h-[420px] xl:h-[560px]" availableLayers={['thermal', 'sites', 'landcover', 'districts']} />

      <div className="grid gap-3 xl:grid-cols-[1.5fr_1fr]">
        <div className="relative min-h-[380px]">
          <Panel
            title="Recent events"
            subtitle="Most recently detected vegetation and waste fires"
            action={<PanelLink onClick={() => navigate('/fsi/forest')}>Open forest fires</PanelLink>}
            className="absolute inset-0"
          >
            <SiteTable
              sites={[...filtered].sort((a, b) => (b.lastDetection ?? '').localeCompare(a.lastDetection ?? ''))}
              columns={['name', 'class', 'state', 'tHot', 'deltaT', 'persistence', 'lastDetection']}
              fill
              selectedId={selectedSiteId}
              onRowClick={(site) => {
                selectSite(site.id)
                logLine(role.id, `Selected ${site.name} — ${site.predictedLabel}, ${site.state}`)
              }}
            />
          </Panel>
        </div>

        <Panel title="Selected event">
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

      <SiteDetailDrawer role={role} onGenerateReport={setReportFor} />
      <EvidenceReportDialog siteId={reportFor} open={reportFor !== null} onOpenChange={(o) => !o && setReportFor(null)} />
    </div>
  )
}
