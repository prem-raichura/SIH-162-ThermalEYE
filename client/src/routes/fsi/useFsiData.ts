import { useMemo } from 'react'
import {
  loadDetections,
  sites as allSites,
  siteById,
  withinWindow,
} from '@/lib/data'
import type { Detection } from '@/lib/types'
import { useAsyncData } from '@/hooks/useAsyncData'

/** One frozen empty array, so a pending load does not re-key every memo below it. */
const NO_DETECTIONS: Detection[] = []
import { useFilters } from '@/store/useFilters'
import { useSettingsFor } from '@/store/useRoleSettings'
import type { SourceClass } from '@/lib/types'

/**
 * FSI runs national fire alerting off the same FIRMS feed, and their problem is the inverse
 * of everyone else's: industrial and agricultural heat contaminates their alerts. This role
 * therefore shows the non-industrial branch only, and states how much was filtered out.
 */
export function useFsiSites() {
  const classes = useFilters((s) => s.classes)
  const state = useFilters((s) => s.state)
  const window = useFilters((s) => s.window)
  // Which classes belong to the fire branch at all is a setting: a desk that does not act on
  // waste fires should not have to look at them.
  const branch = useSettingsFor('fsi').vegetationClasses

  const vegetation = useMemo(() => allSites.filter((s) => branch.includes(s.predictedClass)), [branch])
  const industrial = useMemo(() => allSites.filter((s) => s.branch === 'industrial'), [])

  const filtered = useMemo(
    () =>
      vegetation.filter((s) => {
        if (classes && classes.length > 0 && !classes.includes(s.predictedClass)) return false
        if (state && s.state !== state) return false
        if (window !== 'all' && !withinWindow(s.lastDetection, window, s.id)) return false
        return true
      }),
    [vegetation, classes, state, window],
  )

  const states = useMemo(() => [...new Set(vegetation.map((s) => s.state))].sort(), [vegetation])

  const counts = useMemo(() => {
    const byClass = new Map<SourceClass, number>()
    for (const s of filtered) byClass.set(s.predictedClass, (byClass.get(s.predictedClass) ?? 0) + 1)
    return byClass
  }, [filtered])

  return { vegetation, industrial, filtered, states, counts }
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

/**
 * Monthly detection counts per class, counted from the detection records rather than
 * modelled — the burn-season shape has to come from the data or it proves nothing.
 */
export function useSeasonalCounts() {
  const { data, pending, error, retry } = useAsyncData(loadDetections, 'Detection records')
  const detections = data ?? NO_DETECTIONS

  const series = useMemo(() => {
    const rows = MONTHS.map((month) => ({
      month,
      crop_burning: 0,
      forest_fire: 0,
      waste_fire: 0,
      industrial: 0,
    }))
    for (const d of detections) {
      if (d.siteId === null) continue
      const site = siteById(d.siteId)
      if (!site) continue
      const m = new Date(`${d.acqDate}T00:00:00Z`).getUTCMonth()
      if (site.branch === 'industrial') rows[m].industrial += 1
      else if (site.predictedClass === 'crop_burning') rows[m].crop_burning += 1
      else if (site.predictedClass === 'forest_fire') rows[m].forest_fire += 1
      else if (site.predictedClass === 'waste_fire') rows[m].waste_fire += 1
    }
    return rows
  }, [detections])

  /**
   * The same counts as a share of each class's own annual total. Industrial detections
   * outnumber vegetation ones several times over, so raw counts on one axis flatten the burn
   * seasons into a straight line — and a second y-axis would be worse. Indexing to a common
   * base keeps every class comparable on a single scale.
   */
  const indexed = useMemo(() => {
    const keys = ['crop_burning', 'forest_fire', 'waste_fire', 'industrial'] as const
    const totals = Object.fromEntries(
      keys.map((k) => [k, Math.max(series.reduce((a, r) => a + r[k], 0), 1)]),
    ) as Record<(typeof keys)[number], number>

    return series.map((row) => ({
      month: row.month,
      crop_burning: Math.round((row.crop_burning / totals.crop_burning) * 1000) / 10,
      forest_fire: Math.round((row.forest_fire / totals.forest_fire) * 1000) / 10,
      waste_fire: Math.round((row.waste_fire / totals.waste_fire) * 1000) / 10,
      industrial: Math.round((row.industrial / totals.industrial) * 1000) / 10,
    }))
  }, [series])

  return {
    series,
    indexed,
    sampled: detections.filter((d) => d.siteId !== null).length,
    // Passed through so the charts can say they are waiting rather than draw a flat year.
    pending,
    error,
    retry,
  }
}

/**
 * The shipped separation threshold of section 7.1. It is the default behind FSI's
 * `deltaTBoundary` setting; the pages read the setting, so this is the value an untouched
 * install reproduces rather than a constant anything compares against directly.
 */
export const DELTA_T_BOUNDARY = 30
