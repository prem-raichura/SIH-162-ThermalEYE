import { useMemo, useState } from 'react'
import { FileText } from 'lucide-react'
import { PageHeader } from '@/components/shell/PageHeader'
import { Panel } from '@/components/panels/Panel'
import { Button } from '@/components/ui/button'
import { AlertStream } from '@/components/panels/AlertStream'
import { ShapEvidence } from '@/components/panels/ShapEvidence'
import { BaselineBandChart } from '@/components/panels/BaselineBandChart'
import { EmptyState } from '@/components/panels/EmptyState'
import { EvidenceReportDialog } from '@/components/panels/EvidenceReportDialog'
import { SiteDetailDrawer } from '@/components/panels/SiteDetailDrawer'
import { useNdmaFeed } from './useNdmaData'
import { useNdma } from '@/store/useNdma'
import { useFilters } from '@/store/useFilters'
import { logLine } from '@/store/useConsole'
import { ROUTE_LABEL, SEVERITY_LABEL, SEVERITY_ORDER, type RouteId } from '@/lib/severity'
import { SEVERITY_COLOR } from '@/lib/thermal'
import { nf } from '@/lib/format'
import type { Role } from '@/lib/roles'

/** Incident paperwork: the evidence behind one alert, and where each tier was sent. */
export function NdmaReports({ role }: { role: Role }) {
  const feed = useNdmaFeed()
  const selectAlert = useNdma((s) => s.selectAlert)
  const selectSite = useFilters((s) => s.selectSite)
  const [reportFor, setReportFor] = useState<string | null>(null)

  const selected = feed.selected ?? feed.visible[0] ?? null

  const routing = useMemo(() => {
    const out = new Map<RouteId, number>()
    for (const a of feed.visible) out.set(a.routing.route, (out.get(a.routing.route) ?? 0) + 1)
    return out
  }, [feed.visible])

  const held = feed.visible.filter((a) => a.routing.held).length

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        role={role}
        eyebrow="Paperwork"
        title="Incident reports"
        description="One alert at a time: what drove the classification, how the site normally behaves, and who the alert was sent to."
        meta={[
          { label: 'In window', value: nf(feed.visible.length) },
          { label: 'Escalated', value: nf(feed.escalated.length) },
        ]}
        action="Generate report"
        onAction={() => {
          setReportFor(selected?.siteId ?? null)
          logLine(role.id, `Evidence report generated for ${selected?.siteName ?? 'the selected incident'}`)
        }}
      />

      <div className="grid gap-3 xl:grid-cols-[1fr_1.15fr]">
        <div className="relative min-h-[460px]">
          <Panel title="Pick an incident" subtitle="Newest first, inside the current window" className="absolute inset-0">
            <AlertStream
              alerts={feed.visible}
              fill
              showConfidence
              selectedId={selected?.id ?? null}
              onSelect={(alert) => {
                selectAlert(alert.id)
                selectSite(alert.siteId)
                logLine(role.id, `Loaded evidence for ${alert.siteName}`)
              }}
            />
          </Panel>
        </div>

        <div className="flex min-w-0 flex-col gap-3">
          {selected && selected.site ? (
            <>
              <Panel
                title={`Evidence — ${selected.siteName}`}
                subtitle={`${selected.sourceLabel} · confidence ${selected.confidence.toFixed(2)} · routed to ${selected.routing.label}`}
                action={
                  <Button
                    size="sm"
                    className="gap-1.5 rounded-[9px]"
                    onClick={() => {
                      setReportFor(selected.siteId)
                      logLine(role.id, `Evidence report generated for ${selected.siteName}`)
                    }}
                  >
                    <FileText size={14} strokeWidth={1.8} />
                    Generate report
                  </Button>
                }
              >
                <ShapEvidence siteId={selected.siteId} />
              </Panel>

              <Panel title="This site's own normal" subtitle="Severity is distance from this band, nothing else">
                <BaselineBandChart site={selected.site} height={190} />
              </Panel>
            </>
          ) : (
            <Panel>
              <EmptyState
                title="No incident selected"
                body="Choose an alert on the left to see what drove its classification and how the site normally behaves."
              />
            </Panel>
          )}
        </div>
      </div>

      <Panel title="Routing summary" subtitle="Where the alerts in this window were sent">
        <ul className="divide-line divide-y">
          {SEVERITY_ORDER.map((severity) => (
            <li key={severity} className="flex items-center justify-between gap-4 py-2 text-[12.5px]">
              <span className="inline-flex items-center gap-2">
                <span className="h-2 w-2 rounded-full" style={{ backgroundColor: SEVERITY_COLOR[severity] }} />
                {SEVERITY_LABEL[severity]} severity
              </span>
              <span className="text-ink-soft">
                <span className="tnum font-mono">{nf(feed.counts[severity])}</span> alerts
              </span>
            </li>
          ))}
          {[...routing.entries()].map(([route, count]) => (
            <li key={route} className="text-ink-soft flex items-center justify-between gap-4 py-2 text-[12.5px]">
              <span>{ROUTE_LABEL[route]}</span>
              <span className="tnum font-mono">{nf(count)}</span>
            </li>
          ))}
        </ul>
        {held > 0 && (
          <p className="text-ink-faint mt-2 text-[11.5px]">
            <span className="tnum font-mono">{nf(held)}</span> alerts are held to the log by quiet hours. High severity
            is never held.
          </p>
        )}
      </Panel>

      <SiteDetailDrawer role={role} onGenerateReport={setReportFor} />
      <EvidenceReportDialog siteId={reportFor} open={reportFor !== null} onOpenChange={(o) => !o && setReportFor(null)} />
    </div>
  )
}
