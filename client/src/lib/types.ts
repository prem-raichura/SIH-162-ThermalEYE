export type SourceClass =
  | 'refinery'
  | 'gas_flare'
  | 'lng_gas'
  | 'power_thermal'
  | 'chemical'
  | 'steel_metal'
  | 'cement'
  | 'brick_kiln'
  | 'mining'
  | 'industrial_fire'
  | 'other_industrial'
  | 'crop_burning'
  | 'forest_fire'
  | 'waste_fire'
  | 'other_unknown'
  | 'nonthermal_control'

export type Branch = 'industrial' | 'non_industrial' | 'control'
export type Behaviour = 'normal' | 'abnormal'
export type DataQuality = 'nrt' | 'standard'
export type RegisterSource = 'osm' | 'ppac' | 'wri' | 'gem' | 'cea' | 'none'
export type MatchConfidence = 'high' | 'medium' | 'low'
export type Severity = 'high' | 'medium' | 'low'
export type AlertStatus = 'new' | 'open' | 'acknowledged'
export type Assessment = 'industrial-like' | 'agricultural-like' | 'natural-like' | 'unknown'

export interface ThermalSite {
  id: string
  name: string
  operator: string | null
  class: SourceClass
  classLabel: string
  branch: Branch
  lat: number
  lon: number
  state: string
  registerSource: RegisterSource
  matchConfidence: MatchConfidence | null
  capacity: number | null
  capacityUnit: string | null
  fuel: string | null

  tHot: number | null
  tHotMax: number | null
  nightTHotMean: number | null
  deltaT: number | null
  deltaTMax: number | null
  sourceAreaM2: number | null
  sourceAreaMaxM2: number | null
  saturationFraction: number
  maxBrightness: number | null
  frpMean: number
  frpPeak: number
  frpDensity: number
  pixelAreaKm2: number
  currentFrp: number
  normalLow: number
  normalHigh: number
  deviationPct: number

  detectionCount: number
  activeDays: number
  persistenceDays: number
  recurrenceRate: number
  nightRatio: number
  dayRatio: number
  frpSlope: number
  firstDetection: string | null
  lastDetection: string | null

  predictedClass: SourceClass
  predictedLabel: string
  confidence: number
  behaviour: Behaviour

  coverageQualityScore: number
  osmIndustrialDensity5km: number
  registerFacilityCount5km: number
  nearestFacilityKm: number
  facilityAbsent: boolean

  dataQuality: DataQuality
  sentinel1Available: boolean
  sentinel2Available: boolean
  sarQualityScore: number
  opticalQualityScore: number
  cloudFraction: number
  temporalGapDays: number

  registerNote?: string | null
  flareStacks?: number
  commissioningYear?: number | null
  combustionTech?: string | null
  units?: number | null
  osmId?: string
  labelTier?: string | null
  gemEntityId?: string | null
  hostSiteId?: string
}

export interface LandCover {
  builtup: number
  cropland: number
  forest: number
  bare: number
  grass: number
  water: number
}

export interface UnmappedCandidate {
  id: string
  rank: number
  label: string
  state: string
  lat: number
  lon: number
  tHot: number
  deltaT: number
  frpDensity: number
  frpPeak: number
  persistenceDays: number
  detectionCount: number
  activeDays: number
  recurrenceRate: number
  nightRatio: number
  saturationFraction: number
  firstDetection: string
  lastDetection: string
  facilityAbsent: boolean
  coverageQualityScore: number
  osmIndustrialDensity5km: number
  registerFacilityCount5km: number
  nearestFacilityKm: number
  distanceToKnownMineKm: number
  assessment: Assessment
  landcover: LandCover
  sentinel1Available: boolean
  sarQualityScore: number
  sentinel2Available: boolean
  opticalQualityScore: number
}

