/**
 * Per-role settings: the shape, the shipped defaults, and how each field presents itself.
 *
 * Every default here is the literal that used to sit inline in the page that reads it, so an
 * untouched install behaves exactly as it did before the settings pages existed. Moving a
 * value moves the view — nothing in this file is decorative, because a control only earns a
 * place here if some page compares a stored per-record scalar against it.
 *
 * What deliberately has no knob: `behaviour`, `assessment`, `predictedClass`, `confidence`,
 * the baked `severity` on an alert, and every `coverage.*` / `model.*` / `validation.*`
 * aggregate. Those are decided by the offline build and frozen in JSON — a slider cannot
 * recompute them, so offering one would be a lie.
 */
import type { LayerId } from '@/store/useLayers'
import type { RoleId } from './roles'
import type { SourceClass, TimeWindow } from './types'

export type TempUnit = 'K' | 'C'
export type Density = 'comfortable' | 'compact'
export type ExportFormat = 'csv' | 'json'
/** The floor an alert must clear to appear in a role's own alert list. */
export type SeverityFloor = 'all' | 'medium' | 'high'

/** Preferences every role carries, whatever its remit. */
export interface CommonSettings {
  units: TempUnit
  defaultWindow: TimeWindow
  defaultLayers: LayerId[]
  density: Density
  tableRows: number
  exportFormat: ExportFormat
  alertMinSeverity: SeverityFloor
}

export interface RoleSettingsMap {
  cpcb: CommonSettings & {
    minCoverageQuality: number
    trustworthyCoverage: number
    industrialLikePersistDays: number
    reportTopN: number
  }
  ppac: CommonSettings & {
    flarePersistDays: number
    flareNightRatio: number
    flareDeltaT: number
    flareTHot: number
    flareMaxAreaM2: number
    saturationCutoff: number
  }
  cea: CommonSettings & {
    risingSlope: number
    historyMinDetections: number
    fuelTopN: number
  }
  ibm: CommonSettings & {
    seamPersistDays: number
    seamNightRatio: number
    dumpPersistDays: number
    longBurningDays: number
    farFromMinesKm: number
    trustworthyCoverage: number
  }
  fsi: CommonSettings & {
    deltaTBoundary: number
    vegetationClasses: SourceClass[]
  }
  /** NDMA's thresholds live in useNdma, which already persists and re-bins them. */
  ndma: CommonSettings
  /** NRSC's four provenance floors live in useNrsc, applied by passesProvenance. */
  nrsc: CommonSettings & {
    freshGapDays: number
  }
  admin: CommonSettings & {
    f1Good: number
    f1Warn: number
    holdoutGood: number
    holdoutWarn: number
  }
}

export type SettingsFor<K extends RoleId> = RoleSettingsMap[K]
export type AnySettings = RoleSettingsMap[RoleId]

const COMMON: CommonSettings = {
  units: 'K',
  defaultWindow: '24h',
  defaultLayers: ['thermal', 'sites', 'unmapped'],
  density: 'comfortable',
  tableRows: 25,
  exportFormat: 'csv',
  alertMinSeverity: 'all',
}

export const DEFAULT_ROLE_SETTINGS: { [K in RoleId]: SettingsFor<K> } = {
  cpcb: {
    ...COMMON,
    minCoverageQuality: 0,
    trustworthyCoverage: 0.66,
    industrialLikePersistDays: 180,
    reportTopN: 25,
  },
  ppac: {
    ...COMMON,
    flarePersistDays: 180,
    flareNightRatio: 0.45,
    flareDeltaT: 35,
    flareTHot: 1300,
    flareMaxAreaM2: 300,
    // The two pages disagreed — 0.2 on the flare table, 0.25 on the alert tile. One number now.
    saturationCutoff: 0.25,
  },
  cea: {
    ...COMMON,
    // Overview used 0.03 and the alert page 0.05 for the same question. One number now.
    risingSlope: 0.05,
    historyMinDetections: 200,
    fuelTopN: 5,
  },
  ibm: {
    ...COMMON,
    seamPersistDays: 365,
    seamNightRatio: 0.35,
    dumpPersistDays: 90,
    longBurningDays: 365,
    farFromMinesKm: 10,
    trustworthyCoverage: 0.66,
  },
  fsi: {
    ...COMMON,
    deltaTBoundary: 30,
    vegetationClasses: ['crop_burning', 'forest_fire', 'waste_fire', 'other_unknown'],
  },
  ndma: { ...COMMON, defaultWindow: '24h' },
  nrsc: { ...COMMON, freshGapDays: 7 },
  admin: {
    ...COMMON,
    f1Good: 0.85,
    f1Warn: 0.7,
    holdoutGood: 0.88,
    holdoutWarn: 0.8,
  },
}

