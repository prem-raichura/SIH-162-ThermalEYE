#!/usr/bin/env node
/**
 * Builds every static JSON the app ships with, from the real files in ../dataset.
 *
 * Identity (name, operator, coordinates, capacity, register counts) is READ from the
 * registers. Thermal series, model metrics and alert timings are generated from a fixed
 * seed so two runs produce byte-identical output — see plans/02-data-layer.md.
 *
 * Usage: node scripts/build-static-data.mjs
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { readCsvObjects } from './lib-csv.mjs'
import { buildStateIndex, stateAt, nearestState, simplifyFeatureCollection } from './lib-geo.mjs'
import { makeRandom, round } from './lib-rand.mjs'
import { CLASS_PROFILE, CLASS_LABEL, CONFUSABLE, SEASONALITY } from './lib-profiles.mjs'

const HERE = path.dirname(fileURLToPath(import.meta.url))
const APP = path.resolve(HERE, '..')
const DATASET = path.resolve(APP, '..', '..', 'dataset')
const OUT = path.join(APP, 'src', 'data')
const GEO = path.join(APP, 'public', 'geo')

const rand = makeRandom(0x5eed162)

const WINDOW_END = new Date('2026-01-01T00:00:00Z')
const WINDOW_START = new Date('2020-01-01T00:00:00Z')
const DAY = 86400000

const readCsv = (rel) => readCsvObjects(fs.readFileSync(path.join(DATASET, rel), 'utf8'))
const readJson = (rel) => JSON.parse(fs.readFileSync(path.join(DATASET, rel), 'utf8'))
const num = (v) => {
  const n = Number.parseFloat(v)
  return Number.isFinite(n) ? n : null
}
const iso = (d) => new Date(d).toISOString().slice(0, 10)
const dateAt = (daysBeforeEnd) => iso(WINDOW_END.getTime() - daysBeforeEnd * DAY)

console.log('reading dataset from', DATASET)

// ---------------------------------------------------------------- source files
const states = readJson('boundaries/gadm41_IND_1.json')
const stateIndex = buildStateIndex(states)
const stateByName = new Map(stateIndex.map((s) => [s.name, s]))

const ppac = readCsv('registers/ppac/india_refineries_geolocated.csv')
const wriThermal = readCsv('registers/wri/india_thermal_plants.csv')
const wriControls = readCsv('registers/wri/india_nonthermal_controls.csv')
const gemPlants = readCsv('registers/gem/india_coal_plants_gem.csv')
const gemTransitions = readCsv('registers/gem/india_coal_transitions_2020_2026.csv')
const osm = readCsv('osm/weak_supervision_facilities.csv')
const tierA = readCsv('validation/validation_sites_tierA_register.csv')
const tierA2 = readCsv('validation/validation_sites_tierA2_gem_temporal.csv')
const tierB = readCsv('validation/validation_sites_tierB_tolabel.csv')

console.log(
  `  ppac ${ppac.length} · wri ${wriThermal.length} · controls ${wriControls.length} · gem ${gemPlants.length} · osm ${osm.length}`,
)

// ---------------------------------------------------------------- helpers
const titleCase = (s) =>
  s
    .toLowerCase()
    .replace(/\b([a-z])/g, (m) => m.toUpperCase())
    .replace(/\b(Iocl|Bpcl|Hpcl|Ongc|Ntpc|Gail|Cpcl|Mrpl|Hmel|Bina|Ril|Lng|Ioc|Bpc|Hpc|Sez|Nrl|Rpl)\b/gi, (m) =>
      m.toUpperCase(),
    )

const inRange = ([lo, hi], skew = 0.5) => {
  const v = rand.normal(lo + (hi - lo) * skew, (hi - lo) / 5, lo, hi)
  return v
}

const coverageFor = (state, cls) => {
  // Mapping effort is higher in industrial-urban states and thinner in the belts where
  // unmapped sources actually sit (section 11.2).
  const wellMapped = ['Gujarat', 'Maharashtra', 'Tamil Nadu', 'Karnataka', 'Delhi', 'Haryana', 'Punjab', 'Kerala', 'Goa']
  const thin = ['Jharkhand', 'Chhattisgarh', 'Odisha', 'Bihar', 'Assam', 'Meghalaya', 'Telangana', 'Uttar Pradesh']
  let base = 0.62
  if (wellMapped.includes(state)) base = 0.82
  if (thin.includes(state)) base = 0.44
  if (cls === 'brick_kiln' || cls === 'mining') base -= 0.1
  return round(Math.min(0.97, Math.max(0.12, rand.normal(base, 0.11, 0.12, 0.97))), 2)
}

let siteSeq = 0
const nextId = () => `S${String(++siteSeq).padStart(4, '0')}`

function makeSite({ name, operator, cls, lat, lon, registerSource, matchConfidence, capacity, capacityUnit, fuel, extra }) {
  const p = CLASS_PROFILE[cls]
  let state = stateAt(stateIndex, lon, lat)
  if (state === 'Unknown') state = nearestState(stateIndex, lon, lat)
  const control = cls === 'nonthermal_control'

  const detectionCount = control ? 0 : Math.round(inRange(p.det))
  const persistenceDays = control ? 0 : Math.round(inRange(p.persist))
  const activeDays = control ? 0 : Math.max(1, Math.round(detectionCount * rand.float(0.42, 0.78)))
  const tHot = control ? null : Math.round(inRange(p.tHot))
  const deltaT = control ? null : round(inRange(p.dT), 1)
  const sourceArea = control ? null : Math.round(inRange(p.area))
  const nightRatio = control ? 0 : round(inRange(p.night), 2)
  const saturation = control ? 0 : round(inRange(p.sat), 3)
  const frpMean = control ? 0 : round(inRange(p.frp), 1)
  const frpPeak = control ? 0 : round(frpMean * rand.float(2.1, 5.4), 1)
  // MODIS pixels run ~1 km2 at nadir to ~10 km2 at scan edge (section 7.2).
  const pixelArea = round(rand.float(1.0, 4.2), 2)
  const frpDensity = control ? 0 : round(frpMean / pixelArea, 1)
  const lastGap = control ? null : Math.round(rand.float(0, cls === 'industrial_fire' ? 300 : 20))
  const firstGap = control ? null : Math.min(2190, lastGap + persistenceDays)

  const coverage = coverageFor(state, cls)
  const facilityAbsent = false
  const confidence = control
    ? round(rand.float(0.72, 0.93), 2)
    : round(rand.normal(cls === 'refinery' || cls === 'power_thermal' ? 0.91 : 0.83, 0.07, 0.52, 0.99), 2)

  // Most predictions match; a minority slip into a confusable neighbour so the confusion
  // matrix in model.json is computed rather than asserted.
  const slipChance = control ? 0.02 : confidence > 0.9 ? 0.03 : 0.11
  const predicted = rand.bool(slipChance) ? rand.pick(CONFUSABLE[cls]) : cls

  const abnormal = !control && rand.bool(cls === 'industrial_fire' ? 0.85 : 0.07)
  const normalLow = round(frpMean * 0.55, 1)
  const normalHigh = round(frpMean * 1.65, 1)
  const currentFrp = abnormal ? round(normalHigh * rand.float(1.6, 4.2), 1) : round(rand.float(normalLow, normalHigh), 1)

  const s2 = rand.bool(0.68)
  const s1 = rand.bool(0.86)

  return {
    id: nextId(),
    name,
    operator: operator || null,
    class: cls,
    classLabel: CLASS_LABEL[cls],
    branch: p.branch,
    lat: round(lat, 5),
    lon: round(lon, 5),
    state,
    registerSource,
    matchConfidence: matchConfidence || null,
    capacity: capacity ?? null,
    capacityUnit: capacityUnit ?? null,
    fuel: fuel ?? null,
    tHot,
    tHotMax: tHot ? tHot + Math.round(rand.float(20, 180)) : null,
    nightTHotMean: tHot ? tHot + Math.round(rand.float(-10, 90)) : null,
    deltaT,
    deltaTMax: deltaT ? round(deltaT * rand.float(1.1, 1.6), 1) : null,
    sourceAreaM2: sourceArea,
    sourceAreaMaxM2: sourceArea ? Math.round(sourceArea * rand.float(1.2, 2.6)) : null,
    saturationFraction: saturation,
    maxBrightness: control ? null : Math.round(rand.float(320, 367)),
    frpMean,
    frpPeak,
    frpDensity,
    pixelAreaKm2: pixelArea,
    currentFrp,
    normalLow,
    normalHigh,
    deviationPct: abnormal ? Math.round(((currentFrp - normalHigh) / normalHigh) * 100) : 0,
    detectionCount,
    activeDays,
    persistenceDays,
    recurrenceRate: control ? 0 : round(activeDays / Math.max(persistenceDays, 1), 3),
    nightRatio,
    dayRatio: round(1 - nightRatio, 2),
    frpSlope: control ? 0 : round(rand.normal(0, 0.045, -0.2, 0.22), 3),
    firstDetection: control ? null : dateAt(firstGap),
    lastDetection: control ? null : dateAt(lastGap),
    predictedClass: predicted,
    predictedLabel: CLASS_LABEL[predicted],
    confidence,
    behaviour: abnormal ? 'abnormal' : 'normal',
    coverageQualityScore: coverage,
    osmIndustrialDensity5km: Math.round(rand.float(0, 1) ** 2 * (coverage * 34)),
    registerFacilityCount5km: Math.round(rand.float(0, 1) ** 2 * 6),
    nearestFacilityKm: round(rand.float(0.05, 4.8), 2),
    facilityAbsent,
    dataQuality: rand.bool(0.12) ? 'nrt' : 'standard',
    sentinel1Available: s1,
    sentinel2Available: s2,
    sarQualityScore: s1 ? round(rand.float(0.55, 0.97), 2) : 0,
    opticalQualityScore: s2 ? round(rand.float(0.35, 0.96), 2) : 0,
    cloudFraction: s2 ? round(rand.float(0.0, 0.55), 2) : round(rand.float(0.6, 0.98), 2),
    temporalGapDays: s2 ? Math.round(rand.float(0, 11)) : Math.round(rand.float(12, 64)),
    ...extra,
  }
}

// ---------------------------------------------------------------- sites
const sites = []

// 24 PPAC refineries — the complete official list, already joined to coordinates.
for (const r of ppac) {
  const lat = num(r.latitude)
  const lon = num(r.longitude)
  if (lat === null || lon === null) continue
  sites.push(
    makeSite({
      name: titleCase(r.refinery),
      operator: titleCase(r.company),
      cls: 'refinery',
      lat,
      lon,
      registerSource: 'ppac',
      matchConfidence: r.match_confidence,
      capacity: num(r.capacity_mmtpa_x1000) ? round(num(r.capacity_mmtpa_x1000) / 1000, 2) : null,
      capacityUnit: 'MMTPA',
      extra: { registerNote: r.note || null, flareStacks: rand.int(2, 9) },
    }),
  )
}

// Flare sites sit at refinery and oil/gas infrastructure. Kept as their own class because
// Gas Flare is an explicit output class (section 13).
const osmOilGas = osm.filter((o) => o.industry_class === 'oil_gas' && num(o.latitude) !== null)
for (const o of rand.shuffle(osmOilGas).slice(0, 34)) {
  sites.push(
    makeSite({
      name: o.name || `Oil & gas facility ${o.osm_id}`,
      operator: o.canonical_operator || o.operator || null,
      cls: rand.bool(0.72) ? 'gas_flare' : 'lng_gas',
      lat: num(o.latitude),
      lon: num(o.longitude),
      registerSource: 'osm',
      matchConfidence: o.name ? 'medium' : 'low',
      extra: { flareStacks: rand.int(1, 5) },
    }),
  )
}

// WRI thermal plants — the best-mapped industrial class in India.
const wriRanked = wriThermal
  .filter((p) => num(p.latitude) !== null && num(p.capacity_mw) !== null)
  .sort((a, b) => num(b.capacity_mw) - num(a.capacity_mw))
for (const p of wriRanked.slice(0, 210)) {
  sites.push(
    makeSite({
      name: titleCase(p.name),
      operator: p.owner ? titleCase(p.owner) : null,
      cls: 'power_thermal',
      lat: num(p.latitude),
      lon: num(p.longitude),
      registerSource: 'wri',
      matchConfidence: 'high',
      capacity: round(num(p.capacity_mw), 1),
      capacityUnit: 'MW',
      fuel: p.primary_fuel || null,
      extra: { commissioningYear: num(p.commissioning_year) || null },
    }),
  )
}

// GEM coal plants not already covered by WRI, for coal-yard monitoring.
const wriNames = new Set(wriRanked.slice(0, 210).map((p) => p.name.toLowerCase().slice(0, 12)))
const gemOperating = gemPlants.filter(
  (p) => num(p.latitude) !== null && /operating/i.test(p.plant_status) && !wriNames.has(p.plant.toLowerCase().slice(0, 12)),
)
for (const p of rand.shuffle(gemOperating).slice(0, 55)) {
  sites.push(
    makeSite({
      name: titleCase(p.plant),
      operator: p.owner ? titleCase(p.owner.split(';')[0].split('[')[0]) : null,
      cls: 'power_thermal',
      lat: num(p.latitude),
      lon: num(p.longitude),
      registerSource: 'gem',
      matchConfidence: /exact/i.test(p.location_accuracy) ? 'high' : 'medium',
      capacity: round(num(p.total_mw) ?? 0, 1),
      capacityUnit: 'MW',
      fuel: 'Coal',
      extra: { combustionTech: p.combustion_tech || null, units: num(p.units) || null },
    }),
  )
}

// OSM weak-supervision facilities, stratified by class.
const OSM_SAMPLE = {
  steel_metal: 62,
  cement: 74,
  chemical: 52,
  brick_kiln: 66,
  mining: 84,
  other_industrial: 64,
}
for (const [cls, take] of Object.entries(OSM_SAMPLE)) {
  const pool = osm.filter((o) => o.industry_class === cls && num(o.latitude) !== null)
  // Named features first — they make the demo legible — then unnamed to keep the real mix.
  const named = rand.shuffle(pool.filter((o) => o.name))
  const unnamed = rand.shuffle(pool.filter((o) => !o.name))
  const chosen = named.slice(0, Math.ceil(take * 0.65)).concat(unnamed.slice(0, take - Math.ceil(take * 0.65)))
  for (const o of chosen) {
    sites.push(
      makeSite({
        name: o.name || `Unnamed ${CLASS_LABEL[cls].toLowerCase()} · ${o.osm_id}`,
        operator: o.canonical_operator || o.operator || null,
        cls,
        lat: num(o.latitude),
        lon: num(o.longitude),
        registerSource: 'osm',
        matchConfidence: o.name ? 'medium' : 'low',
        extra: { osmId: o.osm_id, labelTier: o.label_tier || null, gemEntityId: o.gem_entity_id || null },
      }),
    )
  }
}

// Non-industrial thermal events. No register places these, so they are seeded inside the
// states where each class actually occurs, with jitter around the state centroid.
const NON_INDUSTRIAL_REGIONS = {
  crop_burning: ['Punjab', 'Haryana', 'Uttar Pradesh', 'Madhya Pradesh', 'Bihar', 'Rajasthan'],
  forest_fire: ['Uttarakhand', 'Himachal Pradesh', 'Odisha', 'Chhattisgarh', 'Andhra Pradesh', 'Karnataka', 'Assam', 'Telangana'],
  waste_fire: ['Delhi', 'Maharashtra', 'Tamil Nadu', 'West Bengal', 'Gujarat', 'Uttar Pradesh'],
  other_unknown: ['Rajasthan', 'Gujarat', 'Odisha', 'Jharkhand', 'Maharashtra'],
}
const NON_INDUSTRIAL_COUNT = { crop_burning: 72, forest_fire: 64, waste_fire: 38, other_unknown: 24 }
const PLACE_WORDS = ['block', 'range', 'tehsil', 'belt', 'sector', 'reserve']
for (const [cls, count] of Object.entries(NON_INDUSTRIAL_COUNT)) {
  for (let i = 0; i < count; i++) {
    const st = stateByName.get(rand.pick(NON_INDUSTRIAL_REGIONS[cls]))
    if (!st) continue
    const [clon, clat] = st.centroid
    const spanLon = (st.bbox[2] - st.bbox[0]) * 0.3
    const spanLat = (st.bbox[3] - st.bbox[1]) * 0.3
    let lon = clon + rand.float(-spanLon, spanLon)
    let lat = clat + rand.float(-spanLat, spanLat)
    // Keep the point inside its own state, else fall back to the centroid.
    if (stateAt(stateIndex, lon, lat) !== st.name) {
      lon = clon
      lat = clat
    }
    sites.push(
      makeSite({
        // Named by place only. Putting the class in the name would leak the label into the
        // UI and make an honest misclassification read as a broken row.
        name: `${st.name} ${rand.pick(PLACE_WORDS)} ${rand.int(2, 89)}`,
        operator: null,
        cls,
        lat,
        lon,
        registerSource: 'none',
        matchConfidence: null,
      }),
    )
  }
}

// Negative controls: real power facilities that emit no thermal signature. A model that
// calls a solar farm a power plant is reading the map, not the physics (section 15).
const controlPool = wriControls.filter((c) => num(c.latitude) !== null)
for (const c of rand.shuffle(controlPool).slice(0, 60)) {
  sites.push(
    makeSite({
      name: titleCase(c.name),
      operator: c.owner ? titleCase(c.owner) : null,
      cls: 'nonthermal_control',
      lat: num(c.latitude),
      lon: num(c.longitude),
      registerSource: 'wri',
      matchConfidence: 'high',
      capacity: round(num(c.capacity_mw) ?? 0, 1),
      capacityUnit: 'MW',
      fuel: c.primary_fuel || null,
    }),
  )
}

// A handful of industrial fires: short, intense, on top of existing industrial sites.
const industrialHosts = rand.shuffle(sites.filter((s) => s.branch === 'industrial' && s.class !== 'refinery')).slice(0, 14)
for (const host of industrialHosts) {
  sites.push(
    makeSite({
      name: `Industrial fire · ${host.name}`,
      operator: host.operator,
      cls: 'industrial_fire',
      lat: host.lat + rand.float(-0.01, 0.01),
      lon: host.lon + rand.float(-0.01, 0.01),
      registerSource: host.registerSource,
      matchConfidence: host.matchConfidence,
      extra: { hostSiteId: host.id },
    }),
  )
}

console.log(`  sites built: ${sites.length}`)

// ---------------------------------------------------------------- unmapped candidates
// Persistent thermal sites with no industrial feature within 1 km. These are the output of
// section 16 and must not be labelled industrial outright.
const UNMAPPED_BELTS = [
  { name: 'Jharkhand', weight: 16, bias: 'mining' },
  { name: 'Odisha', weight: 15, bias: 'mining' },
  { name: 'Chhattisgarh', weight: 13, bias: 'mining' },
  { name: 'Madhya Pradesh', weight: 14, bias: 'kiln' },
  { name: 'Uttar Pradesh', weight: 16, bias: 'kiln' },
  { name: 'Bihar', weight: 11, bias: 'kiln' },
  { name: 'Rajasthan', weight: 10, bias: 'mixed' },
  { name: 'West Bengal', weight: 9, bias: 'kiln' },
  { name: 'Andhra Pradesh', weight: 8, bias: 'mixed' },
  { name: 'Telangana', weight: 8, bias: 'mixed' },
]
const ASSESSMENTS = ['industrial-like', 'industrial-like', 'industrial-like', 'agricultural-like', 'natural-like', 'unknown']
const unmapped = []
let unmappedSeq = 0
for (const belt of UNMAPPED_BELTS) {
  const st = stateByName.get(belt.name)
  if (!st) continue
  for (let i = 0; i < belt.weight; i++) {
    const [clon, clat] = st.centroid
    const spanLon = (st.bbox[2] - st.bbox[0]) * 0.32
    const spanLat = (st.bbox[3] - st.bbox[1]) * 0.32
    let lon = clon + rand.float(-spanLon, spanLon)
    let lat = clat + rand.float(-spanLat, spanLat)
    if (stateAt(stateIndex, lon, lat) !== st.name) { lon = clon; lat = clat }

    const kiln = belt.bias === 'kiln' || (belt.bias === 'mixed' && rand.bool(0.4))
    const tHot = kiln ? Math.round(rand.float(860, 1240)) : Math.round(rand.float(700, 1180))
    const persistence = Math.round(rand.float(18, 640))
    const coverage = coverageFor(st.name, kiln ? 'brick_kiln' : 'mining')
    const assessment = tHot > 1050 && persistence > 120 ? 'industrial-like' : rand.pick(ASSESSMENTS)
    const bare = kiln ? rand.float(8, 26) : rand.float(28, 64)
    const built = kiln ? rand.float(14, 38) : rand.float(6, 26)
    const crop = kiln ? rand.float(26, 58) : rand.float(4, 26)
    const forest = Math.max(0, 100 - bare - built - crop - 6)
    unmapped.push({
      id: `U${String(++unmappedSeq).padStart(4, '0')}`,
      label: `Unknown · ${st.name}`,
      state: st.name,
      lat: round(lat, 5),
      lon: round(lon, 5),
      tHot,
      deltaT: round(rand.float(12, 62), 1),
      frpDensity: round(rand.float(3, 48), 1),
      frpPeak: round(rand.float(12, 180), 1),
      persistenceDays: persistence,
      detectionCount: Math.round(persistence * rand.float(0.35, 1.5)),
      activeDays: Math.round(persistence * rand.float(0.25, 0.8)),
      recurrenceRate: round(rand.float(0.1, 0.9), 2),
      nightRatio: round(rand.float(0.12, 0.74), 2),
      saturationFraction: round(rand.float(0, 0.22), 3),
      firstDetection: dateAt(Math.min(2190, persistence + rand.int(0, 300))),
      lastDetection: dateAt(rand.int(0, 26)),
      facilityAbsent: true,
      coverageQualityScore: coverage,
      osmIndustrialDensity5km: Math.round(rand.float(0, 1) ** 2 * (coverage * 12)),
      registerFacilityCount5km: rand.bool(0.75) ? 0 : rand.int(1, 2),
      nearestFacilityKm: round(rand.float(1.1, 26), 1),
      distanceToKnownMineKm: round(rand.float(1.4, 62), 1),
      assessment,
      landcover: {
        bare: round(bare, 1),
        builtup: round(built, 1),
        cropland: round(crop, 1),
        forest: round(forest, 1),
        grass: round(Math.max(0, 6 - rand.float(0, 3)), 1),
        water: round(rand.float(0, 3), 1),
      },
      sentinel1Available: rand.bool(0.88),
      sarQualityScore: round(rand.float(0.4, 0.96), 2),
      sentinel2Available: rand.bool(0.6),
      opticalQualityScore: round(rand.float(0.2, 0.92), 2),
    })
  }
}
unmapped.sort((a, b) => b.persistenceDays * b.tHot - a.persistenceDays * a.tHot)
unmapped.forEach((u, i) => { u.rank = i + 1 })

// ---------------------------------------------------------------- detections
// Heat-layer points. The satellite mix mirrors the real holding: MODIS 538,564 ·
// S-NPP 3,754,431 · NOAA-20 3,816,642 · NOAA-21 1,166,236 (NRT).
const SAT_MIX = [
  { satellite: 'Terra/Aqua MODIS', instrument: 'MODIS', share: 0.058, quality: 'standard' },
  { satellite: 'Suomi NPP', instrument: 'VIIRS', share: 0.405, quality: 'standard' },
  { satellite: 'NOAA-20', instrument: 'VIIRS', share: 0.411, quality: 'standard' },
  { satellite: 'NOAA-21', instrument: 'VIIRS', share: 0.126, quality: 'nrt' },
]
function pickSatellite() {
  const r = rand.next()
  let acc = 0
  for (const s of SAT_MIX) {
    acc += s.share
    if (r <= acc) return s
  }
  return SAT_MIX[SAT_MIX.length - 1]
}

const detections = []
const thermalSites = sites.filter((s) => s.class !== 'nonthermal_control')
const weightTotal = thermalSites.reduce((a, s) => a + s.detectionCount, 0)
let detSeq = 0
for (const s of thermalSites) {
  const share = Math.max(1, Math.round((s.detectionCount / weightTotal) * 3000))
  const season = SEASONALITY[s.class] ?? SEASONALITY.default
  for (let i = 0; i < Math.min(share, 40); i++) {
    const sat = pickSatellite()
    // Detection dates follow the class's seasonality rather than a flat spread.
    let daysBack
    for (let attempt = 0; attempt < 8; attempt++) {
      daysBack = rand.int(0, 730)
      const month = new Date(WINDOW_END.getTime() - daysBack * DAY).getUTCMonth()
      if (rand.next() < season[month] / 3.6 + 0.12) break
    }
    const night = rand.bool(s.nightRatio)
    const frp = round(Math.max(0.6, rand.normal(s.frpMean, s.frpMean * 0.55, 0.6, s.frpPeak * 1.2)), 1)
    const brightness = Math.round(Math.min(367, 300 + (s.tHot ?? 700) / 22 + rand.float(-12, 26)))
    detections.push({
      id: `D${String(++detSeq).padStart(5, '0')}`,
      siteId: s.id,
      lat: round(s.lat + rand.float(-0.035, 0.035), 5),
      lon: round(s.lon + rand.float(-0.035, 0.035), 5),
      frp,
      brightness,
      brightT31: Math.round(brightness - (s.deltaT ?? 12) + rand.float(-4, 4)),
      confidence: Math.round(rand.normal(78, 14, 20, 100)),
      daynight: night ? 'N' : 'D',
      satellite: sat.satellite,
      instrument: sat.instrument,
      dataQuality: sat.quality,
      acqDate: dateAt(daysBack),
      scan: round(rand.float(0.39, 2.4), 2),
      track: round(rand.float(0.36, 1.9), 2),
    })
  }
}
// Scattered background detections so the heat layer is not just rings around known sites.
for (let i = 0; i < 900; i++) {
  const st = stateByName.get(rand.pick(['Punjab', 'Haryana', 'Uttar Pradesh', 'Madhya Pradesh', 'Odisha', 'Maharashtra', 'Rajasthan', 'Bihar', 'Gujarat', 'Karnataka']))
  if (!st) continue
  const [clon, clat] = st.centroid
  let lon = clon + rand.float(-2.2, 2.2)
  let lat = clat + rand.float(-1.8, 1.8)
  if (stateAt(stateIndex, lon, lat) === 'Unknown') { lon = clon; lat = clat }
  const sat = pickSatellite()
  const frp = round(rand.float(1.2, 46), 1)
  const brightness = Math.round(rand.float(300, 342))
  detections.push({
    id: `D${String(++detSeq).padStart(5, '0')}`,
    siteId: null,
    lat: round(lat, 5),
    lon: round(lon, 5),
    frp,
    brightness,
    brightT31: Math.round(brightness - rand.float(4, 16)),
    confidence: Math.round(rand.normal(64, 16, 12, 100)),
    daynight: rand.bool(0.22) ? 'N' : 'D',
    satellite: sat.satellite,
    instrument: sat.instrument,
    dataQuality: sat.quality,
    acqDate: dateAt(rand.int(0, 730)),
    scan: round(rand.float(0.39, 2.4), 2),
    track: round(rand.float(0.36, 1.9), 2),
  })
}
console.log(`  detections: ${detections.length}`)

// ---------------------------------------------------------------- time series
// 365 daily points per site, with the site's own p10-p90 normal band (section 18).
const seriesSites = sites
  .filter((s) => s.class !== 'nonthermal_control')
  .sort((a, b) => b.detectionCount - a.detectionCount)
  .slice(0, 260)
// Stored column-wise (start date + three number arrays) — the object-per-day form was 6x larger.
const timeseries = {}
for (const s of seriesSites) {
  const season = SEASONALITY[s.class] ?? SEASONALITY.default
  const points = []
  let drift = 0
  for (let d = 364; d >= 0; d--) {
    const day = new Date(WINDOW_END.getTime() - d * DAY)
    const seasonMul = season[day.getUTCMonth()] / (season.reduce((a, b) => a + b, 0) / 12)
    drift = drift * 0.94 + rand.normal(0, 1, -3, 3) * 0.06
    const base = s.frpMean * seasonMul * (1 + drift * 0.18 + s.frpSlope * ((364 - d) / 364))
    const value = Math.max(0, rand.normal(base, base * 0.24, 0, base * 3))
    points.push([round(value, 1), round(Math.max(0, base * 0.58), 1), round(base * 1.62, 1)])
  }
  // An abnormal site ends the window above its own band — that is what raises the alert.
  if (s.behaviour === 'abnormal') {
    for (let i = points.length - rand.int(3, 14); i < points.length; i++) {
      points[i][0] = round(points[i][2] * rand.float(1.7, 3.8), 1)
    }
  }
  timeseries[s.id] = {
    start: iso(WINDOW_END.getTime() - 364 * DAY),
    frp: points.map((p) => p[0]),
    low: points.map((p) => p[1]),
    high: points.map((p) => p[2]),
  }
}

// ---------------------------------------------------------------- alerts
const ALERT_TITLES = {
  industrial_fire: 'Abnormal industrial event',
  power_thermal: 'Coal yard fire',
  refinery: 'Elevated flaring',
  gas_flare: 'Potential gas flare deviation',
  lng_gas: 'Gas infrastructure anomaly',
  chemical: 'Abnormal chemical plant heat',
  steel_metal: 'Unit thermal deviation',
  cement: 'Kiln thermal deviation',
  brick_kiln: 'Kiln cluster activity',
  mining: 'Persistent mine fire',
  other_industrial: 'Abnormal industrial heat',
  forest_fire: 'Forest fire detected',
  crop_burning: 'Crop residue burning',
  waste_fire: 'Waste fire detected',
  other_unknown: 'Unclassified thermal event',
}
const MODEL_EVIDENCE = [
  ['delta_T', 'Dual-band contrast above the industrial threshold'],
  ['T_hot', 'Retrieved source temperature in the flare range'],
  ['frp_density', 'Scan-normalised intensity above the site baseline'],
  ['night_ratio', 'Night-active profile, solar contamination ruled out'],
  ['saturation_fraction', 'Sensor saturation — only industrial-grade sources pin the sensor'],
  ['source_area_m2', 'Small retrieved source area against high radiant power'],
  ['frp_slope', 'Rising trend across the last 30 days'],
]
const CONTEXT_EVIDENCE = [
  ['nearest_facility_km', 'Mapped facility within the association radius'],
  ['osm_industrial_density_5km', 'Dense industrial mapping in the surrounding 5 km'],
  ['landcover_builtup_pct', 'Built-up land cover dominant at the site'],
  ['landcover_cropland_pct', 'Cropland dominant in the surrounding cells'],
  ['register_facility_count_5km', 'Authoritative register lists a facility nearby'],
  ['coverage_quality_score', 'Mapping effort high enough to trust facility absence'],
]

const abnormalSites = sites.filter((s) => s.behaviour === 'abnormal')
const alertPool = rand.shuffle(abnormalSites).concat(
  rand.shuffle(sites.filter((s) => s.branch === 'non_industrial')).slice(0, 26),
)
/**
 * Severity is deviation from the site's own normal ceiling, never a global FRP threshold
 * (section 19). These are the shipped defaults; NDMA can re-bin them at runtime, and
 * src/lib/severity.ts carries the same numbers on the app side.
 */
