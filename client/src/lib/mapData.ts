import type { FeatureCollection, Feature, Point } from 'geojson'
import type { Alert, Detection, ThermalSite, UnmappedCandidate } from './types'
import { DATA_NOW } from './data'
import { ageInDays } from './acquisitionTime'

const point = (lon: number, lat: number, properties: Record<string, unknown>): Feature<Point> => ({
  type: 'Feature',
  geometry: { type: 'Point', coordinates: [lon, lat] },
  properties,
})

/**
 * Age in days, kept fractional so the sub-day windows can filter on it. The hour comes from
 * `lib/acquisitionTime` — FIRMS ships a date and a day/night flag, never a clock time.
 */
const ageDays = (iso: string | null, id: string, night?: boolean) => ageInDays(iso, DATA_NOW, id, night)

export function detectionsToGeoJson(detections: Detection[]): FeatureCollection<Point> {
  return {
    type: 'FeatureCollection',
    features: detections.map((d) =>
      point(d.lon, d.lat, {
        id: d.id,
        frp: d.frp,
        brightness: d.brightness,
        night: d.daynight === 'N' ? 1 : 0,
        ageDays: ageDays(d.acqDate, d.id, d.daynight === 'N'),
      }),
    ),
  }
}

export function sitesToGeoJson(sites: ThermalSite[]): FeatureCollection<Point> {
  return {
    type: 'FeatureCollection',
    features: sites.map((s) =>
      point(s.lon, s.lat, {
        id: s.id,
        name: s.name,
        cls: s.predictedClass,
        classLabel: s.predictedLabel,
        state: s.state,
        tHot: s.tHot ?? 0,
        frpMean: s.frpMean,
        persistence: s.persistenceDays,
        abnormal: s.behaviour === 'abnormal' ? 1 : 0,
        ageDays: ageDays(s.lastDetection, s.id),
      }),
    ),
  }
}

export function unmappedToGeoJson(rows: UnmappedCandidate[]): FeatureCollection<Point> {
  return {
    type: 'FeatureCollection',
    features: rows.map((u) =>
      point(u.lon, u.lat, {
        id: u.id,
        rank: u.rank,
        label: u.label,
        state: u.state,
        tHot: u.tHot,
        persistence: u.persistenceDays,
        coverage: u.coverageQualityScore,
        assessment: u.assessment,
        ageDays: ageDays(u.lastDetection, u.id),
      }),
    ),
  }
}

export function alertsToGeoJson(alerts: Alert[]): FeatureCollection<Point> {
  return {
    type: 'FeatureCollection',
    features: alerts.map((a) =>
      point(a.lon, a.lat, {
        id: a.id,
        siteId: a.siteId,
        title: a.title,
        severity: a.severity,
        siteName: a.siteName,
        deviationPct: a.deviationPct,
      }),
    ),
  }
}

/** A 1 km ring around the selected site — the AOI the pipeline would cut imagery for. */
export function aoiRing(lat: number, lon: number, radiusKm = 1): FeatureCollection {
  const steps = 64
  const latR = radiusKm / 110.574
  const lonR = radiusKm / (111.32 * Math.cos((lat * Math.PI) / 180))
  const ring: [number, number][] = []
  for (let i = 0; i <= steps; i++) {
    const t = (i / steps) * Math.PI * 2
    ring.push([lon + lonR * Math.cos(t), lat + latR * Math.sin(t)])
  }
  return {
    type: 'FeatureCollection',
    features: [{ type: 'Feature', properties: {}, geometry: { type: 'Polygon', coordinates: [ring] } }],
  }
}
