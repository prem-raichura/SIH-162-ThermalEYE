import { useEffect, useState } from 'react'
import { Printer } from 'lucide-react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { loadSar, loadShap, loadSpectral, landcover, siteById } from '@/lib/data'
import type { LandCover, SarEntry, ShapEntry, SpectralEntry } from '@/lib/types'
import { coord, days, istDate, kelvin, nf, shortDate, sqm } from '@/lib/format'
import { CLASS_COLOR } from '@/lib/thermal'

/**
 * The printable evidence sheet behind "Generate report" (section 29). It separates what the
 * model saw from what the maps say, and closes with the non-claims of section 32 so the
 * caveats travel with the page.
 */
export function EvidenceReportDialog({
  siteId,
  open,
  onOpenChange,
}: {
  siteId: string | null
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const [shap, setShap] = useState<ShapEntry | null>(null)
  const [spectral, setSpectral] = useState<SpectralEntry | null>(null)
  const [sar, setSar] = useState<SarEntry | null>(null)

  useEffect(() => {
    if (!siteId || !open) return
    loadShap().then((all) => setShap(all[siteId] ?? null))
    loadSpectral().then((all) => setSpectral(all[siteId] ?? null))
    loadSar().then((all) => setSar(all[siteId] ?? null))
  }, [siteId, open])

  const site = siteById(siteId)
  if (!site) return null
  const cover = landcover[site.id]

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[88vh] overflow-y-auto sm:max-w-[760px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-[17px]">
            <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: CLASS_COLOR[site.predictedClass] }} />
            Evidence report — {site.name}
          </DialogTitle>
          <DialogDescription className="text-[12.5px]">
            Generated {istDate()} · {coord(site.lat, site.lon)} · {site.state}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 text-[12.5px]">
          <Section title="Assessment">
            <Grid
              rows={[
                ['Predicted source', site.predictedLabel],
                ['Confidence', site.confidence.toFixed(2)],
                ['Behaviour', site.behaviour === 'abnormal' ? 'Abnormal industrial event' : 'Normal industrial heat'],
                ['Deviation from own baseline', site.deviationPct > 0 ? `+${site.deviationPct}%` : 'within normal range'],
              ]}
            />
          </Section>

          <Section title="Thermal evidence">
            <Grid
              rows={[
                ['Retrieved source temperature', kelvin(site.tHot)],
                ['Dual-band contrast ΔT', `${site.deltaT} K`],
                ['Retrieved source area', sqm(site.sourceAreaM2)],
                ['Saturation fraction', site.saturationFraction.toFixed(3)],
                ['FRP density', `${site.frpDensity} MW/km²`],
                ['Night-only mean temperature', kelvin(site.nightTHotMean)],
              ]}
            />
          </Section>

          <Section title="Temporal evidence">
            <Grid
              rows={[
                ['Detections', nf(site.detectionCount)],
                ['Active days', days(site.activeDays)],
                ['Persistence', days(site.persistenceDays)],
                ['Night ratio', site.nightRatio.toFixed(2)],
                ['Observed window', `${shortDate(site.firstDetection)} – ${shortDate(site.lastDetection)}`],
                ['Normal FRP range', `${site.normalLow}–${site.normalHigh} MW`],
              ]}
            />
          </Section>

          {shap && (
            <Section title="Model evidence">
              <ul className="space-y-1">
                {shap.model.slice(0, 5).map((row) => (
                  <li key={row.feature} className="flex justify-between gap-4">
                    <span className="font-mono text-[11.5px]">{row.feature}</span>
                    <span className="text-ink-soft">{row.value}</span>
                    <span className="tnum w-14 text-right font-mono text-[11.5px]">
                      {row.contribution > 0 ? `+${row.contribution}` : row.contribution}
                    </span>
                  </li>
                ))}
              </ul>
            </Section>
          )}

          {shap && (
            <Section title="Contextual evidence">
              <ul className="space-y-1">
                {shap.context.slice(0, 4).map((row) => (
                  <li key={row.feature} className="flex justify-between gap-4">
                    <span className="font-mono text-[11.5px]">{row.feature}</span>
                    <span className="text-ink-soft">{row.value}</span>
                    <span className="tnum w-14 text-right font-mono text-[11.5px]">
                      {row.contribution > 0 ? `+${row.contribution}` : row.contribution}
                    </span>
                  </li>
                ))}
              </ul>
            </Section>
          )}

          <Section title="Satellite and land cover">
            <Grid
              rows={[
                ['Sentinel-2', spectral?.available ? `available · cloud ${spectral.cloudFraction}` : (spectral?.unavailableReason ?? 'unavailable')],
                ['ΔNBR', spectral?.available ? String(spectral.dNbr) : '—'],
                ['Sentinel-1', sar?.available ? sar.read : 'no usable pass'],
                ['ΔVV', sar?.available ? String(sar.dVv) : '—'],
                ['Dominant land cover', cover ? dominantCover(cover) : '—'],
                ['Built-up / cropland', cover ? `${cover.builtup}% / ${cover.cropland}%` : '—'],
              ]}
            />
          </Section>

          <Section title="Facility context">
            <Grid
              rows={[
                ['Register source', site.registerSource.toUpperCase()],
                ['Match confidence', site.matchConfidence ?? '—'],
                ['Nearest mapped facility', `${site.nearestFacilityKm} km`],
                ['Coverage quality score', site.coverageQualityScore.toFixed(2)],
              ]}
            />
          </Section>

          <section className="border-line text-ink-faint border-t pt-3 text-[11px]">
            <p className="font-medium">What this report does not claim</p>
            <p className="mt-1">
              A nearby facility does not prove causation. FIRMS does not identify industrial fires on its own and
              Sentinel-1 does not detect heat. Retrieved temperature and source area are two-band estimates carrying
              uncertainty, undefined for saturated pixels. OSM and every register are incomplete, and absence of a
              mapped facility is not evidence that no facility exists.
            </p>
          </section>
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <Button variant="outline" className="rounded-[10px]" onClick={() => onOpenChange(false)}>
            Close
          </Button>
          <Button className="gap-2 rounded-[10px]" onClick={() => window.print()}>
            <Printer size={15} strokeWidth={1.8} />
            Print
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

const COVER_LABEL: Record<keyof LandCover, string> = {
  forest: 'Forest',
  cropland: 'Cropland',
  builtup: 'Built-up',
  bare: 'Bare / sparse',
  grass: 'Grassland',
  water: 'Water',
}

function dominantCover(cover: LandCover) {
  const entries = Object.entries(cover) as [keyof LandCover, number][]
  const [name, value] = entries.sort((a, b) => b[1] - a[1])[0]
  return `${COVER_LABEL[name]} (${value}%)`
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h4 className="border-line mb-2 border-b pb-1 text-[12px] font-semibold">{title}</h4>
      {children}
    </section>
  )
}

function Grid({ rows }: { rows: [string, string][] }) {
  return (
    <dl className="grid grid-cols-1 gap-x-8 gap-y-1 sm:grid-cols-2">
      {rows.map(([label, value]) => (
        <div key={label} className="flex justify-between gap-3">
          <dt className="text-ink-soft">{label}</dt>
          <dd className="tnum text-right font-mono text-[11.5px]">{value}</dd>
        </div>
      ))}
    </dl>
  )
}