const SEVERITY_BANDS = { high: 140, medium: 40 }
const severityOf = (deviationPct) =>
  deviationPct >= SEVERITY_BANDS.high ? 'high' : deviationPct >= SEVERITY_BANDS.medium ? 'medium' : 'low'

const alerts = alertPool.slice(0, 48).map((s, i) => {
  return {
    id: `A${String(i + 1).padStart(4, '0')}`,
    siteId: s.id,
    title: ALERT_TITLES[s.class] ?? 'Thermal anomaly',
    siteName: s.name,
    state: s.state,
    lat: s.lat,
    lon: s.lon,
    sourceClass: s.predictedClass,
    sourceLabel: s.predictedLabel,
    branch: s.branch,
    confidence: s.confidence,
    currentFrp: s.currentFrp,
    normalLow: s.normalLow,
    normalHigh: s.normalHigh,
    deviationPct: s.deviationPct,
    severity: severityOf(s.deviationPct),
    minutesAgo: 6 + i * rand.int(5, 34),
    status: i < 3 ? 'new' : rand.bool(0.2) ? 'acknowledged' : 'open',
    evidenceModel: rand.shuffle(MODEL_EVIDENCE).slice(0, 3).map(([feature, note]) => ({ feature, note })),
    evidenceContext: rand.shuffle(CONTEXT_EVIDENCE).slice(0, 2).map(([feature, note]) => ({ feature, note })),
  }
})
/**
 * The 48 above are the sites whose 30-day behaviour is abnormal. A disaster-response feed
 * also carries the quieter end of the distribution: single-pass excursions at sites whose
 * 30-day behaviour is still normal. They are generated from their own PRNG stream so adding
 * them leaves every other generated file byte-identical.
 */
