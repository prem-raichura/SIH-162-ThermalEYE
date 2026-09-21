import { useMemo } from 'react'
import { landcover, sites as allSites, unmapped as allUnmapped, withinWindow } from '@/lib/data'
import { useFilters } from '@/store/useFilters'
import type { ThermalSite, UnmappedCandidate } from '@/lib/types'

/** Mine fires burn for years; waste dumps flare and die. The rule is stated, not assumed. */
export type FireSubtype = 'coal-seam-like' | 'waste-dump-like' | 'episodic'

export interface SubtypeConfig {
  seamPersistDays: number
  seamNightRatio: number
  dumpPersistDays: number
}

export function fireSubtype(site: ThermalSite, cfg: SubtypeConfig): FireSubtype {
  if (site.persistenceDays > cfg.seamPersistDays && site.nightRatio > cfg.seamNightRatio) return 'coal-seam-like'
  if (site.persistenceDays > cfg.dumpPersistDays) return 'waste-dump-like'
  return 'episodic'
}

export const SUBTYPE_NOTE =
  'Subtype is a stated reading of the thermal record, not a register label: over a year of persistence with night activity reads as a seam fire; a shorter sustained burn reads as a waste dump; anything briefer is episodic.'

/**
 * IBM owns the mine directory, and the doc is explicit that mine coverage is patchy — which
 * is exactly the gap the discovery pipeline targets. This role sees the mining class plus
 * the unmapped candidates sitting in mining land cover.
 */
export function useIbmSites() {
  const state = useFilters((s) => s.state)
  const behaviour = useFilters((s) => s.behaviour)
  const window = useFilters((s) => s.window)

  const mines = useMemo(() => allSites.filter((s) => s.predictedClass === 'mining'), [])

  const filtered = useMemo(
    () =>
      mines.filter((s) => {
        if (state && s.state !== state) return false
        if (behaviour !== 'all' && s.behaviour !== behaviour) return false
        if (window !== 'all' && !withinWindow(s.lastDetection, window, s.id)) return false
        return true
      }),
    [mines, state, behaviour, window],
  )

  const states = useMemo(() => [...new Set(mines.map((s) => s.state))].sort(), [mines])

  /** Candidates whose land cover reads as mining ground: bare or built-up dominant. */
  const candidates = useMemo(
    () =>
      allUnmapped
        .filter((u) => u.landcover.bare + u.landcover.builtup > u.landcover.cropland + u.landcover.forest)
        .filter((u) => (state ? u.state === state : true)),
    [state],
  )

  const cover = useMemo(() => {
    const total = { forest: 0, cropland: 0, builtup: 0, bare: 0, grass: 0, water: 0 }
    for (const s of filtered) {
      const mix = landcover[s.id]
      if (!mix) continue
      total.forest += mix.forest
      total.cropland += mix.cropland
      total.builtup += mix.builtup
      total.bare += mix.bare
      total.grass += mix.grass
      total.water += mix.water
    }
    const n = Math.max(filtered.length, 1)
    return {
      forest: Math.round((total.forest / n) * 10) / 10,
      cropland: Math.round((total.cropland / n) * 10) / 10,
      builtup: Math.round((total.builtup / n) * 10) / 10,
      bare: Math.round((total.bare / n) * 10) / 10,
      grass: Math.round((total.grass / n) * 10) / 10,
      water: Math.round((total.water / n) * 10) / 10,
    }
  }, [filtered])

  return { mines, filtered, states, candidates, cover }
}

export function candidateRank(rows: UnmappedCandidate[]) {
  return [...rows].sort((a, b) => b.persistenceDays * b.tHot - a.persistenceDays * a.tHot)
}
