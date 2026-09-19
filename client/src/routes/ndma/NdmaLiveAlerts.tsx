import { useMemo, useState } from 'react'
import { AlertTriangle, ArrowUpRight, Check, FileText, Flame, Inbox, Moon, TreePine, X } from 'lucide-react'
import { PageHeader } from '@/components/shell/PageHeader'
import { Panel } from '@/components/panels/Panel'
import { StatTile } from '@/components/panels/StatTile'
import { AlertStream } from '@/components/panels/AlertStream'
import { AlertDetail } from '@/components/panels/AlertDetail'
import { EvidenceReportDialog } from '@/components/panels/EvidenceReportDialog'
import { SiteDetailDrawer } from '@/components/panels/SiteDetailDrawer'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { PASS_INTERVAL_MS, useFirmsPass, useNdmaFeed, type FeedAlert } from './useNdmaData'
import { useNdma, type Disposition } from '@/store/useNdma'
import { ROUTE_LABEL } from '@/lib/severity'
import { useFilters } from '@/store/useFilters'
import { logLine } from '@/store/useConsole'
import { istClock, nf } from '@/lib/format'
import type { Alert } from '@/lib/types'
import type { Role } from '@/lib/roles'

const DISPOSITION_LABEL: Record<Disposition, string> = {
  acknowledged: 'Acknowledged',
  escalated: 'Escalated',
  dismissed: 'Dismissed',
}

/**
 * The response feed. Severity is re-binned live from the Severity Settings configuration, so
 * what a duty officer sees here is whatever policy is currently set — never a fixed list.
 */
