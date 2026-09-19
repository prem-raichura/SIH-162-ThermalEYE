import { useMemo, useState } from 'react'
import { Moon, Sun } from 'lucide-react'
import { PageHeader } from '@/components/shell/PageHeader'
import { Panel } from '@/components/panels/Panel'
import { SiteTable } from '@/components/panels/SiteTable'
import { BaselineBandChart } from '@/components/panels/BaselineBandChart'
import { EmptyState } from '@/components/panels/EmptyState'
import { EvidenceReportDialog } from '@/components/panels/EvidenceReportDialog'
import { SiteDetailDrawer } from '@/components/panels/SiteDetailDrawer'
import { Button } from '@/components/ui/button'
import { usePpacSites } from './usePpacData'
import { useFilters } from '@/store/useFilters'
import { logLine } from '@/store/useConsole'
import { siteById } from '@/lib/data'
import { kelvin, megawatt, nf, sqm } from '@/lib/format'
import { cn } from '@/lib/utils'
import type { Role } from '@/lib/roles'

/**
 * Per-facility baseline (section 18) with the normal/abnormal verdict of section 19. The
 * day/night switch changes which retrieval is quoted — night-only is the clean one for
 * flares, because reflected sunlight contaminates the 4 µm channel during the day.
 */
export function PpacAnalysis({ role }: { role: Role }) {
  const { filtered } = usePpacSites()
  const selectSite = useFilters((s) => s.selectSite)
  const selectedSiteId = useFilters((s) => s.selectedSiteId)
  const [nightOnly, setNightOnly] = useState(true)
  const [reportFor, setReportFor] = useState<string | null>(null)

  const ranked = useMemo(
    () => [...filtered].sort((a, b) => b.detectionCount - a.detectionCount),
    [filtered],
  )
  const site = siteById(selectedSiteId) ?? ranked[0]

  const readings: [string, string][] = site
    ? [
        ['Retrieved source temperature', kelvin(nightOnly ? site.nightTHotMean : site.tHot)],
        ['Dual-band contrast ΔT', `${site.deltaT ?? 0} K`],
        ['Retrieved source area', sqm(site.sourceAreaM2)],
        ['Saturation fraction', site.saturationFraction.toFixed(3)],
        ['Night ratio', site.nightRatio.toFixed(2)],
        ['Mean FRP', megawatt(site.frpMean)],
        ['FRP density', `${site.frpDensity} MW/km²`],
        ['Detections', nf(site.detectionCount)],
      ]
    : []

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        role={role}
        eyebrow="Baseline"
        title="Flaring analysis"
        description="Each facility against its own history. Deviation only means something relative to what that site normally does."
        meta={[
          { label: 'Sites', value: nf(ranked.length) },
          { label: 'Profile', value: nightOnly ? 'Night-only' : 'All passes' },
        ]}
        action={site ? 'Generate report' : undefined}
        onAction={() => {
          if (!site) return
          setReportFor(site.id)
          logLine(role.id, `Evidence report generated for ${site.name}`)
        }}
      />

      <div className="grid gap-3 xl:grid-cols-[1fr_1.35fr]">
        <div className="relative min-h-[420px]">
          <Panel title="Facilities" subtitle="Most-detected hydrocarbon sites" className="absolute inset-0">
            <SiteTable
              sites={ranked}
              columns={['name', 'state', 'tHot', 'detections', 'status']}
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
                title={`FRP trend — ${site.name}`}
                subtitle="Observed FRP against this site's own normal range"
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

              <Panel
                title="Retrieved profile"
                subtitle={
                  nightOnly
                    ? 'Night passes only — no solar contamination in the 4 µm channel'
                    : 'All passes, day and night'
                }
                action={
                  <div className="border-line flex rounded-full border p-0.5">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setNightOnly(true)
                        logLine(role.id, 'Profile switched to the night-only retrieval')
                      }}
                      className={cn('h-7 gap-1.5 rounded-full px-2.5 text-[11.5px]', nightOnly && 'bg-ink text-paper')}
                    >
                      <Moon size={13} strokeWidth={1.9} />
                      Night
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setNightOnly(false)
                        logLine(role.id, 'Profile switched to all passes')
                      }}
                      className={cn('h-7 gap-1.5 rounded-full px-2.5 text-[11.5px]', !nightOnly && 'bg-ink text-paper')}
                    >
                      <Sun size={13} strokeWidth={1.9} />
                      All
                    </Button>
                  </div>
                }
              >
                <dl className="divide-line divide-y text-[12.5px]">
                  {readings.map(([label, value]) => (
                    <div key={label} className="flex items-baseline justify-between gap-4 py-1.5">
                      <dt className="text-ink-soft">{label}</dt>
                      <dd className="tnum font-mono text-[11.5px]">{value}</dd>
                    </div>
                  ))}
                </dl>
                <p className="text-ink-faint mt-2 text-[11px]">
                  Only the retrieved temperature differs between the two profiles here; the FRP series covers every
                  pass either way.
                </p>
              </Panel>
            </>
          ) : (
            <Panel>
              <EmptyState title="No facility selected" body="Pick a site on the left to see its baseline." />
            </Panel>
          )}
        </div>
      </div>

      <SiteDetailDrawer role={role} onGenerateReport={setReportFor} />
      <EvidenceReportDialog siteId={reportFor} open={reportFor !== null} onOpenChange={(o) => !o && setReportFor(null)} />
    </div>
  )
}
