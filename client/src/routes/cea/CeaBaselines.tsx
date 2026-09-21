import { useMemo, useState } from 'react'
import { PageHeader } from '@/components/shell/PageHeader'
import { Panel } from '@/components/panels/Panel'
import { SiteTable } from '@/components/panels/SiteTable'
import { BaselineBandChart } from '@/components/panels/BaselineBandChart'
import { ScanGeometryDemo } from '@/components/panels/ScanGeometryDemo'
import { EmptyState } from '@/components/panels/EmptyState'
import { SiteDetailDrawer } from '@/components/panels/SiteDetailDrawer'
import { EvidenceReportDialog } from '@/components/panels/EvidenceReportDialog'
import { useCeaSites } from './useCeaData'
import { useFilters } from '@/store/useFilters'
import { logLine } from '@/store/useConsole'
import { model, siteById } from '@/lib/data'
import { days, megawatt, nf } from '@/lib/format'
import type { Role } from '@/lib/roles'
import { useSettingsFor } from '@/store/useRoleSettings'

/** Section 18 — each station's own long-term thermal profile, which is what deviation means. */
export function CeaBaselines({ role }: { role: Role }) {
  const settings = useSettingsFor('cea')
  const { filtered, controls } = useCeaSites()
  const selectSite = useFilters((s) => s.selectSite)
  const selectedSiteId = useFilters((s) => s.selectedSiteId)
  const [reportFor, setReportFor] = useState<string | null>(null)

  const ranked = useMemo(() => [...filtered].sort((a, b) => b.detectionCount - a.detectionCount), [filtered])
  const site = siteById(selectedSiteId) ?? ranked[0]

  const profile: [string, string][] = site
    ? [
        ['Normal FRP range', `${site.normalLow}–${site.normalHigh} MW`],
        ['Mean FRP', megawatt(site.frpMean)],
        ['Peak FRP', megawatt(site.frpPeak)],
        ['FRP density', `${site.frpDensity} MW/km²`],
        ['Detection frequency', `${(site.detectionCount / Math.max(site.persistenceDays, 1)).toFixed(2)} per day`],
        ['Active days', days(site.activeDays)],
        ['Night activity', site.nightRatio.toFixed(2)],
        ['Recurrence rate', site.recurrenceRate.toFixed(3)],
        ['Trend', site.frpSlope > 0 ? `rising ${site.frpSlope.toFixed(3)}` : `falling ${site.frpSlope.toFixed(3)}`],
      ]
    : []

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        role={role}
        eyebrow="Baseline"
        title="Station baselines"
        description="What each station normally does, so a deviation can be read as a deviation rather than as a big number."
        meta={[
          { label: 'Stations', value: nf(ranked.length) },
          { label: 'With history', value: nf(ranked.filter((s) => s.detectionCount > settings.historyMinDetections).length) },
        ]}
        action={site ? 'Generate report' : undefined}
        onAction={() => {
          if (!site) return
          setReportFor(site.id)
          logLine(role.id, `Evidence report generated for ${site.name}`)
        }}
      />

      <div className="grid gap-3 xl:grid-cols-[1fr_1.4fr]">
        <div className="relative min-h-[420px]">
          <Panel title="Stations" subtitle="Most-detected first" className="absolute inset-0">
            <SiteTable
              sites={ranked}
              columns={['name', 'fuel', 'state', 'detections', 'status']}
              fill
              selectedId={site?.id ?? null}
              onRowClick={(s) => {
                selectSite(s.id)
                logLine(role.id, `Baseline opened for ${s.name}`)
              }}
            />
          </Panel>
        </div>

        <div className="flex min-w-0 flex-col gap-3">
          {site ? (
            <>
              <Panel
                title={`FRP baseline — ${site.name}`}
                subtitle="Observed FRP against this station's own normal range"
                action={
                  <span
                    className="rounded-full px-2.5 py-0.5 text-[11px]"
                    style={{
                      backgroundColor:
                        site.behaviour === 'abnormal' ? 'var(--color-terra-dim)' : 'var(--color-forest-dim)',
                      color: site.behaviour === 'abnormal' ? 'var(--color-terracotta)' : 'var(--color-forest)',
                    }}
                  >
                    {site.behaviour === 'abnormal' ? 'Abnormal industrial event' : 'Normal industrial heat'}
                  </span>
                }
              >
                <BaselineBandChart site={site} height={230} />
              </Panel>

              <div className="grid gap-3 lg:grid-cols-2">
                <Panel title="Long-term profile">
                  <dl className="divide-line divide-y text-[12.5px]">
                    {profile.map(([label, value]) => (
                      <div key={label} className="flex items-baseline justify-between gap-4 py-1.5">
                        <dt className="text-ink-soft">{label}</dt>
                        <dd className="tnum font-mono text-[11.5px]">{value}</dd>
                      </div>
                    ))}
                  </dl>
                </Panel>

                <Panel title="Why density, not raw FRP" subtitle="Section 7.2 — scan geometry">
                  <ScanGeometryDemo site={site} />
                </Panel>
              </div>
            </>
          ) : (
            <Panel>
              <EmptyState title="No station selected" body="Pick a station on the left to see its baseline." />
            </Panel>
          )}
        </div>
      </div>

      {/* A baseline is only as trustworthy as the negatives it was checked against, so the
          control result sits with the baselines rather than on the overview console. */}
      <Panel
        title="Why the negative controls matter"
        subtitle={`${nf(controls.length)} monitored, ${nf(model.controls.total)} in the register`}
      >
        <p className="text-ink-soft text-[12.5px]">{model.controls.note}</p>
      </Panel>

      <SiteDetailDrawer role={role} onGenerateReport={setReportFor} />
      <EvidenceReportDialog siteId={reportFor} open={reportFor !== null} onOpenChange={(o) => !o && setReportFor(null)} />
    </div>
  )
}
