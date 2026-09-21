import { useMemo, useState } from 'react'
import { FileText } from 'lucide-react'
import { PageHeader } from '@/components/shell/PageHeader'
import { Panel } from '@/components/panels/Panel'
import { Button } from '@/components/ui/button'
import { SiteTable } from '@/components/panels/SiteTable'
import { ShapEvidence } from '@/components/panels/ShapEvidence'
import { EvidenceReportDialog } from '@/components/panels/EvidenceReportDialog'
import { EmptyState } from '@/components/panels/EmptyState'
import { useCpcbSites } from './useCpcbData'
import { useFilters } from '@/store/useFilters'
import { logLine } from '@/store/useConsole'
import { siteById } from '@/lib/data'
import { istDate, nf } from '@/lib/format'
import type { Role } from '@/lib/roles'
import { useSettingsFor } from '@/store/useRoleSettings'

/** Section 29 — the evidence behind a prediction, model evidence kept apart from context. */
export function CpcbReports({ role }: { role: Role }) {
  const settings = useSettingsFor('cpcb')
  const { filtered } = useCpcbSites()
  const selectSite = useFilters((s) => s.selectSite)
  const selectedSiteId = useFilters((s) => s.selectedSiteId)
  const [reportFor, setReportFor] = useState<string | null>(null)
  const [generated, setGenerated] = useState<{ id: string; name: string; at: string }[]>([])

  const site = siteById(selectedSiteId)
  const candidates = useMemo(
    () => [...filtered].sort((a, b) => b.detectionCount - a.detectionCount).slice(0, settings.reportTopN),
    [filtered, settings.reportTopN],
  )

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        role={role}
        eyebrow="Explainability"
        title="Evidence reports"
        description="Why a site was classified the way it was, and which of that reasoning came from the map rather than the physics."
        meta={[
          { label: 'Sites available', value: nf(filtered.length) },
          { label: 'Reports this session', value: nf(generated.length) },
        ]}
      />

      <div className="grid gap-3 xl:grid-cols-[1fr_1.1fr]">
        <Panel title="Pick a site" subtitle="Most-detected industrial sites in the current filter">
          <SiteTable
            sites={candidates}
            columns={['name', 'class', 'state', 'detections', 'confidence']}
            maxHeight={460}
            selectedId={selectedSiteId}
            onRowClick={(s) => {
              selectSite(s.id)
              logLine(role.id, `Loaded evidence for ${s.name}`)
            }}
          />
        </Panel>

        <Panel
          title={site ? `Evidence — ${site.name}` : 'Evidence'}
          subtitle={site ? `${site.predictedLabel} · confidence ${site.confidence.toFixed(2)}` : undefined}
          action={
            site && (
              <Button
                size="sm"
                className="gap-1.5 rounded-[9px]"
                onClick={() => {
                  setReportFor(site.id)
                  setGenerated((rows) => [{ id: site.id, name: site.name, at: istDate() }, ...rows].slice(0, 8))
                  logLine(role.id, `Evidence report generated for ${site.name}`)
                }}
              >
                <FileText size={14} strokeWidth={1.8} />
                Generate report
              </Button>
            )
          }
        >
          {site ? (
            <ShapEvidence siteId={site.id} />
          ) : (
            <EmptyState
              title="No site selected"
              body="Choose a site on the left to see what drove its classification."
            />
          )}
        </Panel>
      </div>

      <Panel title="Generated this session">
        {generated.length === 0 ? (
          <EmptyState
            title="No reports yet"
            body="Generating a report renders a printable evidence sheet and logs it to the console."
          />
        ) : (
          <ul className="divide-line panel-scroll max-h-[240px] divide-y overflow-y-auto overscroll-contain text-[12.5px]">
            {generated.map((row, i) => (
              <li key={`${row.id}-${i}`} className="flex items-center justify-between gap-4 py-2">
                <span className="truncate">{row.name}</span>
                <span className="text-ink-faint font-mono text-[11px]">{row.at}</span>
                <button
                  type="button"
                  onClick={() => setReportFor(row.id)}
                  className="text-ink-soft hover:text-ink shrink-0 text-[12px] underline-offset-4 hover:underline"
                >
                  Open
                </button>
              </li>
            ))}
          </ul>
        )}
      </Panel>

      <EvidenceReportDialog siteId={reportFor} open={reportFor !== null} onOpenChange={(o) => !o && setReportFor(null)} />
    </div>
  )
}
