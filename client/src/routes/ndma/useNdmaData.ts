import { useEffect, useMemo, useRef } from 'react'
import { alerts as allAlerts, siteById } from '@/lib/data'
import {
  inQuietHours,
  routeFor,
  severityFor,
  suppressionFor,
  type Routing,
  type SuppressionReason,
} from '@/lib/severity'
import { useNdma, type Disposition } from '@/store/useNdma'
import type { Alert, Severity, SourceClass, ThermalSite } from '@/lib/types'
import type { RoleId } from '@/lib/roles'

/** One simulated FIRMS pass every 45 seconds. Local timer over static data — no feed is open. */
export const PASS_INTERVAL_MS = 45000

/** How many of the newest alerts are held back so a pass has something to release. */
export const QUEUE_SIZE = 8

export interface FeedAlert extends Alert {
  routing: Routing
  suppressed: SuppressionReason | null
  disposition: Disposition | null
  /** Still in the inbound queue — a pass has not released it into the stream yet. */
  queued: boolean
  site: ThermalSite | undefined
}

export interface NdmaFeed {
  /** Every alert, re-binned against the current configuration. */
  binned: FeedAlert[]
  /** What the operator sees: released, not suppressed, inside the window. */
  visible: FeedAlert[]
  active: FeedAlert[]
  acknowledged: FeedAlert[]
  escalated: FeedAlert[]
  dismissed: FeedAlert[]
  queue: FeedAlert[]
  counts: Record<Severity, number>
  suppressedCount: number
  outsideWindow: number
  quiet: boolean
  classes: SourceClass[]
  selected: FeedAlert | null
}

/**
 * The anomaly branch at response latency (section 19). Severity is recomputed here rather
 * than read from the file, so moving a threshold in Severity Settings re-bins the list the
 * operator is looking at.
 */
export function useNdmaFeed(): NdmaFeed {
  const config = useNdma((s) => s.config)
  const windowHours = useNdma((s) => s.windowHours)
  const disposition = useNdma((s) => s.disposition)
  const ingested = useNdma((s) => s.ingested)
  const selectedAlertId = useNdma((s) => s.selectedAlertId)

  const quiet = useMemo(() => inQuietHours(config.quietHours), [config.quietHours])

  const binned = useMemo(() => {
    const ordered = [...allAlerts].sort((a, b) => a.minutesAgo - b.minutesAgo)
    const heldBack = new Set(ordered.slice(0, QUEUE_SIZE).map((a) => a.id))
    return ordered.map((alert): FeedAlert => {
      const severity = severityFor(alert.deviationPct, config)
      return {
        ...alert,
        severity,
        routing: routeFor(severity, config, quiet),
        suppressed: suppressionFor(alert, config),
        disposition: disposition[alert.id] ?? null,
        queued: heldBack.has(alert.id) && !ingested.includes(alert.id),
        site: siteById(alert.siteId),
      }
    })
  }, [config, quiet, disposition, ingested])

  const released = useMemo(() => binned.filter((a) => !a.queued && a.suppressed === null), [binned])
  const visible = useMemo(
    () => released.filter((a) => windowHours === 0 || a.minutesAgo <= windowHours * 60),
    [released, windowHours],
  )

  const counts = useMemo(() => {
    const out: Record<Severity, number> = { high: 0, medium: 0, low: 0 }
    for (const a of visible) if (a.disposition !== 'dismissed') out[a.severity] += 1
    return out
  }, [visible])

  const classes = useMemo(() => [...new Set(allAlerts.map((a) => a.sourceClass))], [])

  return {
    binned,
    visible,
    active: visible.filter((a) => a.disposition === null),
    acknowledged: visible.filter((a) => a.disposition === 'acknowledged'),
    escalated: visible.filter((a) => a.disposition === 'escalated'),
    dismissed: visible.filter((a) => a.disposition === 'dismissed'),
    queue: binned.filter((a) => a.queued),
    counts,
    suppressedCount: binned.filter((a) => a.suppressed !== null).length,
    outsideWindow: released.length - visible.length,
    quiet,
    classes,
    selected: binned.find((a) => a.id === selectedAlertId) ?? null,
  }
}

/**
 * The simulated pass. It releases one queued alert every 45 s and writes the console lines a
 * real ingest would — the footer on the page says plainly that this is a timer over static
 * data, not an open satellite feed (section 31).
 */
export function useFirmsPass(roleId: RoleId, queue: FeedAlert[]) {
  const ingest = useNdma((s) => s.ingest)
  const queueRef = useRef(queue)

  useEffect(() => {
    queueRef.current = queue
  }, [queue])

  useEffect(() => {
    const id = window.setInterval(() => {
      const next = queueRef.current[0]
      if (!next) {
        return
      }
      ingest(next.id)
    }, PASS_INTERVAL_MS)
    return () => window.clearInterval(id)
  }, [roleId, ingest])
}

/** The sites behind the alerts in view, for the map layers. */
export function alertSites(feed: FeedAlert[]): ThermalSite[] {
  const seen = new Set<string>()
  const out: ThermalSite[] = []
  for (const a of feed) {
    if (!a.site || seen.has(a.site.id)) continue
    seen.add(a.site.id)
    out.push(a.site)
  }
  return out
}
