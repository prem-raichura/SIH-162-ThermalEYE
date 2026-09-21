import { useMemo, useState } from 'react'
import { FileText } from 'lucide-react'
import { PageHeader } from '@/components/shell/PageHeader'
import { Panel } from '@/components/panels/Panel'
import { Button } from '@/components/ui/button'
import { SiteTable } from '@/components/panels/SiteTable'
import { ShapEvidence } from '@/components/panels/ShapEvidence'
import { FlareSignature } from '@/components/panels/FlareSignature'
import { EmptyState } from '@/components/panels/EmptyState'
import { EvidenceReportDialog } from '@/components/panels/EvidenceReportDialog'
import { flareSignature, usePpacSites } from './usePpacData'
import { useSettingsFor } from '@/store/useRoleSettings'
import { useFilters } from '@/store/useFilters'
import { siteById } from '@/lib/data'
import { nf } from '@/lib/format'
import type { Role } from '@/lib/roles'

export function PpacReports({ role }: { role: Role }) {
  const settings = useSettingsFor('ppac')
  const { filtered } = usePpacSites()
  const selectSite = useFilters((s) => s.selectSite)
  const selectedSiteId = useFilters((s) => s.selectedSiteId)
  const [reportFor, setReportFor] = useState<string | null>(null)

  const candidates = useMemo(() => [...filtered].sort((a, b) => (b.tHot ?? 0) - (a.tHot ?? 0)), [filtered])
  const site = siteById(selectedSiteId)

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        role={role}
        eyebrow="Explainability"
        title="Flaring evidence"
        description="What drove each verdict, with the thermal physics kept apart from what the maps say."
        meta={[{ label: 'Sites available', value: nf(filtered.length) }]}
      />

      <div className="grid gap-3 xl:grid-cols-[1fr_1.15fr]">
        <div className="relative min-h-[420px]">
          <Panel title="Pick a site" subtitle="Hottest hydrocarbon sites first" className="absolute inset-0">
            <SiteTable
              sites={candidates}
              columns={['name', 'class', 'state', 'tHot', 'confidence']}
              fill
              selectedId={selectedSiteId}
              onRowClick={(s) => {
                selectSite(s.id)
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
                    }}
                  >
                    <FileText size={14} strokeWidth={1.8} />
                    Generate report
                  </Button>
                }
              >
                <ShapEvidence siteId={site.id} />
              </Panel>
              <Panel title="Flare signature">
                <FlareSignature checks={flareSignature(site, settings)} siteName={site.name} />
              </Panel>
            </>
          ) : (
            <Panel>
              <EmptyState title="No site selected" body="Choose a site to see what drove its classification." />
            </Panel>
          )}
        </div>
      </div>

      <EvidenceReportDialog siteId={reportFor} open={reportFor !== null} onOpenChange={(o) => !o && setReportFor(null)} />
    </div>
  )
}
