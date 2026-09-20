import { useState } from 'react'
import { FileText, Inbox, Moon } from 'lucide-react'
import { ThermalMap } from '@/components/map/ThermalMap'
import { MapConsole } from '@/components/map/MapConsole'
import { AlertWindowPicker } from '@/components/map/AlertWindowPicker'
import { MapDock } from '@/components/map/MapDock'
import { ReadingsStrip, type Reading } from '@/components/map/ReadingsStrip'
import { Panel } from '@/components/panels/Panel'
import { AlertDetail } from '@/components/panels/AlertDetail'
import { EvidenceReportDialog } from '@/components/panels/EvidenceReportDialog'
import { SiteDetailDrawer } from '@/components/panels/SiteDetailDrawer'
import { Button } from '@/components/ui/button'
import { Actions } from './alertActions'
import { alertSites, useFirmsPass, useNdmaFeed, type FeedAlert } from './useNdmaData'
import { DISPOSITION_LABEL, useNdma, type Disposition } from '@/store/useNdma'
import { ROUTE_LABEL } from '@/lib/severity'
import { useFilters } from '@/store/useFilters'
import { logLine } from '@/store/useConsole'
import { nf } from '@/lib/format'
import { useNavigate } from 'react-router-dom'
import type { Alert } from '@/lib/types'
import type { Role } from '@/lib/roles'

const TABLE_HINT = 'The full alert list, with the same acknowledge and escalate actions, is on the Alert Queue page.'

const LATENCY_NOTE =
  'Near-real-time, not zero-latency: detections arrive with each satellite pass, so a new event shows up within the pass interval rather than the instant it starts. The pass on this screen is a local timer over the static dataset.'

/**
 * The response map. Severity is re-binned live from the Severity Settings configuration, so
 * what a duty officer sees here is whatever policy is currently set — never a fixed list.
 *
 * Placing the incident comes first, so the map is the page and the alert that is selected on
 * it carries its own disposition controls. Working the backlog as a list is the queue page.
 */
