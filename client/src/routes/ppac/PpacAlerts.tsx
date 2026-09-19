import { useMemo, useState } from 'react'
import { AlertTriangle, Flame, Gauge } from 'lucide-react'
import { PageHeader } from '@/components/shell/PageHeader'
import { Panel } from '@/components/panels/Panel'
import { StatTile } from '@/components/panels/StatTile'
import { AlertStream } from '@/components/panels/AlertStream'
import { BaselineBandChart } from '@/components/panels/BaselineBandChart'
import { ThermalMap } from '@/components/map/ThermalMap'
import { EmptyState } from '@/components/panels/EmptyState'
import { SiteDetailDrawer } from '@/components/panels/SiteDetailDrawer'
import { usePpacSites } from './usePpacData'
import { useFilters } from '@/store/useFilters'
import { logLine } from '@/store/useConsole'
import { alerts as allAlerts, siteById } from '@/lib/data'
import { nf } from '@/lib/format'
import type { Alert } from '@/lib/types'
import type { Role } from '@/lib/roles'

export function PpacAlerts({ role }: { role: Role }) {
  const { filtered } = usePpacSites()
  const selectSite = useFilters((s) => s.selectSite)
  const selectedSiteId = useFilters((s) => s.selectedSiteId)
  const [acknowledged, setAcknowledged] = useState<string[]>([])

  const siteIds = useMemo(() => new Set(filtered.map((s) => s.id)), [filtered])
  const alerts = useMemo(
    () =>
      allAlerts
        .filter((a) => siteIds.has(a.siteId))
        .map((a): Alert => (acknowledged.includes(a.id) ? { ...a, status: 'acknowledged' } : a)),
    [siteIds, acknowledged],
  )

  const site = siteById(selectedSiteId)
  const high = alerts.filter((a) => a.severity === 'high').length
  const saturating = filtered.filter((s) => s.saturationFraction > 0.25).length

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        role={role}
        eyebrow="Monitor"
        title="Flaring alerts"
        description="Unexpected night activity, sustained sensor saturation and source-area growth across hydrocarbon sites."
        meta={[
          { label: 'Open alerts', value: nf(alerts.filter((a) => a.status !== 'acknowledged').length) },
          { label: 'High severity', value: nf(high) },
        ]}
      />

      <div className="grid gap-3 sm:grid-cols-3">
        <StatTile
          icon={AlertTriangle}
          label="High severity"
          value={nf(high)}
          caption="Deviation beyond 140% of the site's normal"
          tone={high > 0 ? 'critical' : 'neutral'}
        />
        <StatTile
          icon={Gauge}
          label="Saturating sensors"
          value={nf(saturating)}
          caption="Only industrial-grade sources pin the sensor"
          tone="warning"
        />
        <StatTile
          icon={Flame}
          label="Sites monitored"
          value={nf(filtered.length)}
          caption="Refinery, flare and LNG classes"
        />
      </div>

      <div className="grid gap-3 xl:grid-cols-[1.3fr_1fr]">
        <div className="relative min-h-[420px]">
          <Panel title="Alert stream" subtitle="Current FRP against each site's own normal range" className="absolute inset-0">
            <AlertStream
              alerts={alerts}
              fill
              selectedId={null}
              onSelect={(alert) => {
                selectSite(alert.siteId)
                logLine(role.id, `Opened alert ${alert.id} — ${alert.siteName}`)
              }}
              onAcknowledge={(alert) => {
                setAcknowledged((ids) => [...ids, alert.id])
                logLine(role.id, `Acknowledged ${alert.id} — ${alert.siteName}`)
              }}
            />
          </Panel>
        </div>

        <div className="flex min-w-0 flex-col gap-3">
          <ThermalMap role={role} sites={filtered} shape="square" availableLayers={['sites', 'thermal', 'alerts']} />
          <Panel title={site ? `Baseline — ${site.name}` : 'Baseline'}>
            {site ? (
              <BaselineBandChart site={site} height={190} />
            ) : (
              <EmptyState title="No alert selected" body="Pick an alert to see the site's own normal range." />
            )}
          </Panel>
        </div>
      </div>

      <SiteDetailDrawer role={role} />
    </div>
  )
}
