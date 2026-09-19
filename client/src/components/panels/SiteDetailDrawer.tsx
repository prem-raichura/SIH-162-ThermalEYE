import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { BaselineBandChart } from './BaselineBandChart'
import { ShapEvidence } from './ShapEvidence'
import { LandCoverDonut } from './LandCoverDonut'
import { SpectralIndexChart } from './SpectralIndexChart'
import { SarEvidence } from './SarEvidence'
import { QualityChip } from './QualityChip'
import { siteById } from '@/lib/data'
import { useFilters } from '@/store/useFilters'
import { logLine } from '@/store/useConsole'
import { CLASS_COLOR, tHotColor } from '@/lib/thermal'
import { coord, days, kelvin, megawatt, nf, shortDate, sqm } from '@/lib/format'
import type { Role } from '@/lib/roles'

/** The one place a site is explained in full: identity, physics, history, evidence, context. */
export function SiteDetailDrawer({ role, onGenerateReport }: { role: Role; onGenerateReport?: (siteId: string) => void }) {
  const selectedSiteId = useFilters((s) => s.selectedSiteId)
  const detailOpen = useFilters((s) => s.detailOpen)
  const closeDetail = useFilters((s) => s.closeDetail)
  const site = siteById(selectedSiteId)

  if (!site) return null

  const physics: [string, string][] = [
    ['Retrieved source temperature', kelvin(site.tHot)],
    ['Peak retrieved temperature', kelvin(site.tHotMax)],
    ['Night-only mean', kelvin(site.nightTHotMean)],
    ['Dual-band contrast ΔT', `${site.deltaT} K`],
    ['Retrieved source area', sqm(site.sourceAreaM2)],
    ['Saturation fraction', site.saturationFraction.toFixed(3)],
    ['Mean FRP', megawatt(site.frpMean)],
    ['Peak FRP', megawatt(site.frpPeak)],
    ['FRP density', `${site.frpDensity} MW/km²`],
    ['Pixel footprint', `${site.pixelAreaKm2} km²`],
  ]

  const temporal: [string, string][] = [
    ['Detections', nf(site.detectionCount)],
    ['Active days', days(site.activeDays)],
    ['Persistence', days(site.persistenceDays)],
    ['Recurrence rate', site.recurrenceRate.toFixed(3)],
    ['Night ratio', site.nightRatio.toFixed(2)],
    ['FRP slope', site.frpSlope.toFixed(3)],
    ['First detection', shortDate(site.firstDetection)],
    ['Last detection', shortDate(site.lastDetection)],
  ]

  const context: [string, string][] = [
    ['Register source', site.registerSource.toUpperCase()],
    ['Match confidence', site.matchConfidence ?? '—'],
    ['Nearest facility', `${site.nearestFacilityKm} km`],
    ['OSM industrial density, 5 km', String(site.osmIndustrialDensity5km)],
    ['Register facilities, 5 km', String(site.registerFacilityCount5km)],
    ['Data quality', site.dataQuality === 'nrt' ? 'NRT' : 'Standard'],
  ]

  return (
    // Closing the drawer keeps the site selected, so the page's own panels stay filled.
    <Sheet open={detailOpen} onOpenChange={(open) => !open && closeDetail()}>
      <SheetContent side="right" className="w-full gap-0 overflow-y-auto p-0 sm:max-w-[520px]">
        <SheetHeader className="border-line gap-1 border-b px-5 py-4">
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: CLASS_COLOR[site.predictedClass] }} />
            <SheetTitle className="text-[16px]">{site.name}</SheetTitle>
          </div>
          <SheetDescription className="text-[12.5px]">
            {site.predictedLabel} · {site.state} · confidence {site.confidence.toFixed(2)}
          </SheetDescription>
          <p className="text-ink-faint font-mono text-[11px]">{coord(site.lat, site.lon)}</p>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <span
              className="rounded-full px-2.5 py-0.5 text-[11px]"
              style={{
                backgroundColor: site.behaviour === 'abnormal' ? 'var(--color-terra-dim)' : 'var(--color-forest-dim)',
                color: site.behaviour === 'abnormal' ? 'var(--color-terracotta)' : 'var(--color-forest)',
              }}
            >
              {site.behaviour === 'abnormal' ? 'Abnormal industrial event' : 'Normal industrial heat'}
            </span>
            <QualityChip label="Coverage" score={site.coverageQualityScore} />
          </div>
          {onGenerateReport && (
            <Button
              className="mt-3 w-fit rounded-[10px]"
              onClick={() => {
                onGenerateReport(site.id)
                logLine(role.id, `Evidence report generated for ${site.name}`)
              }}
            >
              Generate report
            </Button>
          )}
        </SheetHeader>

        <div className="px-5 py-4">
          <div className="flex items-baseline gap-5">
            <div>
              <p className="text-ink-faint text-[10.5px] tracking-wide uppercase">Source temperature</p>
              <p className="font-display tnum text-[30px] leading-none" style={{ color: tHotColor(site.tHot) }}>
                {kelvin(site.tHot)}
              </p>
            </div>
            <div>
              <p className="text-ink-faint text-[10.5px] tracking-wide uppercase">Current FRP</p>
              <p className="font-display tnum text-[30px] leading-none">{site.currentFrp}</p>
            </div>
            <div>
              <p className="text-ink-faint text-[10.5px] tracking-wide uppercase">Normal range</p>
              <p className="tnum font-mono text-[13px]">
                {site.normalLow}–{site.normalHigh} MW
              </p>
            </div>
          </div>

          <Tabs defaultValue="thermal" className="mt-4">
            <TabsList className="w-full">
              <TabsTrigger value="thermal">Thermal</TabsTrigger>
              <TabsTrigger value="history">History</TabsTrigger>
              <TabsTrigger value="evidence">Evidence</TabsTrigger>
              <TabsTrigger value="context">Context</TabsTrigger>
            </TabsList>

            <TabsContent value="thermal" className="pt-3">
              <ReadingList rows={physics} />
              <p className="text-ink-faint mt-3 text-[11px]">
                T_hot and source area are two-band estimates with uncertainty, not measurements, and are undefined for
                saturated pixels.
              </p>
            </TabsContent>

            <TabsContent value="history" className="pt-3">
              <BaselineBandChart site={site} />
              <div className="mt-4">
                <ReadingList rows={temporal} />
              </div>
            </TabsContent>

            <TabsContent value="evidence" className="space-y-5 pt-3">
              <ShapEvidence siteId={site.id} />
              <div>
                <h4 className="mb-2 text-[12.5px] font-semibold">Sentinel-2 optical</h4>
                <SpectralIndexChart siteId={site.id} height={160} />
              </div>
              <div>
                <h4 className="mb-2 text-[12.5px] font-semibold">Sentinel-1 structural</h4>
                <SarEvidence siteId={site.id} />
              </div>
            </TabsContent>

            <TabsContent value="context" className="space-y-4 pt-3">
              <LandCoverDonut siteId={site.id} height={150} />
              <ReadingList rows={context} />
            </TabsContent>
          </Tabs>
        </div>
      </SheetContent>
    </Sheet>
  )
}

function ReadingList({ rows }: { rows: [string, string][] }) {
  return (
    <dl className="divide-line divide-y text-[12.5px]">
      {rows.map(([label, value]) => (
        <div key={label} className="flex items-baseline justify-between gap-4 py-1.5">
          <dt className="text-ink-soft">{label}</dt>
          <dd className="tnum font-mono text-[11.5px]">{value}</dd>
        </div>
      ))}
    </dl>
  )
}