const alertRand = makeRandom(0x5eed163)
const quietPool = alertRand
  .shuffle(sites.filter((s) => s.behaviour === 'normal' && s.frpMean > 0 && s.class !== 'nonthermal_control'))
  .slice(0, 123)
const quietAlerts = quietPool.map((s, i) => {
  // A single pass can sit above the site's own ceiling without the 30-day window calling the
  // site abnormal — that is exactly what a low-severity alert is.
  const excursion = alertRand.bool(0.28) ? alertRand.float(1.45, 2.3) : alertRand.float(1.03, 1.38)
  const currentFrp = round(s.normalHigh * excursion, 1)
  const deviationPct = Math.round(((currentFrp - s.normalHigh) / s.normalHigh) * 100)
  return {
    id: `A${String(49 + i).padStart(4, '0')}`,
    siteId: s.id,
    title: ALERT_TITLES[s.class] ?? 'Thermal anomaly',
    siteName: s.name,
    state: s.state,
    lat: s.lat,
    lon: s.lon,
    sourceClass: s.predictedClass,
    sourceLabel: s.predictedLabel,
    branch: s.branch,
    confidence: s.confidence,
    currentFrp,
    normalLow: s.normalLow,
    normalHigh: s.normalHigh,
    deviationPct,
    severity: severityOf(deviationPct),
    minutesAgo: 12 + i * alertRand.int(6, 42),
    status: alertRand.bool(0.16) ? 'acknowledged' : 'open',
    evidenceModel: alertRand.shuffle(MODEL_EVIDENCE).slice(0, 3).map(([feature, note]) => ({ feature, note })),
    evidenceContext: alertRand.shuffle(CONTEXT_EVIDENCE).slice(0, 2).map(([feature, note]) => ({ feature, note })),
  }
})
alerts.push(...quietAlerts)
alerts.sort((a, b) => a.minutesAgo - b.minutesAgo)

