import { useMemo, useState } from 'react'
import { Bell, Flame, TreePine } from 'lucide-react'
import { PageHeader } from '@/components/shell/PageHeader'
import { Panel } from '@/components/panels/Panel'
import { StatTile } from '@/components/panels/StatTile'
import { AlertStream } from '@/components/panels/AlertStream'
import { ThermalMap } from '@/components/map/ThermalMap'
import { SiteCard } from '@/components/panels/SiteCard'
import { EmptyState } from '@/components/panels/EmptyState'
import { SiteDetailDrawer } from '@/components/panels/SiteDetailDrawer'
import { useFsiSites } from './useFsiData'
import { useFilters } from '@/store/useFilters'
import { alerts as allAlerts, siteById } from '@/lib/data'
import { nf } from '@/lib/format'
import type { Alert } from '@/lib/types'
import type { Role } from '@/lib/roles'
import { useSettingsFor } from '@/store/useRoleSettings'
import { atOrAboveFloor } from '@/lib/severity'

export function FsiAlerts({ role }: { role: Role }) {
  const settings = useSettingsFor('fsi')
  const { filtered } = useFsiSites()
  const selectSite = useFilters((s) => s.selectSite)
  const openDetail = useFilters((s) => s.openDetail)
  const selectedSiteId = useFilters((s) => s.selectedSiteId)
  const [acknowledged, setAcknowledged] = useState<string[]>([])

  const siteIds = useMemo(() => new Set(filtered.map((s) => s.id)), [filtered])
  const rows = useMemo(
    () =>
      allAlerts
        .filter((a) => siteIds.has(a.siteId))
        .filter((a) => atOrAboveFloor(a.severity, settings.alertMinSeverity))
        .map((a): Alert => (acknowledged.includes(a.id) ? { ...a, status: 'acknowledged' } : a)),
    [siteIds, acknowledged, settings.alertMinSeverity],
  )

  const selected = siteById(selectedSiteId)
  const forest = rows.filter((a) => a.sourceClass === 'forest_fire').length

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        role={role}
        eyebrow="Feed"
        title="Fire alerts"
        description="Vegetation and waste fires only. Industrial sources never reach this stream."
        meta={[
          { label: 'Open', value: nf(rows.filter((a) => a.status !== 'acknowledged').length) },
          { label: 'Forest', value: nf(forest) },
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
        <StatTile icon={TreePine} label="Forest fire alerts" value={nf(forest)} caption="Forest cover dominant" />
        <StatTile
          icon={Flame}
          label="Events monitored"
          value={nf(filtered.length)}
          caption="Non-industrial branch only"
        />
      </div>

      <div className="grid gap-3 xl:grid-cols-[1.3fr_1fr]">
        <div className="relative min-h-[420px]">
          <Panel title="Alert stream" subtitle="Each row states what burned and how far it deviates" className="absolute inset-0">
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
          <ThermalMap
            role={role}
            sites={filtered}
            shape="square"
            availableLayers={['thermal', 'sites', 'alerts', 'landcover']}
          />
          {selected ? (
            <SiteCard site={selected} onOpenDetail={openDetail} />
          ) : (
            <Panel>
              <EmptyState title="No alert selected" body="Pick an alert to see the event's readings." />
            </Panel>
          )}
        </div>
      </div>

      <SiteDetailDrawer />
    </div>
  )
}