export function NdmaLiveAlerts({ role }: { role: Role }) {
  const feed = useNdmaFeed()
  const selectAlert = useNdma((s) => s.selectAlert)
  const setDisposition = useNdma((s) => s.setDisposition)
  const config = useNdma((s) => s.config)
  const passes = useNdma((s) => s.passes)
  const selectSite = useFilters((s) => s.selectSite)
  const openDetail = useFilters((s) => s.openDetail)
  const [reportFor, setReportFor] = useState<string | null>(null)

  useFirmsPass(role.id, feed.queue)

  const tabs = useMemo(
    () => [
      { id: 'active', label: 'Active', rows: feed.active },
      { id: 'acknowledged', label: 'Acknowledged', rows: feed.acknowledged },
      { id: 'escalated', label: 'Escalated', rows: feed.escalated },
      { id: 'dismissed', label: 'Dismissed', rows: feed.dismissed },
    ],
    [feed.active, feed.acknowledged, feed.escalated, feed.dismissed],
  )

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

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        role={role}
        eyebrow="Response"
        title="Live alerts"
        description="Every row states what a site is doing now against its own historical normal. Severity is deviation from that normal, not a national FRP threshold."
        meta={[
          { label: 'In feed', value: nf(feed.visible.length) },
          { label: 'Inbound', value: nf(feed.queue.length) },
          { label: 'Passes', value: nf(passes) },
          { label: 'Time (IST)', value: istClock() },
        ]}
        action="Generate report"
        onAction={() => {
          const target = feed.selected?.siteId ?? feed.active[0]?.siteId ?? null
          setReportFor(target)
          logLine(role.id, 'Evidence report opened from the live feed')
        }}
      />

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatTile
          icon={AlertTriangle}
          label="High severity"
          value={nf(feed.counts.high)}
          caption="Paged immediately, quiet hours included"
          tone="critical"
        />
        <StatTile icon={Flame} label="Medium severity" value={nf(feed.counts.medium)} caption="District control room" tone="warning" />
        <StatTile icon={TreePine} label="Low severity" value={nf(feed.counts.low)} caption="Logged, nobody paged" tone="good" />
        <StatTile
          icon={Inbox}
          label="Inbound queue"
          value={nf(feed.queue.length)}
          caption={`One released every ${PASS_INTERVAL_MS / 1000} s · ${nf(passes)} passes so far`}
        />
      </div>

      {(feed.suppressedCount > 0 || feed.outsideWindow > 0 || feed.quiet) && (
        <div className="text-ink-soft flex flex-wrap items-center gap-x-5 gap-y-1.5 text-[12px]">
          {feed.suppressedCount > 0 && (
            <span>
              <span className="tnum font-mono">{nf(feed.suppressedCount)}</span> held back by the confidence floor and
              class filters
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
      )}

      <div className="grid gap-3 xl:grid-cols-[1.05fr_1fr]">
        <Panel title="Alert location details" subtitle="Model evidence and contextual evidence, kept apart">
          <AlertDetail
            role={role}
            alert={feed.selected}
            site={feed.selected?.site}
            routing={feed.selected?.routing}
            actions={
              feed.selected && (
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
              )
            }
          />
        </Panel>

        <div className="relative min-h-[560px]">
          <Panel
            title="Alert stream"
            subtitle={`${nf(feed.visible.length)} in the current window · newest first`}
            className="absolute inset-0"
          >
            <Tabs defaultValue="active" className="min-h-0 flex-1">
              <TabsList className="w-full">
                {tabs.map((tab) => (
                  <TabsTrigger key={tab.id} value={tab.id} className="text-[12px]">
                    {tab.label} ({nf(tab.rows.length)})
                  </TabsTrigger>
                ))}
              </TabsList>

              {tabs.map((tab) => (
                <TabsContent key={tab.id} value={tab.id} className="min-h-0 flex-1 data-[state=inactive]:hidden">
                  <AlertStream
                    alerts={tab.rows}
                    fill
                    showConfidence
                    selectedId={feed.selected?.id ?? null}
                    onSelect={onSelect}
                    renderActions={(alert) => (
                      <Actions
                        alert={alert as FeedAlert}
                        onDispose={dispose}
                        onClear={(a) => {
                          setDisposition(a.id, null)
                          logLine(role.id, `Returned ${a.id} to the active queue`)
                        }}
                      />
                    )}
                  />
                </TabsContent>
              ))}
            </Tabs>
          </Panel>
        </div>
      </div>

      <p className="text-ink-faint text-[11.5px]">
        Near-real-time and continuously updated, not zero-latency: detections arrive with each satellite pass, so a new
        event is visible within the pass interval rather than the instant it starts. The pass on this screen is a local
        timer over the static dataset — the app holds no live connection.
      </p>

      <SiteDetailDrawer role={role} onGenerateReport={setReportFor} />
      <EvidenceReportDialog siteId={reportFor} open={reportFor !== null} onOpenChange={(o) => !o && setReportFor(null)} />
    </div>
  )
}

function Actions({
  alert,
  onDispose,
  onClear,
}: {
  alert: FeedAlert
  onDispose: (alert: FeedAlert, disposition: Disposition) => void
  onClear: (alert: FeedAlert) => void
}) {
  if (alert.disposition) {
    return (
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation()
          onClear(alert)
        }}
        className="text-ink-faint hover:text-ink inline-flex items-center gap-1 text-[10.5px] underline-offset-4 hover:underline"
      >
        <Check size={11} /> {DISPOSITION_LABEL[alert.disposition]} — undo
      </button>
    )
  }

  return (
    <div className="flex items-center gap-1">
      <Action label="Acknowledge" onClick={() => onDispose(alert, 'acknowledged')}>
        <Check size={11} /> Ack
      </Action>
      <Action label="Escalate" onClick={() => onDispose(alert, 'escalated')}>
        <ArrowUpRight size={11} /> Escalate
      </Action>
      <Action label="Dismiss" onClick={() => onDispose(alert, 'dismissed')}>
        <X size={11} />
      </Action>
    </div>
  )
}

function Action({ label, onClick, children }: { label: string; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      onClick={(e) => {
        e.stopPropagation()
        onClick()
      }}
      className="border-line hover:border-ink-faint inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10.5px]"
    >
      {children}
    </button>
  )
}
