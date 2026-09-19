import { useState } from 'react'
import { FileText } from 'lucide-react'
import { PageHeader } from '@/components/shell/PageHeader'
import { Panel } from '@/components/panels/Panel'
import { Button } from '@/components/ui/button'
import { SiteTable } from '@/components/panels/SiteTable'
import { ShapEvidence } from '@/components/panels/ShapEvidence'
import { QualityChip } from '@/components/panels/QualityChip'
import { EmptyState } from '@/components/panels/EmptyState'
import { EvidenceReportDialog } from '@/components/panels/EvidenceReportDialog'
import { SiteDetailDrawer } from '@/components/panels/SiteDetailDrawer'
import { useNrscData } from './useNrscData'
import { useFilters } from '@/store/useFilters'
import { logLine } from '@/store/useConsole'
import { siteById } from '@/lib/data'
import { REGISTER_LABEL } from '@/lib/classes'
import { coord, nf, shortDate } from '@/lib/format'
import type { Role } from '@/lib/roles'

/** A single record, end to end: what it is, what drove that verdict, and where it came from. */
export function NrscReports({ role }: { role: Role }) {
  const { published } = useNrscData()
  const selectSite = useFilters((s) => s.selectSite)
  const openDetail = useFilters((s) => s.openDetail)
  const selectedSiteId = useFilters((s) => s.selectedSiteId)
  const [reportFor, setReportFor] = useState<string | null>(null)

  const site = siteById(selectedSiteId) ?? published[0]

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        role={role}
        eyebrow="Record sheet"
        title="Reports"
        description="The per-record sheet NRSC hands on: the verdict, the evidence behind it, and the provenance a republisher has to be able to answer for."
        meta={[{ label: 'Records available', value: nf(published.length) }]}
        action="Generate report"
        onAction={() => {
          setReportFor(site?.id ?? null)
          logLine(role.id, `Evidence report generated for ${site?.name ?? 'the selected record'}`)
        }}
      />

      <div className="grid gap-3 xl:grid-cols-[1fr_1.15fr]">
        <div className="relative min-h-[460px]">
          <Panel title="Pick a record" subtitle="Everything passing the current filters" className="absolute inset-0">
            <SiteTable
              sites={published}
              columns={['name', 'class', 'state', 'confidence', 'lastDetection']}
              fill
              selectedId={selectedSiteId}
              onRowClick={(s) => {
                selectSite(s.id)
                logLine(role.id, `Loaded the record sheet for ${s.name}`)
              }}
            />
          </Panel>
        </div>

        <div className="flex min-w-0 flex-col gap-3">
          {site ? (
            <>
              <Panel
                title={`Provenance — ${site.name}`}
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
                <dl className="divide-line divide-y text-[12.5px]">
                  <Row label="Register source" value={REGISTER_LABEL[site.registerSource]} />
                  <Row label="Match confidence" value={site.matchConfidence ?? 'no register join'} />
                  <Row label="FIRMS data quality" value={site.dataQuality === 'nrt' ? 'NRT' : 'Standard'} />
                  <Row
                    label="Sentinel-1"
                    value={site.sentinel1Available ? '' : 'no usable pass'}
                    chip={site.sentinel1Available ? <QualityChip label="SAR" score={site.sarQualityScore} /> : null}
                  />
                  <Row
                    label="Sentinel-2"
                    value={site.sentinel2Available ? `cloud ${site.cloudFraction.toFixed(2)}` : 'no clear scene'}
                    chip={
                      site.sentinel2Available ? <QualityChip label="Optical" score={site.opticalQualityScore} /> : null
                    }
                  />
                  <Row label="Temporal gap" value={`${site.temporalGapDays} d`} />
                  <Row label="Coordinates" value={coord(site.lat, site.lon)} />
                  <Row label="Last detection" value={shortDate(site.lastDetection)} />
                </dl>

                <button
                  type="button"
                  onClick={() => {
                    selectSite(site.id)
                    openDetail()
                    logLine(role.id, `Full record opened for ${site.name}`)
                  }}
                  className="text-ink-soft hover:text-ink mt-3 self-start text-[12px] underline-offset-4 hover:underline"
                >
                  Full record
                </button>
              </Panel>

              <Panel title="What drove the verdict" subtitle="Thermal physics kept apart from register context">
                <ShapEvidence siteId={site.id} />
              </Panel>
            </>
          ) : (
            <Panel>
              <EmptyState
                title="No record selected"
                body="Choose a row on the left, or relax a provenance filter if the list is empty."
              />
            </Panel>
          )}
        </div>
      </div>

      <SiteDetailDrawer role={role} onGenerateReport={setReportFor} />
      <EvidenceReportDialog siteId={reportFor} open={reportFor !== null} onOpenChange={(o) => !o && setReportFor(null)} />
    </div>
  )
}

function Row({ label, value, chip }: { label: string; value: string; chip?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4 py-2">
      <dt className="text-ink-soft">{label}</dt>
      <dd className="tnum flex items-center gap-2 text-right font-mono text-[12px]">
        {chip}
        {value}
      </dd>
    </div>
  )
}
