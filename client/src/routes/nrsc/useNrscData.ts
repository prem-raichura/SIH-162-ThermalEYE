import { useMemo } from 'react'
import { sites as allSites, withinWindow } from '@/lib/data'
import { useFilters } from '@/store/useFilters'
import { useNrsc, type Availability, type ProvenanceFilters } from '@/store/useNrsc'
import type { SourceClass, ThermalSite } from '@/lib/types'

const matchesAvailability = (available: boolean, want: Availability) =>
  want === 'any' || (want === 'yes' ? available : !available)

function passesProvenance(site: ThermalSite, f: ProvenanceFilters): boolean {
  if (f.register !== 'all' && site.registerSource !== f.register) return false
  if (f.match !== 'all' && site.matchConfidence !== f.match) return false
  if (f.dataQuality !== 'all' && site.dataQuality !== f.dataQuality) return false
  if (!matchesAvailability(site.sentinel1Available, f.sentinel1)) return false
  if (!matchesAvailability(site.sentinel2Available, f.sentinel2)) return false
  // A missing acquisition has no score to compare, so a floor above zero excludes it.
  if (f.minSarQuality > 0 && (!site.sentinel1Available || site.sarQualityScore < f.minSarQuality)) return false
  if (f.minOpticalQuality > 0 && (!site.sentinel2Available || site.opticalQualityScore < f.minOpticalQuality)) return false
  if (site.sentinel2Available && site.cloudFraction > f.maxCloudFraction) return false
  if (site.temporalGapDays > f.maxTemporalGap) return false
  return true
}

export interface NrscData {
  /** The whole layer: every class, both branches and the controls. */
  layer: ThermalSite[]
  /** The layer after the shared filters — what the map and the site table show. */
  filtered: ThermalSite[]
  /** The filtered layer after the provenance filters — what Export writes. */
  published: ThermalSite[]
  states: string[]
  classes: SourceClass[]
  counts: {
    registerBacked: number
    osmOnly: number
    unmapped: number
    nrt: number
    sentinel1: number
    sentinel2: number
    bothModalities: number
  }
}

/**
 * NRSC republishes the layer rather than policing it, so this role applies no branch or class
 * remit of its own — every record the pipeline produced is in scope, including the
 * non-thermal controls, and each one carries where it came from.
 */
export function useNrscData(): NrscData {
  const classes = useFilters((s) => s.classes)
  const state = useFilters((s) => s.state)
  const window = useFilters((s) => s.window)
  const behaviour = useFilters((s) => s.behaviour)
  const search = useFilters((s) => s.search)
  const provenance = useNrsc((s) => s.provenance)

  const filtered = useMemo(() => {
    const needle = search.trim().toLowerCase()
    return allSites.filter((s) => {
      if (classes && classes.length > 0 && !classes.includes(s.predictedClass)) return false
      if (state && s.state !== state) return false
      if (behaviour !== 'all' && s.behaviour !== behaviour) return false
      // Controls carry no detections, so a time window would silently drop them.
      if (window !== 'all' && s.lastDetection !== null && !withinWindow(s.lastDetection, window, s.id)) return false
      if (needle && !`${s.name} ${s.operator ?? ''} ${s.state}`.toLowerCase().includes(needle)) return false
      return true
    })
  }, [classes, state, window, behaviour, search])

  const published = useMemo(() => filtered.filter((s) => passesProvenance(s, provenance)), [filtered, provenance])

  const states = useMemo(() => [...new Set(allSites.map((s) => s.state))].sort(), [])
  const classList = useMemo(() => [...new Set(allSites.map((s) => s.predictedClass))], [])

  const counts = useMemo(
    () => ({
      registerBacked: filtered.filter((s) => s.registerSource !== 'none' && s.registerSource !== 'osm').length,
      osmOnly: filtered.filter((s) => s.registerSource === 'osm').length,
      unmapped: filtered.filter((s) => s.registerSource === 'none').length,
      nrt: filtered.filter((s) => s.dataQuality === 'nrt').length,
      sentinel1: filtered.filter((s) => s.sentinel1Available).length,
      sentinel2: filtered.filter((s) => s.sentinel2Available).length,
      bothModalities: filtered.filter((s) => s.sentinel1Available && s.sentinel2Available).length,
    }),
    [filtered],
  )

  return { layer: allSites, filtered, published, states, classes: classList, counts }
}

/** Buckets a 0–1 score into ten bins, for the quality distributions. */
export function scoreHistogram(values: number[], bins = 10) {
  const rows = Array.from({ length: bins }, (_, i) => ({
    bucket: `${(i / bins).toFixed(1)}–${((i + 1) / bins).toFixed(1)}`,
    count: 0,
  }))
  for (const v of values) {
    const index = Math.min(bins - 1, Math.max(0, Math.floor(v * bins)))
    rows[index].count += 1
  }
  return rows
}
