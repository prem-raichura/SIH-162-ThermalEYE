import { useMemo } from 'react'
import { INDUSTRIAL_CLASSES, sites as allSites, unmapped as allUnmapped, withinWindow } from '@/lib/data'
import { useFilters } from '@/store/useFilters'
import { useSettings } from '@/store/useSettings'

/**
 * CPCB sees the industrial branch only (section 13). Membership follows the *predicted*
 * class, not the register's label — the product classifies from thermal evidence, so a site
 * the model reads as a waste fire belongs on FSI's desk even if OSM tags it as a quarry.
 * Every page on this role reads its rows from here so the filter bar, the map and the tables
 * can never disagree.
 */
export function useCpcbSites() {
  const classes = useFilters((s) => s.classes)
  const state = useFilters((s) => s.state)
  const behaviour = useFilters((s) => s.behaviour)
  const window = useFilters((s) => s.window)

  const industrial = useMemo(() => allSites.filter((s) => INDUSTRIAL_CLASSES.includes(s.predictedClass)), [])

  const filtered = useMemo(
    () =>
      industrial.filter((s) => {
        if (classes && classes.length > 0 && !classes.includes(s.predictedClass)) return false
        if (state && s.state !== state) return false
        if (behaviour !== 'all' && s.behaviour !== behaviour) return false
        if (window !== 'all' && !withinWindow(s.lastDetection, window, s.id)) return false
        return true
      }),
    [industrial, classes, state, behaviour, window],
  )

  const states = useMemo(() => [...new Set(industrial.map((s) => s.state))].sort(), [industrial])

  return { industrial, filtered, states }
}

/** The unmapped queue, gated by the coverage-quality floor set in Settings. */
export function useUnmappedQueue() {
  const minCoverage = useSettings((s) => s.minCoverageQuality)
  const state = useFilters((s) => s.state)

  return useMemo(
    () =>
      allUnmapped.filter((u) => {
        if (u.coverageQualityScore < minCoverage) return false
        if (state && u.state !== state) return false
        return true
      }),
    [minCoverage, state],
  )
}
