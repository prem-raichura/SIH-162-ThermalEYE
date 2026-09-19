import { useMemo, useState } from 'react'
import { Flame, Factory, Layers, TriangleAlert } from 'lucide-react'
import { PageHeader } from '@/components/shell/PageHeader'
import { ThermalMap } from '@/components/map/ThermalMap'
import { Panel, PanelLink } from '@/components/panels/Panel'
import { StatTile } from '@/components/panels/StatTile'
import { SiteTable } from '@/components/panels/SiteTable'
import { SiteCard } from '@/components/panels/SiteCard'
import { EmptyState } from '@/components/panels/EmptyState'
import { AlertStream } from '@/components/panels/AlertStream'
import { SiteDetailDrawer } from '@/components/panels/SiteDetailDrawer'
import { EvidenceReportDialog } from '@/components/panels/EvidenceReportDialog'
import { usePpacSites } from './usePpacData'
import { useFilters } from '@/store/useFilters'
import { logLine } from '@/store/useConsole'
import { alerts as allAlerts, siteById } from '@/lib/data'
import { istClock, istDate, nf } from '@/lib/format'
import { useNavigate } from 'react-router-dom'
import type { Role } from '@/lib/roles'

export function PpacOverview({ role }: { role: Role }) {
  const navigate = useNavigate()
  const { filtered, flares, refineries } = usePpacSites()
  const selectSite = useFilters((s) => s.selectSite)
  const openDetail = useFilters((s) => s.openDetail)
  const selectedSiteId = useFilters((s) => s.selectedSiteId)
  const selected = siteById(selectedSiteId)
  const [reportFor, setReportFor] = useState<string | null>(null)

  const stats = useMemo(() => {
    const abnormal = filtered.filter((s) => s.behaviour === 'abnormal').length
    const multiStack = filtered.filter((s) => (s.flareStacks ?? 0) > 2).length
    return { abnormal, multiStack }
  }, [filtered])

  const siteIds = useMemo(() => new Set(filtered.map((s) => s.id)), [filtered])
  const roleAlerts = useMemo(() => allAlerts.filter((a) => siteIds.has(a.siteId)), [siteIds])

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        role={role}
        eyebrow="Flaring overview"
        title="Refineries, flares and gas infrastructure"
        description="A satellite check on flaring behaviour, measured from the dual-band signal rather than reported."
        meta={[
          { label: 'Date', value: istDate() },
          { label: 'Time (IST)', value: istClock() },
          { label: 'Sites in view', value: nf(filtered.length) },
          { label: 'PPAC refineries', value: nf(refineries.length) },
        ]}
        action="Generate report"
        onAction={() => {
          const target = selectedSiteId ?? filtered[0]?.id ?? null
          setReportFor(target)
          logLine(role.id, 'Evidence report opened from the overview')
        }}
      />

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatTile icon={Flame} label="Active flare sites" value={nf(flares.length)} caption="Night-active hydrocarbon heat" />
        <StatTile
          icon={TriangleAlert}
          label="Abnormal now"
          value={nf(stats.abnormal)}
          caption="Above the site's own normal FRP range"
          tone={stats.abnormal > 0 ? 'critical' : 'neutral'}
        />
        <StatTile
          icon={Layers}
          label="Multiple-stack sites"
          value={nf(stats.multiStack)}
          caption="More than two hot units in one pixel"
          tone="warning"
        />
        <StatTile
          icon={Factory}
          label="Refineries tracked"
          value={nf(refineries.length)}
          caption="The complete PPAC list, geolocated"
          tone="good"
        />
      </div>

      <ThermalMap role={role} sites={filtered} className="min-h-[520px]" />

      <div className="grid gap-3 xl:grid-cols-[1.5fr_1fr]">
        <div className="relative min-h-[380px]">
          <Panel
            title="Hydrocarbon sites"
            subtitle="Refinery, gas flare and LNG heat in the current filter"
            action={<PanelLink onClick={() => navigate('/ppac/flares')}>Open flare list</PanelLink>}
            className="absolute inset-0"
          >
            <SiteTable
              sites={filtered}
              columns={['name', 'class', 'state', 'tHot', 'nightRatio', 'saturation', 'persistence', 'status']}
              fill
              selectedId={selectedSiteId}
              onRowClick={(site) => {
                selectSite(site.id)
                logLine(role.id, `Selected ${site.name} — ${site.predictedLabel}, ${site.state}`)
              }}
            />
          </Panel>
        </div>

        <div className="flex flex-col gap-3">
          <Panel title="Selected site" subtitle="Readings for whatever is picked on the map or in the table">
            {selected ? (
              <SiteCard site={selected} onOpenDetail={openDetail} />
            ) : (
              <EmptyState
                title="Nothing selected yet"
                body="Click a point on the map or a row in the table. The full record opens from here."
              />
            )}
          </Panel>

          <Panel title="Flaring alerts" subtitle="Deviation from each site's own baseline">
            <AlertStream
              alerts={roleAlerts}
              limit={4}
              onSelect={(alert) => {
                selectSite(alert.siteId)
                logLine(role.id, `Opened alert ${alert.id} — ${alert.siteName}`)
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