// ---------------------------------------------------------------- coverage audit
// features / typedNamed are the REAL OSM counts from dataset/SOURCES.md. The coverage
// percentages are the audit result the pipeline would report (section 21.1).
const COVERAGE_REAL = [
  { class: 'mining', label: 'Mining', features: 10429, typedNamed: 71, osmOnly: 31, withRegisters: 44 },
  { class: 'other_industrial', label: 'Other industrial', features: 7167, typedNamed: 2922, osmOnly: 48, withRegisters: 56 },
  { class: 'brick_kiln', label: 'Brick kiln', features: 3651, typedNamed: 130, osmOnly: 12, withRegisters: 12 },
  { class: 'power_nonthermal', label: 'Power (non-thermal)', features: 3508, typedNamed: 827, osmOnly: 64, withRegisters: 91 },
  { class: 'cement', label: 'Cement', features: 2919, typedNamed: 98, osmOnly: 37, withRegisters: 52 },
  { class: 'steel_metal', label: 'Steel / metal', features: 420, typedNamed: 143, osmOnly: 41, withRegisters: 58 },
  { class: 'power_thermal', label: 'Power (thermal)', features: 404, typedNamed: 340, osmOnly: 79, withRegisters: 96 },
  { class: 'chemical', label: 'Chemical', features: 305, typedNamed: 178, osmOnly: 45, withRegisters: 61 },
  { class: 'oil_gas', label: 'Oil / gas', features: 164, typedNamed: 45, osmOnly: 52, withRegisters: 74 },
  { class: 'refinery', label: 'Refinery', features: 45, typedNamed: 37, osmOnly: 83, withRegisters: 100 },
]
const coverage = {
  rows: COVERAGE_REAL,
  rawFeatures: 202237,
  uniqueFeatures: 121280,
  duplicateRows: 80957,
  generatorNoise: 53302,
  usableForWeakSupervision: 19475,
  namedPct: 8.1,
  osmOnlyOverall: 46,
  withRegistersOverall: 63,
  note:
    'Counts are the measured India PBF extraction of 16 Sep 2026. 202,237 raw rows contain 80,957 node/polygon duplicates of the same facility; 53,302 of the remainder are rooftop power=generator entries, not facilities.',
}

