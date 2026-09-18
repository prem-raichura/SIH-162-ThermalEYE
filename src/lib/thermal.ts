/**
 * The plasma ramp. It is the only colour in the product that encodes magnitude, and the
 * map, the legend, the charts and the tables all read it from here so one temperature
 * always looks the same everywhere.
 */
export const RAMP = ['#0d0887', '#6a00a8', '#b12a90', '#e16462', '#fca636', '#f0f921'] as const

export const RAMP_STOPS = RAMP.map((c, i) => ({ t: i / (RAMP.length - 1), color: c }))

function hexToRgb(hex: string): [number, number, number] {
  const v = Number.parseInt(hex.slice(1), 16)
  return [(v >> 16) & 255, (v >> 8) & 255, v & 255]
}

/** Position 0-1 along the ramp, interpolated in sRGB. */
export function rampAt(t: number): string {
  const clamped = Math.min(1, Math.max(0, t))
  const scaled = clamped * (RAMP.length - 1)
  const i = Math.min(RAMP.length - 2, Math.floor(scaled))
  const f = scaled - i
  const [r1, g1, b1] = hexToRgb(RAMP[i])
  const [r2, g2, b2] = hexToRgb(RAMP[i + 1])
  const mix = (a: number, b: number) => Math.round(a + (b - a) * f)
  return `rgb(${mix(r1, r2)}, ${mix(g1, g2)}, ${mix(b1, b2)})`
}

/** Maps a value in [min,max] onto the ramp. */
export function rampColor(value: number | null, min: number, max: number): string {
  if (value === null || !Number.isFinite(value)) return '#b8b1a2'
  return rampAt((value - min) / (max - min))
}

export const T_HOT_DOMAIN: [number, number] = [600, 1850]
export const FRP_DOMAIN: [number, number] = [0, 200]

export const tHotColor = (k: number | null) => rampColor(k, T_HOT_DOMAIN[0], T_HOT_DOMAIN[1])
export const frpColor = (mw: number | null) => rampColor(mw, FRP_DOMAIN[0], FRP_DOMAIN[1])

/** Kelvin to Celsius, for the reference's temperature readouts. */
export const kToC = (k: number | null) => (k === null ? null : Math.round(k - 273.15))

export const CLASS_COLOR: Record<string, string> = {
  refinery: '#c1462f',
  gas_flare: '#e0713c',
  lng_gas: '#d9924a',
  power_thermal: '#c98416',
  chemical: '#8c5bb0',
  steel_metal: '#6b5b95',
  cement: '#7d8b6a',
  brick_kiln: '#a6763f',
  mining: '#5f6f7e',
  industrial_fire: '#a52a2a',
  other_industrial: '#8a8577',
  crop_burning: '#c9a227',
  forest_fire: '#4f7a3f',
  waste_fire: '#a35b3c',
  other_unknown: '#9a9486',
  nonthermal_control: '#3f5e7a',
}

export const SEVERITY_COLOR = {
  high: '#c14a33',
  medium: '#c98416',
  low: '#2e5d4f',
} as const
