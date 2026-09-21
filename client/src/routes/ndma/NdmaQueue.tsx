import { useMemo, useState } from 'react'
import { PageHeader } from '@/components/shell/PageHeader'
import { Panel } from '@/components/panels/Panel'
import { AlertStream } from '@/components/panels/AlertStream'
import { AlertDetail } from '@/components/panels/AlertDetail'
import { EvidenceReportDialog } from '@/components/panels/EvidenceReportDialog'
import { SiteDetailDrawer } from '@/components/panels/SiteDetailDrawer'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Actions } from './alertActions'
import { useFirmsPass, useNdmaFeed, type FeedAlert } from './useNdmaData'
import { useNdma, type Disposition } from '@/store/useNdma'
import { useFilters } from '@/store/useFilters'
import { istClock, nf } from '@/lib/format'
import type { Alert } from '@/lib/types'
import type { Role } from '@/lib/roles'

/**
 * The backlog as a list. The map console is for placing one incident; this is for working
 * through all of them — the same three verbs on every row, and a disposition tab for each
 * state so nothing is lost after it is handled.
 */
export function NdmaQueue({ role }: { role: Role }) {
  const feed = useNdmaFeed()
  const selectAlert = useNdma((s) => s.selectAlert)
  const setDisposition = useNdma((s) => s.setDisposition)
  const passes = useNdma((s) => s.passes)
  const selectSite = useFilters((s) => s.selectSite)
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
  }

  const dispose = (alert: FeedAlert, disposition: Disposition) => {
    setDisposition(alert.id, disposition)
  }

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        role={role}
        eyebrow="Response"
        title="Alert queue"
        description="Every row states what a site is doing now against its own historical normal. Severity is deviation from that normal, not a national FRP threshold."
        meta={[
          { label: 'In feed', value: nf(feed.visible.length) },
          { label: 'Inbound', value: nf(feed.queue.length) },
          { label: 'Passes', value: nf(passes) },
          { label: 'Time (IST)', value: istClock() },
        ]}
        action="Generate report"
        onAction={() => {
          setReportFor(feed.selected?.siteId ?? feed.active[0]?.siteId ?? null)
        }}
      />

      <div className="grid gap-3 xl:grid-cols-[1.35fr_1fr]">
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
                        }}
                      />
                    )}
                  />
                </TabsContent>
              ))}
            </Tabs>
          </Panel>
        </div>

        <Panel title="Alert details" subtitle="Model evidence and contextual evidence, kept apart">
          <AlertDetail
            role={role}
            alert={feed.selected}
            site={feed.selected?.site}
            routing={feed.selected?.routing}
          />
        </Panel>
      </div>

      <SiteDetailDrawer onGenerateReport={setReportFor} />
      <EvidenceReportDialog siteId={reportFor} open={reportFor !== null} onOpenChange={(o) => !o && setReportFor(null)} />
    </div>
  )
}