export function NdmaLiveAlerts({ role }: { role: Role }) {
  const navigate = useNavigate()
  const feed = useNdmaFeed()
  const selectAlert = useNdma((s) => s.selectAlert)
  const setDisposition = useNdma((s) => s.setDisposition)
  const config = useNdma((s) => s.config)
  const selectSite = useFilters((s) => s.selectSite)
  const openDetail = useFilters((s) => s.openDetail)
  const [reportFor, setReportFor] = useState<string | null>(null)

  useFirmsPass(role.id, feed.queue)

  const onSelect = (alert: Alert) => {
    selectAlert(alert.id)
    selectSite(alert.siteId)
    logLine(role.id, `Opened alert ${alert.id} — ${alert.siteName}, ${alert.severity} severity`)
  }

  // Escalating overrides the tier's own destination and sends the alert up the high-severity
  // route — that is what escalation means to a duty officer.
  const dispose = (alert: FeedAlert, disposition: Disposition) => {
    setDisposition(alert.id, disposition)
    logLine(
      role.id,
      `${DISPOSITION_LABEL[disposition]} ${alert.id} — ${alert.siteName}${
        disposition === 'escalated' ? ` · sent to ${ROUTE_LABEL[config.routing.high]}` : ''
      }`,
    )
  }

  const readings: Reading[] = [
    { label: 'High', value: nf(feed.counts.high), tone: 'critical' },
    { label: 'Medium', value: nf(feed.counts.medium), tone: 'warning' },
    { label: 'Inbound', value: nf(feed.queue.length) },
  ]

  const hasFeedNote = feed.suppressedCount > 0 || feed.outsideWindow > 0 || feed.quiet

  const feedNote = (
    <div className="text-ink-soft flex flex-col gap-1.5 text-[12px]">
      {feed.suppressedCount > 0 && (
        <span>
          <span className="tnum font-mono">{nf(feed.suppressedCount)}</span> held back by the confidence floor and class
          filters
        </span>
      )}
      {feed.outsideWindow > 0 && (
        <span>
          <span className="tnum font-mono">{nf(feed.outsideWindow)}</span> older than the current window
        </span>
      )}
      {feed.quiet && (
        <span className="inline-flex items-center gap-1.5">
          <Moon size={12} strokeWidth={1.9} />
          Quiet hours — only high severity pages
        </span>
      )}
    </div>
  )

  const detail = (
    <AlertDetail
      role={role}
      alert={feed.selected}
      site={feed.selected?.site}
      routing={feed.selected?.routing}
      showThumbnail={false}
      compactEmpty
      emptyBody="Click an incident on the map. Its location, what it is doing against its own normal, and the actions you can take on it open here."
      actions={
        feed.selected && (
          <div className="flex flex-col gap-2.5">
            {/* The three verbs sit with the evidence, so a decision needs no second screen. */}
            <Actions
              alert={feed.selected}
              size="md"
              onDispose={dispose}
              onClear={(a) => {
                setDisposition(a.id, null)
                logLine(role.id, `Returned ${a.id} to the active queue`)
              }}
            />
            <div className="flex flex-wrap gap-2">
              <Button
                size="sm"
                variant="outline"
                className="gap-1.5 rounded-[9px]"
                onClick={() => {
                  selectSite(feed.selected?.siteId ?? null)
                  openDetail()
                  logLine(role.id, `Full record opened for ${feed.selected?.siteName}`)
                }}
              >
                Full record
              </Button>
              <Button
                size="sm"
                className="gap-1.5 rounded-[9px]"
                onClick={() => {
                  setReportFor(feed.selected?.siteId ?? null)
                  logLine(role.id, `Evidence report generated for ${feed.selected?.siteName}`)
                }}
              >
                <FileText size={14} strokeWidth={1.8} />
                Evidence report
              </Button>
            </div>
          </div>
        )
      }
    />
  )

  const map = (fullBleed: boolean) => (
    <ThermalMap
      role={role}
      sites={alertSites(feed.visible)}
      unmapped={[]}
      alerts={feed.visible}
      alertMode="incidents"
      availableLayers={['thermal', 'sites', 'boundary', 'districts']}
      chrome={fullBleed ? { window: false, legend: false } : undefined}
      controlPosition={fullBleed ? 'bottom-left' : 'bottom-right'}
      panelSide={fullBleed ? 'left' : 'right'}
      tableHint={TABLE_HINT}
      className={fullBleed ? 'absolute inset-0 rounded-none' : 'h-[420px]'}
      onAlertSelect={onSelect}
    />
  )

  return (
    <>
      <MapConsole
        role={role}
        title="Live alerts"
        readings={readings}
        timeControl={<AlertWindowPicker />}
        listAction={{ label: 'Alert queue', onClick: () => navigate('/ndma/queue') }}
        action={{
          label: 'Generate report',
          onClick: () => {
            setReportFor(feed.selected?.siteId ?? feed.active[0]?.siteId ?? null)
            logLine(role.id, 'Evidence report generated from the live feed')
          },
        }}
        map={map(true)}
        docks={
          <>
            <MapDock title="Alert details" summary={feed.selected?.severity} grow>
              {detail}
              <p className="text-ink-faint mt-3 text-[11px]">{LATENCY_NOTE}</p>
            </MapDock>
            <MapDock
              title="Inbound"
              summary={`${nf(feed.queue.length)} waiting`}
              defaultOpen={false}
              maxBodyHeight={180}
            >
              {hasFeedNote ? (
                feedNote
              ) : (
                <p className="text-ink-soft inline-flex items-center gap-1.5 text-[12px]">
                  <Inbox size={13} strokeWidth={1.8} />
                  Nothing held back. Every alert in the window is on the map.
                </p>
              )}
            </MapDock>
          </>
        }
        fallback={
          <div className="flex flex-col gap-4">
            <div className="bg-card border-line rounded-[14px] border px-4 py-3">
              <h2 className="font-display text-[22px] leading-none">Live alerts</h2>
              <ReadingsStrip items={readings} className="mt-3 flex-wrap" />
            </div>

            {hasFeedNote && feedNote}

            {map(false)}

            <Panel title="Alert details" subtitle="Model evidence and contextual evidence, kept apart">
              {detail}
            </Panel>

            <p className="text-ink-faint text-[11.5px]">{LATENCY_NOTE}</p>
          </div>
        }
      />

      <SiteDetailDrawer role={role} onGenerateReport={setReportFor} />
      <EvidenceReportDialog siteId={reportFor} open={reportFor !== null} onOpenChange={(o) => !o && setReportFor(null)} />
    </>
  )
}