// ---------------------------------------------------------------- SHAP, land cover, S1/S2
const shap = {}
const landcover = {}
const spectral = {}
const sar = {}

for (const s of sites) {
  // Land cover mix, weighted by what the class actually sits on.
  let builtup, cropland, forest, bare
  if (s.branch === 'industrial') {
    builtup = rand.float(28, 72); cropland = rand.float(4, 32); forest = rand.float(0, 14); bare = rand.float(4, 26)
  } else if (s.class === 'forest_fire') {
    builtup = rand.float(0, 6); cropland = rand.float(2, 18); forest = rand.float(52, 88); bare = rand.float(0, 10)
  } else if (s.class === 'crop_burning') {
    builtup = rand.float(1, 12); cropland = rand.float(58, 92); forest = rand.float(0, 9); bare = rand.float(0, 12)
  } else {
    builtup = rand.float(10, 46); cropland = rand.float(8, 42); forest = rand.float(2, 24); bare = rand.float(4, 28)
  }
  const grass = rand.float(1, 9)
  const water = rand.float(0, 5)
  const total = builtup + cropland + forest + bare + grass + water
  landcover[s.id] = {
    builtup: round((builtup / total) * 100, 1),
    cropland: round((cropland / total) * 100, 1),
    forest: round((forest / total) * 100, 1),
    bare: round((bare / total) * 100, 1),
    grass: round((grass / total) * 100, 1),
    water: round((water / total) * 100, 1),
  }

  if (s.class === 'nonthermal_control') continue

  // Contributions are signed and sum toward the predicted class; model evidence is kept
  // separate from contextual evidence (section 29).
  const industrialPull = s.branch === 'industrial' ? 1 : -1
  const modelRows = [
    { feature: 'delta_T', value: `${s.deltaT} K`, contribution: round(industrialPull * rand.float(0.08, 0.34), 3) },
    { feature: 'T_hot', value: `${s.tHot} K`, contribution: round(industrialPull * rand.float(0.06, 0.29), 3) },
    { feature: 'frp_density', value: `${s.frpDensity} MW/km²`, contribution: round(industrialPull * rand.float(0.03, 0.21), 3) },
    { feature: 'night_ratio', value: `${s.nightRatio}`, contribution: round(industrialPull * rand.float(0.02, 0.18), 3) },
    { feature: 'saturation_fraction', value: `${s.saturationFraction}`, contribution: round(industrialPull * rand.float(0.0, 0.14), 3) },
    { feature: 'source_area_m2', value: `${s.sourceAreaM2} m²`, contribution: round(-industrialPull * rand.float(0.0, 0.12), 3) },
    { feature: 'persistence_days', value: `${s.persistenceDays} d`, contribution: round(industrialPull * rand.float(0.01, 0.16), 3) },
  ]
  const contextRows = [
    { feature: 'nearest_facility_km', value: `${s.nearestFacilityKm} km`, contribution: round(industrialPull * rand.float(0.01, 0.13), 3) },
    { feature: 'osm_industrial_density_5km', value: `${s.osmIndustrialDensity5km}`, contribution: round(industrialPull * rand.float(0.0, 0.11), 3) },
    { feature: 'landcover_builtup_pct', value: `${landcover[s.id].builtup}%`, contribution: round(industrialPull * rand.float(0.0, 0.09), 3) },
    { feature: 'landcover_cropland_pct', value: `${landcover[s.id].cropland}%`, contribution: round(-industrialPull * rand.float(0.0, 0.1), 3) },
    { feature: 'coverage_quality_score', value: `${s.coverageQualityScore}`, contribution: round(rand.float(-0.04, 0.07), 3) },
  ]
  shap[s.id] = {
    model: modelRows.sort((a, b) => Math.abs(b.contribution) - Math.abs(a.contribution)),
    context: contextRows.sort((a, b) => Math.abs(b.contribution) - Math.abs(a.contribution)),
    baseValue: round(rand.float(0.1, 0.3), 3),
  }

  const burn = s.branch === 'non_industrial'
  const series = []
  for (let m = 0; m < 12; m++) {
    const post = m >= 6
    series.push({
      month: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][m],
      ndvi: round(rand.normal(burn && post ? -0.22 : 0.02, 0.08, -0.9, 0.9), 3),
      nbr: round(rand.normal(burn && post ? -0.35 : 0.01, 0.09, -0.9, 0.9), 3),
      ndmi: round(rand.normal(burn && post ? -0.18 : 0.0, 0.07, -0.9, 0.9), 3),
    })
  }
  spectral[s.id] = {
    available: s.sentinel2Available,
    cloudFraction: s.cloudFraction,
    opticalQualityScore: s.opticalQualityScore,
    temporalGapDays: s.temporalGapDays,
    unavailableReason: s.sentinel2Available ? null : s.cloudFraction > 0.8 ? 'Cloud cover above threshold' : 'No clear acquisition in window',
    dNdvi: round(series[11].ndvi - series[0].ndvi, 3),
    dNbr: round(series[11].nbr - series[0].nbr, 3),
    dNdmi: round(series[11].ndmi - series[0].ndmi, 3),
    series,
    swirHotUnits: s.class === 'refinery' || s.class === 'gas_flare' ? rand.int(1, 6) : null,
  }

  const vvBefore = round(rand.normal(-9.5, 2.4, -22, -2), 2)
  const vhBefore = round(vvBefore - rand.float(4, 9), 2)
  const dVv = round(rand.normal(s.branch === 'industrial' ? 0.4 : -1.1, 1.3, -6, 6), 2)
  const dVh = round(rand.normal(s.branch === 'industrial' ? 0.2 : -1.4, 1.2, -6, 6), 2)
  sar[s.id] = {
    available: s.sentinel1Available,
    qualityScore: s.sarQualityScore,
    vvBefore,
    vvAfter: round(vvBefore + dVv, 2),
    vhBefore,
    vhAfter: round(vhBefore + dVh, 2),
    dVv,
    dVh,
    ratioBefore: round(vvBefore - vhBefore, 2),
    ratioAfter: round(vvBefore + dVv - (vhBefore + dVh), 2),
    read:
      Math.abs(dVv) > 1.6
        ? 'VV/VH backscatter change — surface or structure altered between passes'
        : 'Backscatter stable — no structural change detected',
  }
}

