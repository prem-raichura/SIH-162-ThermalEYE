import { useMemo, useState } from 'react'
import { alerts as allAlerts, controlSites, sites as allSites, withinWindow } from '@/lib/data'
import { useFilters } from '@/store/useFilters'

/**
 * CEA owns the thermal and coal power station directory, so this role sees the power class
 * only. Large thermal stations are among the best-mapped facilities in India, which is what
 * makes per-station baseline modelling reliable enough to alert on.
 */
export function useCeaSites() {
  const state = useFilters((s) => s.state)
  const behaviour = useFilters((s) => s.behaviour)
  const window = useFilters((s) => s.window)
  const [fuel, setFuel] = useState<string | null>(null)

  const plants = useMemo(() => allSites.filter((s) => s.predictedClass === 'power_thermal'), [])

  const filtered = useMemo(
    () =>
      plants.filter((s) => {
        if (fuel && (s.fuel ?? 'Unknown') !== fuel) return false
        if (state && s.state !== state) return false
        if (behaviour !== 'all' && s.behaviour !== behaviour) return false
        if (window !== 'all' && !withinWindow(s.lastDetection, window)) return false
        return true
      }),
    [plants, fuel, state, behaviour, window],
  )

  const fuels = useMemo(() => {
    const counts = new Map<string, number>()
    for (const p of plants) counts.set(p.fuel ?? 'Unknown', (counts.get(p.fuel ?? 'Unknown') ?? 0) + 1)
    return [...counts.entries()].sort((a, b) => b[1] - a[1])
  }, [plants])

  const states = useMemo(() => [...new Set(plants.map((s) => s.state))].sort(), [plants])

  const siteIds = useMemo(() => new Set(filtered.map((s) => s.id)), [filtered])
  const alerts = useMemo(() => allAlerts.filter((a) => siteIds.has(a.siteId)), [siteIds])

  // Solar, wind and hydro plants from WRI. Real power facilities that emit no thermal
  // signature — a model that calls one a power plant is reading the map, not the physics.
  const controls = useMemo(() => controlSites(), [])

  return { plants, filtered, fuels, fuel, setFuel, states, alerts, controls }
}
