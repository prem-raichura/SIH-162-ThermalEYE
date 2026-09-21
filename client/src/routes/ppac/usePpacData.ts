import { useMemo } from 'react'
import { sites as allSites, withinWindow } from '@/lib/data'
import { useFilters } from '@/store/useFilters'
import { nf } from '@/lib/format'
import type { SourceClass, ThermalSite } from '@/lib/types'

export const PPAC_CLASSES: SourceClass[] = ['refinery', 'gas_flare', 'lng_gas']

/**
 * PPAC and PNGRB own the refinery list, LNG terminals and gas infrastructure, so this role
 * sees the hydrocarbon classes only. Membership follows the predicted class — the product
 * classifies from thermal evidence, not from the register.
 */
export function usePpacSites() {
  const classes = useFilters((s) => s.classes)
  const state = useFilters((s) => s.state)
  const behaviour = useFilters((s) => s.behaviour)
  const window = useFilters((s) => s.window)

  const hydrocarbon = useMemo(() => allSites.filter((s) => PPAC_CLASSES.includes(s.predictedClass)), [])

  const filtered = useMemo(
    () =>
      hydrocarbon.filter((s) => {
        if (classes && classes.length > 0 && !classes.includes(s.predictedClass)) return false
        if (state && s.state !== state) return false
        if (behaviour !== 'all' && s.behaviour !== behaviour) return false
        if (window !== 'all' && !withinWindow(s.lastDetection, window, s.id)) return false
        return true
      }),
    [hydrocarbon, classes, state, behaviour, window],
  )

  const states = useMemo(() => [...new Set(hydrocarbon.map((s) => s.state))].sort(), [hydrocarbon])
  const flares = useMemo(() => filtered.filter((s) => s.predictedClass === 'gas_flare'), [filtered])
  const refineries = useMemo(
    () => allSites.filter((s) => s.registerSource === 'ppac').sort((a, b) => (b.capacity ?? 0) - (a.capacity ?? 0)),
    [],
  )

  return { hydrocarbon, filtered, flares, refineries, states }
}

/**
 * The flare signature of section 7.5: persistent, night-active, high dual-band contrast,
 * high retrieved temperature, small source area. Each condition is checked against the
 * site's own retrieved values so the verdict can be read rather than trusted.
 */
export interface SignatureCheck {
  label: string
  value: string
  threshold: string
  pass: boolean
}

export interface FlareConfig {
  flarePersistDays: number
  flareNightRatio: number
  flareDeltaT: number
  flareTHot: number
  flareMaxAreaM2: number
}

export function flareSignature(site: ThermalSite, cfg: FlareConfig): SignatureCheck[] {
  return [
    {
      label: 'Persistent',
      value: `${site.persistenceDays} d`,
      threshold: `over ${nf(cfg.flarePersistDays)} d`,
      pass: site.persistenceDays > cfg.flarePersistDays,
    },
    {
      label: 'Night-active',
      value: site.nightRatio.toFixed(2),
      threshold: `night ratio above ${cfg.flareNightRatio.toFixed(2)}`,
      pass: site.nightRatio > cfg.flareNightRatio,
    },
    {
      label: 'High dual-band contrast',
      value: `${site.deltaT ?? 0} K`,
      threshold: `ΔT above ${nf(cfg.flareDeltaT)} K`,
      pass: (site.deltaT ?? 0) > cfg.flareDeltaT,
    },
    {
      label: 'High retrieved temperature',
      value: `${site.tHot ?? 0} K`,
      threshold: `T_hot above ${nf(cfg.flareTHot)} K`,
      pass: (site.tHot ?? 0) > cfg.flareTHot,
    },
    {
      label: 'Small source area',
      value: `${site.sourceAreaM2 ?? 0} m²`,
      threshold: `under ${nf(cfg.flareMaxAreaM2)} m²`,
      pass: (site.sourceAreaM2 ?? 0) < cfg.flareMaxAreaM2,
    },
  ]
}