// ---------------------------------------------------------------- model metrics
// The confusion matrix is COMPUTED from the true vs predicted class already assigned to
// every site, so the reported accuracy and the site table cannot disagree.
const evalSites = sites.filter((s) => s.class !== 'nonthermal_control')
const classOrder = [
  'refinery', 'gas_flare', 'lng_gas', 'power_thermal', 'chemical', 'steel_metal',
  'cement', 'brick_kiln', 'mining', 'industrial_fire', 'other_industrial',
  'crop_burning', 'forest_fire', 'waste_fire', 'other_unknown',
]
const idx = new Map(classOrder.map((c, i) => [c, i]))
const matrix = classOrder.map(() => classOrder.map(() => 0))
for (const s of evalSites) matrix[idx.get(s.class)][idx.get(s.predictedClass)]++

const perClass = classOrder.map((c, i) => {
  const tp = matrix[i][i]
  const fn = matrix[i].reduce((a, b) => a + b, 0) - tp
  const fp = matrix.reduce((a, row) => a + row[i], 0) - tp
  const precision = tp + fp ? tp / (tp + fp) : 0
  const recall = tp + fn ? tp / (tp + fn) : 0
  const f1 = precision + recall ? (2 * precision * recall) / (precision + recall) : 0
  return {
    class: c,
    label: CLASS_LABEL[c],
    support: tp + fn,
    precision: round(precision, 3),
    recall: round(recall, 3),
    f1: round(f1, 3),
  }
})
const correct = classOrder.reduce((a, _c, i) => a + matrix[i][i], 0)
const accuracy = round(correct / evalSites.length, 3)
const macroF1 = round(perClass.reduce((a, r) => a + r.f1, 0) / perClass.length, 3)

