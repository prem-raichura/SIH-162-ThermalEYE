import { useState } from 'react'
import { FileText } from 'lucide-react'
import { PageHeader } from '@/components/shell/PageHeader'
import { Panel } from '@/components/panels/Panel'
import { ThermalMap } from '@/components/map/ThermalMap'
import { AlertDetail } from '@/components/panels/AlertDetail'
import { EvidenceReportDialog } from '@/components/panels/EvidenceReportDialog'
import { SiteDetailDrawer } from '@/components/panels/SiteDetailDrawer'
import { Button } from '@/components/ui/button'
import { alertSites, useNdmaFeed } from './useNdmaData'
import { ALERT_WINDOWS, useNdma } from '@/store/useNdma'
import { useFilters } from '@/store/useFilters'
import { logLine } from '@/store/useConsole'
import { SEVERITY_LABEL, SEVERITY_ORDER } from '@/lib/severity'
import { SEVERITY_COLOR } from '@/lib/thermal'
import { nf } from '@/lib/format'
import { cn } from '@/lib/utils'
import type { Role } from '@/lib/roles'

/** Incidents on the map: severity triangles over the thermal layer, clustered at low zoom. */
export function NdmaIncidents({ role }: { role: Role }) {
  const feed = useNdmaFeed()
  const windowHours = useNdma((s) => s.windowHours)
  const setWindow = useNdma((s) => s.setWindow)
  const selectAlert = useNdma((s) => s.selectAlert)
  const selectSite = useFilters((s) => s.selectSite)
  const openDetail = useFilters((s) => s.openDetail)
  const [reportFor, setReportFor] = useState<string | null>(null)

  const counts = feed.counts

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        role={role}
        eyebrow="Multi-hazard"
        title="Incident map"
        description="Every alert in the window, placed and coloured by severity. Clusters at low zoom hold the incidents that would otherwise stack on top of each other."
        meta={[
          { label: 'Incidents', value: nf(feed.visible.length) },
          { label: 'High', value: nf(counts.high) },
          { label: 'Window', value: windowHours === 0 ? 'All' : `${windowHours} h` },
        ]}
      />

      <div className="flex flex-wrap items-center gap-2">
        <span className="text-ink-soft text-[12px]">Alert age</span>
        {ALERT_WINDOWS.map((w) => (
          <button
            key={w.label}
            type="button"
            onClick={() => {
              setWindow(w.hours)
              logLine(role.id, `Incident window set to ${w.label}`)
            }}
            className={cn(
              'border-line rounded-full border px-2.5 py-1 text-[11.5px]',
              windowHours === w.hours ? 'bg-ink text-paper border-ink' : 'hover:border-ink-faint',
            )}
          >
            {w.label}
          </button>
        ))}

        <span className="ml-auto flex flex-wrap items-center gap-3">
          {SEVERITY_ORDER.map((severity) => (
            <span key={severity} className="text-ink-soft inline-flex items-center gap-1.5 text-[11.5px]">
              <span
                className="inline-block h-0 w-0"
                style={{
                  borderLeft: '5px solid transparent',
                  borderRight: '5px solid transparent',
                  borderBottom: `9px solid ${SEVERITY_COLOR[severity]}`,
                }}
              />
              {SEVERITY_LABEL[severity]} ({nf(counts[severity])})
            </span>
          ))}
        </span>
      </div>

      <div className="grid gap-3 xl:grid-cols-[1.45fr_1fr]">
        <ThermalMap
          role={role}
          sites={alertSites(feed.visible)}
          unmapped={[]}
          alerts={feed.visible}
          alertMode="incidents"
          availableLayers={['thermal', 'sites', 'boundary', 'districts']}
          className="h-[420px] xl:h-[620px]"
          onAlertSelect={(alert) => {
            selectAlert(alert.id)
            selectSite(alert.siteId)
            logLine(role.id, `Flew to incident ${alert.id} — ${alert.siteName}`)
          }}
        />

        <Panel title="Incident details" subtitle="Click a triangle on the map, or a cluster to zoom into it">
          <AlertDetail
            role={role}
            alert={feed.selected}
            site={feed.selected?.site}
            routing={feed.selected?.routing}
            showThumbnail={false}
            actions={
              feed.selected && (
                <div className="flex flex-wrap gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className="rounded-[9px]"
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
      </div>

      <SiteDetailDrawer role={role} onGenerateReport={setReportFor} />
      <EvidenceReportDialog siteId={reportFor} open={reportFor !== null} onOpenChange={(o) => !o && setReportFor(null)} />
    </div>
  )
}
