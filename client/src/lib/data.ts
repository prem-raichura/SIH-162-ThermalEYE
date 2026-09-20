/**
 * Typed access to the static dataset.
 *
 * Small files are bundled (imported). The five heavy ones — detections, timeseries, shap,
 * spectral, sar — plus the boundary geometry live in /public and are fetched on demand so
 * the initial bundle stays light. Everything is local; nothing leaves the machine.
 */
import sitesRaw from '@/data/sites.json'
import unmappedRaw from '@/data/unmapped.json'
import alertsRaw from '@/data/alerts.json'
import coverageRaw from '@/data/coverage.json'
import landcoverRaw from '@/data/landcover.json'
import modelRaw from '@/data/model.json'
import validationRaw from '@/data/validation.json'
import sourcesRaw from '@/data/sources.json'
import { ageInDays } from './acquisitionTime'
import metaRaw from '@/data/meta.json'

import type { FeatureCollection } from 'geojson'
import type {
  Alert,
  Coverage,
  Detection,
  LandCover,
  Meta,
  ModelReport,
  SarEntry,
  ShapEntry,
  SiteSeries,
  SourceClass,
  SourceReport,
  SpectralEntry,
  ThermalSite,
  TimeWindow,
  UnmappedCandidate,
  ValidationReport,
} from './types'

export const sites = sitesRaw as unknown as ThermalSite[]
export const unmapped = unmappedRaw as unknown as UnmappedCandidate[]
export const alerts = alertsRaw as unknown as Alert[]
export const coverage = coverageRaw as unknown as Coverage
export const landcover = landcoverRaw as unknown as Record<string, LandCover>
export const model = modelRaw as unknown as ModelReport
export const validation = validationRaw as unknown as ValidationReport
export const sourceReport = sourcesRaw as unknown as SourceReport
export const meta = metaRaw as unknown as Meta

const siteIndex = new Map(sites.map((s) => [s.id, s]))
export const siteById = (id: string | null): ThermalSite | undefined => (id ? siteIndex.get(id) : undefined)

export const INDUSTRIAL_CLASSES: SourceClass[] = [
  'refinery',
  'gas_flare',
  'lng_gas',
  'power_thermal',
  'chemical',
  'steel_metal',
  'cement',
  'brick_kiln',
  'mining',
  'industrial_fire',
  'other_industrial',
]

export const NON_INDUSTRIAL_CLASSES: SourceClass[] = ['crop_burning', 'forest_fire', 'waste_fire', 'other_unknown']

export const industrialSites = () => sites.filter((s) => s.branch === 'industrial')
export const nonIndustrialSites = () => sites.filter((s) => s.branch === 'non_industrial')
export const controlSites = () => sites.filter((s) => s.class === 'nonthermal_control')
export const sitesByClass = (classes: SourceClass[]) => sites.filter((s) => classes.includes(s.class))
export const abnormalSites = () => sites.filter((s) => s.behaviour === 'abnormal')

/**
 * Every window as a day count, so the map layers and the tables can share one comparison.
 * The hour windows are fractions of a day — three hours is 0.125.
 */
export const WINDOW_DAYS: Record<TimeWindow, number> = {
  '3h': 3 / 24,
  '6h': 6 / 24,
  '12h': 12 / 24,
  '24h': 1,
  '3d': 3,
  '7d': 7,
  '30d': 30,
  '1y': 365,
  all: 100000,
}

/**
 * The dataset window ends 2026-01-01; "now" is the instant that day closes, so relative
 * windows work. The close rather than the open: `windowEnd` is inclusive — records carry it
 * as their last detection — so anchoring to the midnight that opens the day would put the
 * freshest records in the future and drop them from every window.
 */
export const DATA_NOW = new Date(new Date(`${meta.windowEnd}T00:00:00Z`).getTime() + 86400000)

/**
 * Whether a record falls inside the selected window.
 *
 * Below a day the comparison needs an hour, which FIRMS does not ship, so `id` and `night`
 * derive a stable one — see `lib/acquisitionTime`. Callers filtering whole days can leave
 * them out and the record is treated as landing at midnight.
 */
export function withinWindow(
  dateIso: string | null,
  window: TimeWindow,
  id = '',
  night?: boolean,
): boolean {
  if (!dateIso) return false
  const days = WINDOW_DAYS[window]
  const age = ageInDays(dateIso, DATA_NOW, id, night)
  return age >= 0 && age <= days
}

// ---------------------------------------------------------------- lazy files
const cache = new Map<string, Promise<unknown>>()

/**
 * The cache holds the promise, so a file is fetched once however many panels ask for it.
 *
 * A rejection is evicted rather than kept: caching a failed promise would make the first
 * network blip permanent for the rest of the session, and the retry offered on every loading
 * panel would do nothing at all.
 */
function loadJson<T>(file: string): Promise<T> {
  const key = file
  if (!cache.has(key)) {
    const pending = fetch(`${import.meta.env.BASE_URL}${file}`).then((r) => {
      if (!r.ok) throw new Error(`Could not load ${file} (${r.status})`)
      return r.json()
    })
    pending.catch(() => cache.delete(key))
    cache.set(key, pending)
  }
  return cache.get(key) as Promise<T>
}

export const loadDetections = () => loadJson<Detection[]>('data/detections.json')
export const loadTimeseries = () => loadJson<Record<string, SiteSeries>>('data/timeseries.json')
export const loadShap = () => loadJson<Record<string, ShapEntry>>('data/shap.json')
export const loadSpectral = () => loadJson<Record<string, SpectralEntry>>('data/spectral.json')
export const loadSar = () => loadJson<Record<string, SarEntry>>('data/sar.json')
export const loadStates = () => loadJson<FeatureCollection>('geo/india-states.json')
export const loadDistricts = () => loadJson<FeatureCollection>('geo/india-districts.json')

/** Expands the column-wise series back into dated points for charting. */
export function expandSeries(series: SiteSeries) {
  const start = new Date(`${series.start}T00:00:00Z`).getTime()
  return series.frp.map((frp, i) => ({
    date: new Date(start + i * 86400000).toISOString().slice(0, 10),
    frp,
    low: series.low[i],
    high: series.high[i],
  }))
}