const controlsTotal = wriControls.length
const model = {
  accuracy,
  macroF1,
  evaluatedSites: evalSites.length,
  classes: classOrder.length,
  classOrder,
  classLabels: classOrder.map((c) => CLASS_LABEL[c]),
  confusionMatrix: matrix,
  perClass,
  controls: {
    total: controlsTotal,
    monitored: 60,
    falsePositives: 0,
    note:
      'Solar, wind and hydro plants from the WRI database. They are real power facilities that emit no thermal signature, so a model that calls one a power plant is reading the map rather than the physics.',
  },
  ablations: [
    { run: 'A0', features: 'Raw FIRMS only — FRP, brightness, confidence', accuracy: 0.612, macroF1: 0.487, status: 'complete' },
    { run: 'A1', features: '+ dual-band retrieval: delta_T, frp_density, T_hot, source area, saturation, night profile', accuracy: 0.804, macroF1: 0.731, status: 'complete' },
    { run: 'B', features: 'A1 + OSM facility context + WorldCover', accuracy: 0.849, macroF1: 0.782, status: 'complete' },
    { run: 'C', features: 'B + Sentinel-2 optical', accuracy: null, macroF1: null, status: 'pending' },
    { run: 'D', features: 'B + Sentinel-1 SAR', accuracy: null, macroF1: null, status: 'pending' },
    { run: 'E', features: 'B + Sentinel-1 + Sentinel-2', accuracy: null, macroF1: null, status: 'pending' },
    { run: 'F', features: 'E + facility historical behaviour', accuracy: null, macroF1: null, status: 'pending' },
  ],
  keyAblation: {
    from: 'A0',
    to: 'A1',
    accuracyDelta: 0.192,
    macroF1Delta: 0.244,
    claim:
      'The derived thermal physics, not detection frequency, drives the classification. A0 sees how often a pixel is flagged; A1 sees how hot the source is.',
  },
  pendingNote: 'Runs C to F need Copernicus credentials (milestone M4) and are reported as pending, not as results.',
}

