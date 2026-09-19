import { useMemo, useState } from 'react'
import { FileText } from 'lucide-react'
import { PageHeader } from '@/components/shell/PageHeader'
import { Panel } from '@/components/panels/Panel'
import { Button } from '@/components/ui/button'
import { SiteTable } from '@/components/panels/SiteTable'
import { ShapEvidence } from '@/components/panels/ShapEvidence'
import { BaselineBandChart } from '@/components/panels/BaselineBandChart'
import { EmptyState } from '@/components/panels/EmptyState'
import { EvidenceReportDialog } from '@/components/panels/EvidenceReportDialog'
import { useCeaSites } from './useCeaData'
import { useFilters } from '@/store/useFilters'
import { logLine } from '@/store/useConsole'
import { siteById } from '@/lib/data'
import { nf } from '@/lib/format'
import type { Role } from '@/lib/roles'

export function CeaReports({ role }: { role: Role }) {
  const { filtered } = useCeaSites()
  const selectSite = useFilters((s) => s.selectSite)
  const selectedSiteId = useFilters((s) => s.selectedSiteId)
  const [reportFor, setReportFor] = useState<string | null>(null)

  const candidates = useMemo(() => [...filtered].sort((a, b) => (b.capacity ?? 0) - (a.capacity ?? 0)), [filtered])
  const site = siteById(selectedSiteId)

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        role={role}
        eyebrow="Explainability"
        title="Station evidence"
        description="What drove each verdict, with the thermal physics kept apart from what the registers say."
        meta={[{ label: 'Stations available', value: nf(filtered.length) }]}
      />

      <div className="grid gap-3 xl:grid-cols-[1fr_1.15fr]">
        <div className="relative min-h-[420px]">
          <Panel title="Pick a station" subtitle="Largest capacity first" className="absolute inset-0">
            <SiteTable
              sites={candidates}
              columns={['name', 'fuel', 'capacity', 'state', 'confidence']}
              fill
              selectedId={selectedSiteId}
              onRowClick={(s) => {
                selectSite(s.id)
                logLine(role.id, `Loaded evidence for ${s.name}`)
              }}
            />
          </Panel>
        </div>

        <div className="flex min-w-0 flex-col gap-3">
          {site ? (
            <>
              <Panel
                title={`Evidence — ${site.name}`}
                subtitle={`${site.predictedLabel} · confidence ${site.confidence.toFixed(2)}`}
                action={
                  <Button
                    size="sm"
                    className="gap-1.5 rounded-[9px]"
                    onClick={() => {
                      setReportFor(site.id)
                      logLine(role.id, `Evidence report generated for ${site.name}`)
                    }}
                  >
                    <FileText size={14} strokeWidth={1.8} />
                    Generate report
                  </Button>
                }
              >
                <ShapEvidence siteId={site.id} />
              </Panel>
              <Panel title="Baseline">
                <BaselineBandChart site={site} height={190} />
              </Panel>
            </>
          ) : (
            <Panel>
              <EmptyState title="No station selected" body="Choose a station to see what drove its classification." />
            </Panel>
          )}
        </div>
      </div>

      <EvidenceReportDialog siteId={reportFor} open={reportFor !== null} onOpenChange={(o) => !o && setReportFor(null)} />
    </div>
  )
}
