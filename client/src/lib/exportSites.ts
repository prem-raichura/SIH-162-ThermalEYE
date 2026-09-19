/**
 * The published schema.
 *
 * One field list drives the preview, the CSV and the GeoJSON properties, so what the Export
 * page shows is what the file contains. Everything is built in the browser and handed to the
 * user as a Blob — nothing is uploaded anywhere.
 */
import type { FeatureCollection, Feature, Point } from 'geojson'
import type { ThermalSite } from './types'

export type FieldGroup = 'identity' | 'thermal' | 'temporal' | 'provenance'

export interface ExportField {
  key: string
  type: 'string' | 'number' | 'boolean'
  group: FieldGroup
  description: string
  read: (site: ThermalSite) => string | number | boolean | null
}

export const EXPORT_FIELDS: ExportField[] = [
  { key: 'site_id', type: 'string', group: 'identity', description: 'Stable site identifier', read: (s) => s.id },
  { key: 'name', type: 'string', group: 'identity', description: 'Facility name as the register holds it', read: (s) => s.name },
  { key: 'operator', type: 'string', group: 'identity', description: 'Operator, where a register carries one', read: (s) => s.operator },
  { key: 'latitude', type: 'number', group: 'identity', description: 'Site centroid, WGS 84', read: (s) => s.lat },
  { key: 'longitude', type: 'number', group: 'identity', description: 'Site centroid, WGS 84', read: (s) => s.lon },
  { key: 'state', type: 'string', group: 'identity', description: 'GADM level-1 state', read: (s) => s.state },
  { key: 'predicted_class', type: 'string', group: 'identity', description: 'Model verdict, not the register class', read: (s) => s.predictedClass },
  { key: 'confidence', type: 'number', group: 'identity', description: 'Classifier confidence, 0–1', read: (s) => s.confidence },
  { key: 'capacity', type: 'number', group: 'identity', description: 'Register capacity where published', read: (s) => s.capacity },
  { key: 'capacity_unit', type: 'string', group: 'identity', description: 'Unit the capacity is stated in', read: (s) => s.capacityUnit },

  { key: 't_hot_k', type: 'number', group: 'thermal', description: 'Two-band retrieved source temperature, K — an estimate, not a measurement', read: (s) => s.tHot },
  { key: 'delta_t_k', type: 'number', group: 'thermal', description: 'Dual-band contrast, K', read: (s) => s.deltaT },
  { key: 'source_area_m2', type: 'number', group: 'thermal', description: 'Retrieved source area, m² — undefined for saturated pixels', read: (s) => s.sourceAreaM2 },
  { key: 'saturation_fraction', type: 'number', group: 'thermal', description: 'Share of detections with a saturated pixel', read: (s) => s.saturationFraction },
  { key: 'frp_mean_mw', type: 'number', group: 'thermal', description: 'Mean fire radiative power, MW', read: (s) => s.frpMean },
  { key: 'frp_peak_mw', type: 'number', group: 'thermal', description: 'Peak fire radiative power, MW', read: (s) => s.frpPeak },
  { key: 'frp_density_mw_km2', type: 'number', group: 'thermal', description: 'Scan-normalised intensity, MW/km²', read: (s) => s.frpDensity },

  { key: 'detection_count', type: 'number', group: 'temporal', description: 'FIRMS detections over the window', read: (s) => s.detectionCount },
  { key: 'active_days', type: 'number', group: 'temporal', description: 'Days with at least one detection', read: (s) => s.activeDays },
  { key: 'persistence_days', type: 'number', group: 'temporal', description: 'First to last detection, days', read: (s) => s.persistenceDays },
  { key: 'night_ratio', type: 'number', group: 'temporal', description: 'Share of detections at night', read: (s) => s.nightRatio },
  { key: 'first_detection', type: 'string', group: 'temporal', description: 'ISO date of the first detection', read: (s) => s.firstDetection },
  { key: 'last_detection', type: 'string', group: 'temporal', description: 'ISO date of the last detection', read: (s) => s.lastDetection },
  { key: 'behaviour', type: 'string', group: 'temporal', description: 'normal / abnormal against the site’s own baseline', read: (s) => s.behaviour },

  { key: 'register_source', type: 'string', group: 'provenance', description: 'osm · ppac · wri · gem · cea · none', read: (s) => s.registerSource },
  { key: 'match_confidence', type: 'string', group: 'provenance', description: 'Confidence of the register join', read: (s) => s.matchConfidence },
  { key: 'data_quality', type: 'string', group: 'provenance', description: 'nrt / standard — the NOAA-20/21 split', read: (s) => s.dataQuality },
  { key: 'sentinel1_available', type: 'boolean', group: 'provenance', description: 'A usable SAR acquisition exists', read: (s) => s.sentinel1Available },
  { key: 'sar_quality_score', type: 'number', group: 'provenance', description: 'SAR usability, 0–1', read: (s) => s.sarQualityScore },
  { key: 'sentinel2_available', type: 'boolean', group: 'provenance', description: 'A usable optical acquisition exists', read: (s) => s.sentinel2Available },
  { key: 'optical_quality_score', type: 'number', group: 'provenance', description: 'Optical usability, 0–1', read: (s) => s.opticalQualityScore },
  { key: 'cloud_fraction', type: 'number', group: 'provenance', description: 'Cloud cover of the nearest optical scene', read: (s) => s.cloudFraction },
  { key: 'temporal_gap_days', type: 'number', group: 'provenance', description: 'Days between the event and the nearest usable acquisition', read: (s) => s.temporalGapDays },
  { key: 'coverage_quality_score', type: 'number', group: 'provenance', description: 'Local mapping effort — how much an absent facility means', read: (s) => s.coverageQualityScore },
]

export const FIELD_GROUP_LABEL: Record<FieldGroup, string> = {
  identity: 'Identity and verdict',
  thermal: 'Thermal physics',
  temporal: 'Temporal behaviour',
  provenance: 'Provenance and quality',
}

const properties = (site: ThermalSite) =>
  Object.fromEntries(EXPORT_FIELDS.map((f) => [f.key, f.read(site)])) as Record<string, unknown>

export function sitesToExportGeoJson(sites: ThermalSite[]): FeatureCollection<Point> {
  const features: Feature<Point>[] = sites.map((site) => ({
    type: 'Feature',
    id: site.id,
    geometry: { type: 'Point', coordinates: [site.lon, site.lat] },
    properties: properties(site),
  }))
  return { type: 'FeatureCollection', features }
}

const csvCell = (value: string | number | boolean | null): string => {
  if (value === null) return ''
  const text = String(value)
  return /[",\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text
}

export function sitesToCsv(sites: ThermalSite[]): string {
  const header = EXPORT_FIELDS.map((f) => f.key).join(',')
  const rows = sites.map((site) => EXPORT_FIELDS.map((f) => csvCell(f.read(site))).join(','))
  return [header, ...rows].join('\n')
}

/** Hands the file to the browser. Local only — the app makes no upload. */
export function downloadText(filename: string, mime: string, text: string) {
  const url = URL.createObjectURL(new Blob([text], { type: mime }))
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.append(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}
