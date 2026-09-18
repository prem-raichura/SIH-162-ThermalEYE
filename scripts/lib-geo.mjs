// Ray-casting point-in-polygon plus GADM simplification helpers.

function pointInRing(lon, lat, ring) {
  let inside = false
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const xi = ring[i][0], yi = ring[i][1]
    const xj = ring[j][0], yj = ring[j][1]
    const intersect = yi > lat !== yj > lat && lon < ((xj - xi) * (lat - yi)) / (yj - yi) + xi
    if (intersect) inside = !inside
  }
  return inside
}

function pointInPolygon(lon, lat, polygon) {
  if (!pointInRing(lon, lat, polygon[0])) return false
  for (let h = 1; h < polygon.length; h++) if (pointInRing(lon, lat, polygon[h])) return false
  return true
}

export function buildStateIndex(fc) {
  return fc.features.map((f) => {
    const polys = f.geometry.type === 'Polygon' ? [f.geometry.coordinates] : f.geometry.coordinates
    let minLon = 180, minLat = 90, maxLon = -180, maxLat = -90
    let sx = 0, sy = 0, n = 0
    for (const poly of polys) {
      for (const [lon, lat] of poly[0]) {
        if (lon < minLon) minLon = lon
        if (lon > maxLon) maxLon = lon
        if (lat < minLat) minLat = lat
        if (lat > maxLat) maxLat = lat
        sx += lon; sy += lat; n++
      }
    }
    return {
      name: humanState(f.properties.NAME_1),
      raw: f.properties.NAME_1,
      polys,
      bbox: [minLon, minLat, maxLon, maxLat],
      centroid: [sx / n, sy / n],
    }
  })
}

export function stateAt(index, lon, lat) {
  for (const s of index) {
    const [a, b, c, d] = s.bbox
    if (lon < a || lon > c || lat < b || lat > d) continue
    for (const poly of s.polys) if (pointInPolygon(lon, lat, poly)) return s.name
  }
  return 'Unknown'
}

// Coastal and port facilities can fall just outside the polygon. Attribute them to the
// nearest state rather than dropping them to Unknown.
export function nearestState(index, lon, lat) {
  let best = null
  let bestD = Infinity
  for (const s of index) {
    const d = Math.hypot(s.centroid[0] - lon, s.centroid[1] - lat)
    if (d < bestD) { bestD = d; best = s }
  }
  return best ? best.name : 'Unknown'
}

// GADM writes state names unspaced ("TamilNadu", "AndamanandNicobar").
export function humanState(raw) {
  const fixes = {
    AndamanandNicobar: 'Andaman and Nicobar',
    AndhraPradesh: 'Andhra Pradesh',
    ArunachalPradesh: 'Arunachal Pradesh',
    DadraandNagarHaveli: 'Dadra and Nagar Haveli',
    DamanandDiu: 'Daman and Diu',
    HimachalPradesh: 'Himachal Pradesh',
    JammuandKashmir: 'Jammu and Kashmir',
    MadhyaPradesh: 'Madhya Pradesh',
    NCTofDelhi: 'Delhi',
    TamilNadu: 'Tamil Nadu',
    UttarPradesh: 'Uttar Pradesh',
    WestBengal: 'West Bengal',
  }
  if (fixes[raw]) return fixes[raw]
  return raw.replace(/([a-z])([A-Z])/g, '$1 $2')
}


// Ramer-Douglas-Peucker, tolerance in degrees. Keeps coastline shape, drops vertex noise.
function perpDist(p, a, b) {
  const dx = b[0] - a[0]
  const dy = b[1] - a[1]
  if (dx === 0 && dy === 0) return Math.hypot(p[0] - a[0], p[1] - a[1])
  const t = ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / (dx * dx + dy * dy)
  const cl = Math.max(0, Math.min(1, t))
  return Math.hypot(p[0] - (a[0] + cl * dx), p[1] - (a[1] + cl * dy))
}

function rdp(points, tol) {
  if (points.length < 3) return points
  let maxD = 0
  let index = 0
  for (let i = 1; i < points.length - 1; i++) {
    const d = perpDist(points[i], points[0], points[points.length - 1])
    if (d > maxD) { maxD = d; index = i }
  }
  if (maxD <= tol) return [points[0], points[points.length - 1]]
  const left = rdp(points.slice(0, index + 1), tol)
  const right = rdp(points.slice(index), tol)
  return left.slice(0, -1).concat(right)
}

function ringArea(ring) {
  let a = 0
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    a += (ring[j][0] + ring[i][0]) * (ring[j][1] - ring[i][1])
  }
  return Math.abs(a / 2)
}

// Coordinate rounding + RDP simplification. Keeps shape, cuts file size hard.
export function simplifyFeatureCollection(fc, decimals, minRingPoints, keepProps, tolerance = 0.01, minArea = 0.0006) {
  const f = 10 ** decimals
  const round = (v) => Math.round(v * f) / f
  const thinRing = (ring) => {
    const out = []
    let prev = null
    for (const [lon, lat] of ring) {
      const p = [round(lon), round(lat)]
      if (!prev || p[0] !== prev[0] || p[1] !== prev[1]) { out.push(p); prev = p }
    }
    if (out.length && (out[0][0] !== out[out.length - 1][0] || out[0][1] !== out[out.length - 1][1])) {
      out.push([out[0][0], out[0][1]])
    }
    return out
  }
  const features = []
  for (const feat of fc.features) {
    const polys = feat.geometry.type === 'Polygon' ? [feat.geometry.coordinates] : feat.geometry.coordinates
    const kept = []
    for (const poly of polys) {
      const rings = poly
        .map((r) => rdp(thinRing(r), tolerance))
        .filter((r) => r.length >= minRingPoints && ringArea(r) >= minArea)
      if (rings.length) kept.push(rings)
    }
    if (!kept.length) continue
    const props = {}
    for (const k of keepProps) if (feat.properties[k] !== undefined) props[k] = humanState(String(feat.properties[k]))
    features.push({
      type: 'Feature',
      properties: props,
      geometry: kept.length === 1
        ? { type: 'Polygon', coordinates: kept[0] }
        : { type: 'MultiPolygon', coordinates: kept },
    })
  }
  return { type: 'FeatureCollection', features }
}