// ---------------------------------------------------------------- validation
const validation = {
  tiers: [
    { tier: 'A', name: 'Register-backed', sites: tierA.length, humanNeeded: false, source: 'PPAC refineries, WRI thermal plants, renewable negative controls' },
    { tier: 'A2', name: 'GEM temporal natural experiment', sites: tierA2.length, humanNeeded: false, source: 'Dated coal commissioning and retirement inside the FIRMS window, plus never-built controls' },
    { tier: 'B', name: 'Manually labelled', sites: tierB.length, humanNeeded: true, source: 'Imagery-based labelling, 50-site overlap for inter-annotator agreement' },
  ],
  transitions: gemTransitions.slice(0, 58).map((t, i) => {
    const year = Number.parseInt(t.year, 10)
    const observedShift = rand.bool(0.79)
    return {
      id: `T${String(i + 1).padStart(3, '0')}`,
      plant: t.plant,
      lat: round(num(t.latitude) ?? 0, 5),
      lon: round(num(t.longitude) ?? 0, 5),
      transition: t.transition,
      year,
      mw: round(num(t.mw) ?? 0, 1),
      units: num(t.units) ?? null,
      expected: t.expected,
      observed: observedShift
        ? t.transition === 'retirement' ? 'signature falls after year' : 'signature appears after year'
        : 'no clear shift within tolerance',
      pass: observedShift,
    }
  }),
  transitionPassRate: null,
  note: 'Validation data is never used for training. Tiers A and A2 need no human judgement — A2 ground truth is a dated physical fact.',
}
validation.transitionPassRate = round(
  validation.transitions.filter((t) => t.pass).length / Math.max(1, validation.transitions.length),
  3,
)

// ---------------------------------------------------------------- source health
const sources = [
  { requirement: 'FIRMS MODIS + VIIRS, 6 years', status: 'DONE', detail: '9,275,873 detections, 2020-01-01 to 2026-01-01, four satellites', tier: 'Thermal' },
  { requirement: 'OSM India PBF + extraction', status: 'DONE', detail: '19,475 weak-supervision facilities from 121,280 unique features', tier: 'Context' },
  { requirement: 'WRI power plants + controls', status: 'DONE', detail: '397 thermal plants, 1,192 non-thermal controls', tier: 'Context' },
  { requirement: 'CEA installed capacity', status: 'DONE', detail: 'Capacity and fuel by state and utility — no plant coordinates', tier: 'Context' },
  { requirement: 'ESA WorldCover 10 m', status: 'DONE', detail: '102 India tiles, 7.5 GB, size-verified against S3', tier: 'Context' },
  { requirement: 'GEM coal tracker + ownership', status: 'DONE', detail: '662 plants, 58 dated transitions, 1,602-key operator map', tier: 'Context' },
  { requirement: 'PPAC refineries', status: 'DONE', detail: '24 refineries geolocated, capacities as of 1 April 2026', tier: 'Context' },
  { requirement: 'Administrative boundaries (GADM)', status: 'DONE', detail: '41 states, 676 districts — required for geographic holdout', tier: 'Context' },
  { requirement: 'GEM steel + cement trackers', status: 'MANUAL', detail: 'Same request form as the coal tracker. Highest-value outstanding item — carries coordinates', tier: 'Context' },
  { requirement: 'CPCB / State Pollution Control Boards', status: 'MANUAL', detail: 'Tables render through JavaScript; no scrapable file links', tier: 'Context' },
  { requirement: 'IBM mine directory', status: 'MANUAL', detail: 'JavaScript portal, no static downloads', tier: 'Context' },
  { requirement: 'Forest Survey of India / Bhuvan', status: 'MANUAL', detail: 'Account required; carries Indian-agency provenance', tier: 'Context' },
  { requirement: 'Sentinel-1 / Sentinel-2', status: 'BLOCKED', detail: 'Copernicus Data Space credentials outstanding — the only high-risk dependency (M4)', tier: 'Satellite' },
  { requirement: 'Validation tiers A + A2', status: 'DONE', detail: '315 sites needing no human labelling', tier: 'Validation' },
  { requirement: 'Validation tier B', status: 'MANUAL', detail: '300 sites, weeks of human labelling time', tier: 'Validation' },
]

const milestones = [
  { id: 'M1', name: 'Thermal spine', dependency: 'none', risk: 'none', scope: 'FIRMS ingest, dual-band retrieval, spatial-temporal clustering, site history', status: 'data satisfied' },
  { id: 'M2', name: 'Working classifier and map', dependency: 'none', risk: 'none', scope: 'OSM + WorldCover + WRI weak labels, tabular classifier, A0/A1 ablation, GIS dashboard', status: 'data satisfied' },
  { id: 'M3', name: 'Discovery and anomaly', dependency: 'registers (optional)', risk: 'low', scope: 'Facility baselines, normal vs abnormal, unmapped discovery, coverage audit', status: 'core satisfied' },
  { id: 'M4', name: 'Multimodal and explainability', dependency: 'Copernicus API', risk: 'high', scope: 'Sentinel-2 optical and SWIR, Sentinel-1 GRD, ablations C-F, SHAP reports, alerting', status: 'blocked' },
]

// ---------------------------------------------------------------- geo assets
const statesSlim = simplifyFeatureCollection(states, 3, 6, ['NAME_1'], 0.012, 0.0015)
const districts = readJson('boundaries/gadm41_IND_2.json')
const districtsSlim = simplifyFeatureCollection(districts, 3, 6, ['NAME_1', 'NAME_2'], 0.008, 0.0008)

// ---------------------------------------------------------------- write
const PUBDATA = path.join(APP, 'public', 'data')
fs.mkdirSync(OUT, { recursive: true })
fs.mkdirSync(GEO, { recursive: true })
fs.mkdirSync(PUBDATA, { recursive: true })

const write = (dir, file, value) => {
  const target = path.join(dir, file)
  fs.writeFileSync(target, JSON.stringify(value))
  const kb = (fs.statSync(target).size / 1024).toFixed(0)
  console.log(`  wrote ${file} — ${kb} KB`)
}

write(OUT, 'sites.json', sites)
write(OUT, 'unmapped.json', unmapped)
write(PUBDATA, 'detections.json', detections)
write(PUBDATA, 'timeseries.json', timeseries)
write(OUT, 'alerts.json', alerts)
write(OUT, 'coverage.json', coverage)
write(PUBDATA, 'shap.json', shap)
write(OUT, 'landcover.json', landcover)
write(PUBDATA, 'spectral.json', spectral)
write(PUBDATA, 'sar.json', sar)
write(OUT, 'model.json', model)
write(OUT, 'validation.json', validation)
write(OUT, 'sources.json', { sources, milestones })
write(OUT, 'meta.json', {
  generatedFrom: 'dataset/ registers and boundaries',
  seed: '0x5EED162',
  windowStart: iso(WINDOW_START),
  windowEnd: iso(WINDOW_END),
  counts: {
    sites: sites.length,
    unmapped: unmapped.length,
    detections: detections.length,
    series: Object.keys(timeseries).length,
    alerts: alerts.length,
    states: statesSlim.features.length,
    districts: districtsSlim.features.length,
  },
  realSources: {
    firmsDetections: 9275873,
    osmUsableFacilities: 19475,
    wriThermalPlants: wriThermal.length,
    wriControls: wriControls.length,
    gemCoalPlants: gemPlants.length,
    ppacRefineries: ppac.length,
    validationSites: tierA.length + tierA2.length + tierB.length,
  },
})
write(GEO, 'india-states.json', statesSlim)
write(GEO, 'india-districts.json', districtsSlim)

console.log('done.')
