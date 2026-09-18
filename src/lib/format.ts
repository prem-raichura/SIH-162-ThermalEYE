/** Formatting helpers. Every number the product shows carries a unit. */

export const nf = (v: number, digits = 0) =>
  v.toLocaleString('en-IN', { minimumFractionDigits: digits, maximumFractionDigits: digits })

export const kelvin = (v: number | null) => (v === null ? '—' : `${nf(v)} K`)
export const megawatt = (v: number | null, d = 1) => (v === null ? '—' : `${nf(v, d)} MW`)
export const mwPerKm2 = (v: number | null, d = 1) => (v === null ? '—' : `${nf(v, d)} MW/km²`)
export const sqm = (v: number | null) => (v === null ? '—' : `${nf(v)} m²`)
export const days = (v: number | null) => (v === null ? '—' : `${nf(v)} d`)
export const pct = (v: number | null, d = 0) => (v === null ? '—' : `${nf(v * 100, d)}%`)
export const pctRaw = (v: number | null, d = 0) => (v === null ? '—' : `${nf(v, d)}%`)
export const coord = (lat: number, lon: number) => `${lat.toFixed(4)}, ${lon.toFixed(4)}`

export function relativeTime(minutesAgo: number): string {
  if (minutesAgo < 60) return `${Math.round(minutesAgo)} min ago`
  const hours = minutesAgo / 60
  if (hours < 24) return `${Math.round(hours)} hour${Math.round(hours) === 1 ? '' : 's'} ago`
  return `${Math.round(hours / 24)} day${Math.round(hours / 24) === 1 ? '' : 's'} ago`
}

export function shortDate(iso: string | null): string {
  if (!iso) return '—'
  const d = new Date(`${iso}T00:00:00Z`)
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', timeZone: 'UTC' })
}

export function istClock(d = new Date()): string {
  return d.toLocaleTimeString('en-IN', { hour12: false, timeZone: 'Asia/Kolkata' })
}

export function istDate(d = new Date()): string {
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', timeZone: 'Asia/Kolkata' })
}
