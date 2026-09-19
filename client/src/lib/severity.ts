/**
 * Severity policy for the response feed.
 *
 * An alert's severity is how far a site sits above *its own* normal ceiling — never a global
 * FRP threshold (section 19). The bands here are the shipped defaults and match
 * SEVERITY_BANDS in scripts/build-static-data.mjs, so the severity stored in alerts.json is
 * what an untouched configuration reproduces. NDMA can move the bands at runtime, which
 * re-bins the live list.
 */
import type { Alert, Severity, SourceClass } from './types'

export type RouteId = 'state_eoc' | 'district' | 'log_only'

export interface RouteDef {
  id: RouteId
  label: string
  detail: string
}

export const ROUTES: RouteDef[] = [
  { id: 'state_eoc', label: 'State EOC', detail: 'Paged to the state emergency operations centre' },
  { id: 'district', label: 'District control room', detail: 'Sent to the district disaster management cell' },
  { id: 'log_only', label: 'Log only', detail: 'Recorded in the feed, nobody paged' },
]

export const ROUTE_LABEL: Record<RouteId, string> = {
  state_eoc: 'State EOC',
  district: 'District control room',
  log_only: 'Log only',
}

export interface QuietHours {
  enabled: boolean
  /** IST hour the quiet period opens, inclusive. */
  from: number
  /** IST hour it closes, exclusive. Wraps past midnight. */
  to: number
}

export interface SeverityConfig {
  /** Deviation above the site's own normal ceiling, in %, at or above which an alert is high. */
  highPct: number
  mediumPct: number
  /** Classifier confidence an alert must carry before anyone is paged. */
  minConfidence: number
  /** Predicted classes NDMA does not want in the response feed. */
  excludedClasses: SourceClass[]
  quietHours: QuietHours
  routing: Record<Severity, RouteId>
}

export const DEFAULT_SEVERITY_CONFIG: SeverityConfig = {
  highPct: 140,
  mediumPct: 40,
  minConfidence: 0.6,
  excludedClasses: [],
  quietHours: { enabled: false, from: 22, to: 6 },
  routing: { high: 'state_eoc', medium: 'district', low: 'log_only' },
}

export const SEVERITY_LABEL: Record<Severity, string> = {
  high: 'High',
  medium: 'Medium',
  low: 'Low',
}

export const SEVERITY_ORDER: Severity[] = ['high', 'medium', 'low']

export function severityFor(deviationPct: number, config: SeverityConfig): Severity {
  if (deviationPct >= config.highPct) return 'high'
  if (deviationPct >= config.mediumPct) return 'medium'
  return 'low'
}

export type SuppressionReason = 'class' | 'confidence'

/** Why an alert never reaches the feed, or null when it does. */
export function suppressionFor(alert: Alert, config: SeverityConfig): SuppressionReason | null {
  if (config.excludedClasses.includes(alert.sourceClass)) return 'class'
  if (alert.confidence < config.minConfidence) return 'confidence'
  return null
}

/** The hour in IST, which is the clock every control room in the country runs on. */
export function istHour(date = new Date()): number {
  return Number(date.toLocaleString('en-GB', { hour: '2-digit', hour12: false, timeZone: 'Asia/Kolkata' }))
}

export function inQuietHours(quiet: QuietHours, date = new Date()): boolean {
  if (!quiet.enabled) return false
  const hour = istHour(date)
  return quiet.from <= quiet.to ? hour >= quiet.from && hour < quiet.to : hour >= quiet.from || hour < quiet.to
}

export interface Routing {
  route: RouteId
  label: string
  /** True when quiet hours hold the page back and only the log is written. */
  held: boolean
}

/** Quiet hours never hold a high-severity alert — the whole point of the tier is that it pages. */
export function routeFor(severity: Severity, config: SeverityConfig, quiet: boolean): Routing {
  const route = config.routing[severity]
  const held = quiet && severity !== 'high' && route !== 'log_only'
  return { route: held ? 'log_only' : route, label: held ? 'Held — quiet hours' : ROUTE_LABEL[route], held }
}
