import { useMemo, useState } from 'react'
import { AlertTriangle, Bell, TrendingUp } from 'lucide-react'
import { PageHeader } from '@/components/shell/PageHeader'
import { Panel } from '@/components/panels/Panel'
import { StatTile } from '@/components/panels/StatTile'
import { AlertStream } from '@/components/panels/AlertStream'
import { BaselineBandChart } from '@/components/panels/BaselineBandChart'
import { ScanGeometryDemo } from '@/components/panels/ScanGeometryDemo'
import { EmptyState } from '@/components/panels/EmptyState'
import { SiteDetailDrawer } from '@/components/panels/SiteDetailDrawer'
import { useCeaSites } from './useCeaData'
import { useFilters } from '@/store/useFilters'
import { siteById } from '@/lib/data'
import { nf } from '@/lib/format'
import type { Alert } from '@/lib/types'
import type { Role } from '@/lib/roles'
import { useSettingsFor } from '@/store/useRoleSettings'
import { atOrAboveFloor } from '@/lib/severity'

export function CeaAlerts({ role }: { role: Role }) {
  const settings = useSettingsFor('cea')
  const { filtered, alerts } = useCeaSites()
  const selectSite = useFilters((s) => s.selectSite)
  const selectedSiteId = useFilters((s) => s.selectedSiteId)
  const [acknowledged, setAcknowledged] = useState<string[]>([])

  const rows = useMemo(
    () =>
      alerts
        .filter((a) => atOrAboveFloor(a.severity, settings.alertMinSeverity))
        .map((a): Alert => (acknowledged.includes(a.id) ? { ...a, status: 'acknowledged' } : a)),
    [alerts, acknowledged, settings.alertMinSeverity],
  )
  const site = siteById(selectedSiteId) ?? siteById(rows[0]?.siteId ?? null)
  const rising = filtered.filter((s) => s.frpSlope > settings.risingSlope).length

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        role={role}
        eyebrow="Deviation"
        title="Alerts"
        description="Unit-level thermal deviation, measured on scan-normalised intensity so a scan-edge pixel is not mistaken for a bigger event."
        meta={[
          { label: 'Open', value: nf(rows.filter((a) => a.status !== 'acknowledged').length) },
          { label: 'High severity', value: nf(rows.filter((a) => a.severity === 'high').length) },
        ]}
      />

      <div className="grid gap-3 sm:grid-cols-3">
        <StatTile
          icon={Bell}
          label="Open alerts"
          value={nf(rows.filter((a) => a.status !== 'acknowledged').length)}
          caption="Awaiting acknowledgement"
          tone={rows.length > 0 ? 'warning' : 'neutral'}
        />
        <StatTile
          icon={AlertTriangle}
          label="High severity"
          value={nf(rows.filter((a) => a.severity === 'high').length)}
          caption="Beyond 140% of the station's normal"
          tone="critical"
        />
        <StatTile
          icon={TrendingUp}
          label="Rising trend"
          value={nf(rising)}
          caption="Climbing FRP, still inside normal range"
        />
      </div>

      <div className="grid gap-3 xl:grid-cols-[1.25fr_1fr]">
        <div className="relative min-h-[420px]">
          <Panel title="Alert stream" subtitle="Current FRP against each station's own normal" className="absolute inset-0">
            <AlertStream
              alerts={rows}
              fill
              onSelect={(alert) => {
                selectSite(alert.siteId)
              }}
              onAcknowledge={(alert) => {
                setAcknowledged((ids) => [...ids, alert.id])
              }}
            />
          </Panel>
        </div>

        <div className="flex min-w-0 flex-col gap-3">
          {site ? (
            <>
              <Panel title={`Baseline — ${site.name}`}>
                <BaselineBandChart site={site} height={190} />
              </Panel>
              <Panel title="Scan-geometry check" subtitle="Section 7.2">
                <ScanGeometryDemo site={site} />
              </Panel>
            </>
          ) : (
            <Panel>
              <EmptyState title="No alert selected" body="Pick an alert to see the station's own normal range." />
            </Panel>
          )}
        </div>
      </div>

      <SiteDetailDrawer />
    </div>
  )
}
