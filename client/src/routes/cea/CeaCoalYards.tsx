import { useMemo, useState } from 'react'
import { Flame, Gauge, TriangleAlert } from 'lucide-react'
import { PageHeader } from '@/components/shell/PageHeader'
import { Panel } from '@/components/panels/Panel'
import { StatTile } from '@/components/panels/StatTile'
import { AlertStream } from '@/components/panels/AlertStream'
import { BaselineBandChart } from '@/components/panels/BaselineBandChart'
import { ThermalMap } from '@/components/map/ThermalMap'
import { EmptyState } from '@/components/panels/EmptyState'
import { SiteDetailDrawer } from '@/components/panels/SiteDetailDrawer'
import { EvidenceReportDialog } from '@/components/panels/EvidenceReportDialog'
import { useCeaSites } from './useCeaData'
import { useFilters } from '@/store/useFilters'
import { logLine } from '@/store/useConsole'
import { siteById } from '@/lib/data'
import { megawatt, nf, shortDate } from '@/lib/format'
import type { Alert } from '@/lib/types'
import type { Role } from '@/lib/roles'

/**
 * Coal-yard fires are the abnormal event CEA actually acts on: a stockpile smoulders for
 * days, so the signature is a sustained rise above the station's own normal range rather
 * than a single hot pass.
 */
export function CeaCoalYards({ role }: { role: Role }) {
  const { filtered, alerts } = useCeaSites()
  const selectSite = useFilters((s) => s.selectSite)
  const selectedSiteId = useFilters((s) => s.selectedSiteId)
  const [acknowledged, setAcknowledged] = useState<string[]>([])
  const [reportFor, setReportFor] = useState<string | null>(null)

  const coalAlerts = useMemo(
    () =>
      alerts
        .filter((a) => /coal yard|unit thermal|abnormal/i.test(a.title))
        .map((a): Alert => (acknowledged.includes(a.id) ? { ...a, status: 'acknowledged' } : a)),
    [alerts, acknowledged],
  )

  const site = siteById(selectedSiteId) ?? siteById(coalAlerts[0]?.siteId ?? null)
  const coalPlants = useMemo(() => filtered.filter((s) => (s.fuel ?? '').toLowerCase() === 'coal'), [filtered])
  const worst = coalAlerts.reduce((a, b) => (b.deviationPct > (a?.deviationPct ?? 0) ? b : a), coalAlerts[0])

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        role={role}
        eyebrow="Incident"
        title="Coal yards"
        description="Sustained heat on a stockpile, flagged against the station's own baseline rather than a national threshold."
        meta={[
          { label: 'Coal stations', value: nf(coalPlants.length) },
          { label: 'Open events', value: nf(coalAlerts.filter((a) => a.status !== 'acknowledged').length) },
          { label: 'Worst deviation', value: worst ? `+${worst.deviationPct}%` : '—' },
        ]}
        action={site ? 'Generate report' : undefined}
        onAction={() => {
          if (!site) return
          setReportFor(site.id)
          logLine(role.id, `Evidence report generated for ${site.name}`)
        }}
      />

      <div className="grid gap-3 sm:grid-cols-3">
        <StatTile icon={Flame} label="Coal stations" value={nf(coalPlants.length)} caption="Stockpiles in the monitored set" />
        <StatTile
          icon={TriangleAlert}
          label="Yard events"
          value={nf(coalAlerts.length)}
          caption="Sustained rise above the station's normal"
          tone={coalAlerts.length > 0 ? 'critical' : 'neutral'}
        />
        <StatTile
          icon={Gauge}
          label="Mean FRP density"
          value={nf(coalPlants.reduce((a, s) => a + s.frpDensity, 0) / Math.max(coalPlants.length, 1), 1)}
          unit="MW/km²"
          caption="Scan-geometry normalised"
        />
      </div>

      <div className="grid gap-3 xl:grid-cols-[1.25fr_1fr]">
        <div className="relative min-h-[420px]">
          <Panel title="Yard events" subtitle="Current FRP against each station's own normal range" className="absolute inset-0">
            <AlertStream
              alerts={coalAlerts}
              fill
              onSelect={(alert) => {
                selectSite(alert.siteId)
                logLine(role.id, `Opened ${alert.title} — ${alert.siteName}`)
              }}
              onAcknowledge={(alert) => {
                setAcknowledged((ids) => [...ids, alert.id])
                logLine(role.id, `Acknowledged ${alert.id} — ${alert.siteName}`)
              }}
            />
          </Panel>
        </div>

        <div className="flex min-w-0 flex-col gap-3">
          <ThermalMap role={role} sites={coalPlants} controls="below" availableLayers={['sites', 'thermal', 'alerts']} />

          {site ? (
            <Panel title={`Baseline — ${site.name}`} subtitle="Observed FRP against the station's normal range">
              <BaselineBandChart site={site} height={190} />
              <dl className="border-line tnum mt-2 grid grid-cols-2 gap-x-4 gap-y-1 border-t pt-2 font-mono text-[11px]">
                <div className="flex justify-between">
                  <dt className="text-ink-faint">Fuel</dt>
                  <dd>{site.fuel ?? '—'}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-ink-faint">Capacity</dt>
                  <dd>{site.capacity === null ? '—' : `${nf(site.capacity, 0)} MW`}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-ink-faint">Peak FRP</dt>
                  <dd>{megawatt(site.frpPeak)}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-ink-faint">Last detection</dt>
                  <dd>{shortDate(site.lastDetection)}</dd>
                </div>
              </dl>
            </Panel>
          ) : (
            <Panel>
              <EmptyState title="No event selected" body="Pick a yard event to see the station's own normal range." />
            </Panel>
          )}
        </div>
      </div>

      <SiteDetailDrawer role={role} onGenerateReport={setReportFor} />
      <EvidenceReportDialog siteId={reportFor} open={reportFor !== null} onOpenChange={(o) => !o && setReportFor(null)} />
    </div>
  )
}
