import type { FeatureCollection, Feature, Point } from 'geojson'
import type { Alert, Detection, ThermalSite, UnmappedCandidate } from './types'
import { DATA_NOW } from './data'

const point = (lon: number, lat: number, properties: Record<string, unknown>): Feature<Point> => ({
  type: 'Feature',
  geometry: { type: 'Point', coordinates: [lon, lat] },
  properties,
})

const ageDays = (iso: string | null) =>
  iso === null ? 99999 : Math.round((DATA_NOW.getTime() - new Date(`${iso}T00:00:00Z`).getTime()) / 86400000)

export function detectionsToGeoJson(detections: Detection[]): FeatureCollection<Point> {
  return {
    type: 'FeatureCollection',
    features: detections.map((d) =>
      point(d.lon, d.lat, {
        id: d.id,
        frp: d.frp,
        brightness: d.brightness,
        night: d.daynight === 'N' ? 1 : 0,
        ageDays: ageDays(d.acqDate),
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
        ageDays: ageDays(s.lastDetection),
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
        ageDays: ageDays(u.lastDetection),
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