export interface Detection {
  id: string
  siteId: string | null
  lat: number
  lon: number
  frp: number
  brightness: number
  brightT31: number
  confidence: number
  daynight: 'D' | 'N'
  satellite: string
  instrument: string
  dataQuality: DataQuality
  acqDate: string
  scan: number
  track: number
}

export interface SiteSeries {
  start: string
  frp: number[]
  low: number[]
  high: number[]
}

export interface EvidenceItem {
  feature: string
  note: string
}

export interface Alert {
  id: string
  siteId: string
  title: string
  siteName: string
  state: string
  lat: number
  lon: number
  sourceClass: SourceClass
  sourceLabel: string
  branch: Branch
  confidence: number
  currentFrp: number
  normalLow: number
  normalHigh: number
  deviationPct: number
  severity: Severity
  minutesAgo: number
  status: AlertStatus
  evidenceModel: EvidenceItem[]
  evidenceContext: EvidenceItem[]
}

export interface CoverageRow {
  class: string
  label: string
  features: number
  typedNamed: number
  osmOnly: number
  withRegisters: number
}

export interface Coverage {
  rows: CoverageRow[]
  rawFeatures: number
  uniqueFeatures: number
  duplicateRows: number
  generatorNoise: number
  usableForWeakSupervision: number
  namedPct: number
  osmOnlyOverall: number
  withRegistersOverall: number
  note: string
}

export interface ShapRow {
  feature: string
  value: string
  contribution: number
}

export interface ShapEntry {
  model: ShapRow[]
  context: ShapRow[]
  baseValue: number
}

export interface SpectralEntry {
  available: boolean
  cloudFraction: number
  opticalQualityScore: number
  temporalGapDays: number
  unavailableReason: string | null
  dNdvi: number
  dNbr: number
  dNdmi: number
  series: { month: string; ndvi: number; nbr: number; ndmi: number }[]
  swirHotUnits: number | null
}

export interface SarEntry {
  available: boolean
  qualityScore: number
  vvBefore: number
  vvAfter: number
  vhBefore: number
  vhAfter: number
  dVv: number
  dVh: number
  ratioBefore: number
  ratioAfter: number
  read: string
}

export interface PerClassMetric {
  class: SourceClass
  label: string
  support: number
  precision: number
  recall: number
  f1: number
}

export interface Ablation {
  run: string
  features: string
  accuracy: number | null
  macroF1: number | null
  status: 'complete' | 'pending'
}

export interface ModelReport {
  accuracy: number
  macroF1: number
  evaluatedSites: number
  classes: number
  classOrder: SourceClass[]
  classLabels: string[]
  confusionMatrix: number[][]
  perClass: PerClassMetric[]
  controls: { total: number; monitored: number; falsePositives: number; note: string }
  ablations: Ablation[]
  keyAblation: { from: string; to: string; accuracyDelta: number; macroF1Delta: number; claim: string }
  pendingNote: string
}

export interface ValidationTier {
  tier: string
  name: string
  sites: number
  humanNeeded: boolean
  source: string
}

export interface Transition {
  id: string
  plant: string
  lat: number
  lon: number
  transition: string
  year: number
  mw: number
  units: number | null
  expected: string
  observed: string
  pass: boolean
}

export interface ValidationReport {
  tiers: ValidationTier[]
  transitions: Transition[]
  transitionPassRate: number
  note: string
}

export interface SourceStatus {
  requirement: string
  status: 'DONE' | 'MANUAL' | 'BLOCKED'
  detail: string
  tier: string
}

export interface Milestone {
  id: string
  name: string
  dependency: string
  risk: string
  scope: string
  status: string
}

export interface SourceReport {
  sources: SourceStatus[]
  milestones: Milestone[]
}

export interface Meta {
  generatedFrom: string
  seed: string
  windowStart: string
  windowEnd: string
  counts: Record<string, number>
  realSources: Record<string, number>
}

export type TimeWindow = '7d' | '30d' | '1y' | 'all'
