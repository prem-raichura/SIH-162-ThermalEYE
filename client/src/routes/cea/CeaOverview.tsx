import { useMemo, useState } from 'react'
import { Eye, ShieldCheck, TriangleAlert, Zap } from 'lucide-react'
import { PageHeader } from '@/components/shell/PageHeader'
import { ThermalMap } from '@/components/map/ThermalMap'
import { Panel, PanelLink } from '@/components/panels/Panel'
import { StatTile } from '@/components/panels/StatTile'
import { SiteTable } from '@/components/panels/SiteTable'
import { SiteCard } from '@/components/panels/SiteCard'
import { EmptyState } from '@/components/panels/EmptyState'
import { AlertStream } from '@/components/panels/AlertStream'
import { DistributionDonut } from '@/components/panels/DistributionDonut'
import { SiteDetailDrawer } from '@/components/panels/SiteDetailDrawer'
import { EvidenceReportDialog } from '@/components/panels/EvidenceReportDialog'
import { useCeaSites } from './useCeaData'
import { useFilters } from '@/store/useFilters'
import { logLine } from '@/store/useConsole'
import { model, siteById } from '@/lib/data'
import { istClock, istDate, nf } from '@/lib/format'
import { useNavigate } from 'react-router-dom'
import type { Role } from '@/lib/roles'

export function CeaOverview({ role }: { role: Role }) {
  const navigate = useNavigate()
  const { filtered, fuels, alerts, controls } = useCeaSites()
  const selectSite = useFilters((s) => s.selectSite)
  const openDetail = useFilters((s) => s.openDetail)
  const selectedSiteId = useFilters((s) => s.selectedSiteId)
  const selected = siteById(selectedSiteId)
  const [reportFor, setReportFor] = useState<string | null>(null)

  const stats = useMemo(() => {
    const abnormal = filtered.filter((s) => s.behaviour === 'abnormal').length
    const watch = filtered.filter((s) => s.behaviour === 'normal' && s.frpSlope > 0.03).length
    const capacity = filtered.reduce((a, s) => a + (s.capacity ?? 0), 0)
    return { abnormal, watch, capacity }
  }, [filtered])

  const fuelSlices = useMemo(() => fuels.slice(0, 5).map(([label, value]) => ({ label, value })), [fuels])

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        role={role}
        eyebrow="Operational intelligence"
        title="Thermal power stations"
        description="Every station against its own thermal history, with deviation measured on scan-normalised intensity."
        meta={[
          { label: 'Date', value: istDate() },
          { label: 'Time (IST)', value: istClock() },
          { label: 'Stations', value: nf(filtered.length) },
          { label: 'Capacity', value: `${nf(stats.capacity / 1000, 1)} GW` },
        ]}
        action="Generate report"
        onAction={() => {
          const target = selectedSiteId ?? filtered[0]?.id ?? null
          setReportFor(target)
          logLine(role.id, 'Evidence report generated from the overview')
        }}
      />

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatTile icon={Zap} label="Monitored plants" value={nf(filtered.length)} caption="Thermal stations in view" />
        <StatTile
          icon={Eye}
          label="Under watch"
          value={nf(stats.watch)}
          caption="Rising FRP trend, still inside normal range"
          tone="warning"
        />
        <StatTile
          icon={TriangleAlert}
          label="Abnormal"
          value={nf(stats.abnormal)}
          caption="Above the station's own normal range"
          tone={stats.abnormal > 0 ? 'critical' : 'neutral'}
        />
        <StatTile
          icon={ShieldCheck}
          label="Controls rejected"
          value={`${nf(model.controls.total)} / 0`}
          caption="Solar, wind and hydro plants — none read as thermal"
          tone="good"
        />
      </div>

      <ThermalMap role={role} sites={filtered} className="h-[420px] xl:h-[560px]" />

      <div className="grid gap-3 xl:grid-cols-[1.5fr_1fr]">
        <div className="relative min-h-[380px]">
          <Panel
            title="Stations"
            subtitle="Sorted by capacity — select a row to open the record"
            action={<PanelLink onClick={() => navigate('/cea/plants')}>Open plant list</PanelLink>}
            className="absolute inset-0"
          >
            <SiteTable
              sites={[...filtered].sort((a, b) => (b.capacity ?? 0) - (a.capacity ?? 0))}
              columns={['name', 'fuel', 'capacity', 'state', 'frpDensity', 'detections', 'status']}
              fill
              selectedId={selectedSiteId}
              onRowClick={(site) => {
                selectSite(site.id)
                logLine(role.id, `Selected ${site.name} — ${site.fuel ?? 'unknown fuel'}, ${site.state}`)
              }}
            />
          </Panel>
        </div>

        <div className="flex flex-col gap-3">
          <Panel title="Selected station">
            {selected ? (
              <SiteCard site={selected} onOpenDetail={openDetail} />
            ) : (
              <EmptyState
                title="Nothing selected yet"
                body="Click a point on the map or a row in the table. The full record opens from here."
              />
            )}
          </Panel>

          <Panel title="Fuel mix" subtitle="Stations by primary fuel">
            <DistributionDonut slices={fuelSlices} centerLabel="stations" centerValue={nf(filtered.length)} height={150} />
          </Panel>

          <Panel title="Deviation alerts" subtitle="Current FRP against each station's own normal">
            <AlertStream
              alerts={alerts}
              limit={3}
              onSelect={(alert) => {
                selectSite(alert.siteId)
                logLine(role.id, `Opened alert ${alert.id} — ${alert.siteName}`)
              }}
            />
          </Panel>
        </div>
      </div>

      <Panel title="Why the negative controls matter" subtitle={`${nf(controls.length)} monitored, ${nf(model.controls.total)} in the register`}>
        <p className="text-ink-soft text-[12.5px]">{model.controls.note}</p>
      </Panel>

      <SiteDetailDrawer role={role} onGenerateReport={setReportFor} />
      <EvidenceReportDialog siteId={reportFor} open={reportFor !== null} onOpenChange={(o) => !o && setReportFor(null)} />
    </div>
  )
}