/** How one numeric field presents itself: the slider bounds and how the value reads. */
export interface FieldMeta {
  label: string
  hint: string
  min: number
  max: number
  step: number
  /** Rendered after the value; omit for a bare number. */
  unit?: string
  /** Decimal places in the readout. Defaults to 0. */
  digits?: number
}

type NumericKeys<K extends RoleId> = {
  [F in keyof SettingsFor<K>]: SettingsFor<K>[F] extends number ? F : never
}[keyof SettingsFor<K>]

type RoleFieldMeta = { [K in RoleId]: Partial<Record<NumericKeys<K> & string, FieldMeta>> }

/**
 * The thresholds panel is generated from this table, so adding a knob is one entry plus one
 * read at the call site — not another hand-built form.
 */
export const FIELD_META: RoleFieldMeta = {
  cpcb: {
    minCoverageQuality: {
      label: 'Minimum coverage quality',
      hint: 'How much mapping effort an area needs before a candidate from it is listed at all.',
      min: 0,
      max: 0.9,
      step: 0.05,
      digits: 2,
    },
    trustworthyCoverage: {
      label: 'Well-mapped threshold',
      hint: 'At or above this score the area is treated as well surveyed, so an absent facility is a real gap rather than a missing record.',
      min: 0.2,
      max: 0.95,
      step: 0.01,
      digits: 2,
    },
    industrialLikePersistDays: {
      label: 'High-priority persistence',
      hint: 'An industrial-like candidate burning longer than this is counted as high priority. The industrial-like verdict itself is fixed by the build.',
      min: 30,
      max: 720,
      step: 10,
      unit: 'd',
    },
    reportTopN: {
      label: 'Report candidates',
      hint: 'How many sites the reports page offers, ranked by detection count.',
      min: 5,
      max: 100,
      step: 5,
    },
  },
  ppac: {
    flarePersistDays: {
      label: 'Persistence',
      hint: 'A flare burns continuously. Below this the signature check fails.',
      min: 30,
      max: 720,
      step: 10,
      unit: 'd',
    },
    flareNightRatio: {
      label: 'Night ratio',
      hint: 'Share of detections acquired at night. Process heat runs around the clock.',
      min: 0.1,
      max: 0.9,
      step: 0.05,
      digits: 2,
    },
    flareDeltaT: {
      label: 'Dual-band contrast',
      hint: 'ΔT between the two bands. A small, very hot source separates strongly.',
      min: 5,
      max: 120,
      step: 5,
      unit: 'K',
    },
    flareTHot: {
      label: 'Retrieved temperature',
      hint: 'T_hot from the dual-band retrieval. Flares sit far above combustion plant.',
      min: 600,
      max: 2000,
      step: 25,
      unit: 'K',
    },
    flareMaxAreaM2: {
      label: 'Source area ceiling',
      hint: 'Retrieved emitting area. A flare tip is small; a burning yard is not.',
      min: 50,
      max: 2000,
      step: 50,
      unit: 'm²',
    },
    saturationCutoff: {
      label: 'Saturation cutoff',
      hint: 'Saturated-pixel fraction above which a site is counted as saturating.',
      min: 0.05,
      max: 0.8,
      step: 0.05,
      digits: 2,
    },
  },
  cea: {
    risingSlope: {
      label: 'Rising-trend slope',
      hint: 'FRP slope above which a station is called out as trending up.',
      min: 0.01,
      max: 0.5,
      step: 0.01,
      digits: 2,
    },
    historyMinDetections: {
      label: 'Baseline history',
      hint: 'Detections a station needs before its own baseline is treated as established.',
      min: 20,
      max: 800,
      step: 20,
    },
    fuelTopN: {
      label: 'Fuel mix slices',
      hint: 'Fuel types shown separately in the mix; the rest roll up.',
      min: 3,
      max: 10,
      step: 1,
    },
  },
  ibm: {
    seamPersistDays: {
      label: 'Seam-fire persistence',
      hint: 'A coal-seam fire burns for years. This and the night ratio together define the subtype.',
      min: 90,
      max: 1800,
      step: 30,
      unit: 'd',
    },
    seamNightRatio: {
      label: 'Seam-fire night ratio',
      hint: 'A seam fire keeps burning after dark; surface activity does not.',
      min: 0.1,
      max: 0.9,
      step: 0.05,
      digits: 2,
    },
    dumpPersistDays: {
      label: 'Waste-dump persistence',
      hint: 'Sustained but shorter than a seam fire. Anything briefer reads as episodic.',
      min: 14,
      max: 365,
      step: 7,
      unit: 'd',
    },
    longBurningDays: {
      label: 'Long-burning count',
      hint: 'Persistence at which a mine site counts towards the long-burning tile.',
      min: 90,
      max: 1800,
      step: 30,
      unit: 'd',
    },
    farFromMinesKm: {
      label: 'Distance from the directory',
      hint: 'A candidate further than this from any listed mine is flagged as off-register.',
      min: 1,
      max: 50,
      step: 1,
      unit: 'km',
    },
    trustworthyCoverage: {
      label: 'Well-mapped threshold',
      hint: 'At or above this coverage score the directory is treated as reliable for that area.',
      min: 0.2,
      max: 0.95,
      step: 0.01,
      digits: 2,
    },
  },
  fsi: {
    deltaTBoundary: {
      label: 'Separation boundary',
      hint: 'ΔT that separates industrial heat from vegetation burning. Moving it re-counts both sides of the scatter.',
      min: 5,
      max: 80,
      step: 1,
      unit: 'K',
    },
  },
  ndma: {},
  nrsc: {
    freshGapDays: {
      label: 'Fresh acquisition',
      hint: 'Temporal gap at or under which a record counts as freshly acquired.',
      min: 1,
      max: 60,
      step: 1,
      unit: 'd',
    },
  },
  admin: {
    f1Good: {
      label: 'Per-class F1 — good',
      hint: 'At or above this the class reads as healthy.',
      min: 0.5,
      max: 0.99,
      step: 0.01,
      digits: 2,
    },
    f1Warn: {
      label: 'Per-class F1 — warning',
      hint: 'Below this the class reads as failing rather than merely weak.',
      min: 0.3,
      max: 0.95,
      step: 0.01,
      digits: 2,
    },
    holdoutGood: {
      label: 'Holdout accuracy — good',
      hint: 'Regional accuracy at or above this reads as holding up.',
      min: 0.5,
      max: 0.99,
      step: 0.01,
      digits: 2,
    },
    holdoutWarn: {
      label: 'Holdout accuracy — warning',
      hint: 'Below this the region reads as a real weakness.',
      min: 0.3,
      max: 0.95,
      step: 0.01,
      digits: 2,
    },
  },
}

/** Formats a settings value for a readout, using the field's unit and precision. */
export function formatSetting(value: number, meta: FieldMeta): string {
  const n = value.toFixed(meta.digits ?? 0)
  return meta.unit ? `${n} ${meta.unit}` : n
}

/** Temperature readings follow the unit chosen in Settings. */
export function formatTemp(kelvin: number | null, units: TempUnit): string {
  if (kelvin === null) return '—'
  if (units === 'C') return `${Math.round(kelvin - 273.15).toLocaleString('en-IN')} °C`
  return `${Math.round(kelvin).toLocaleString('en-IN')} K`
}
