import { create } from 'zustand'
import type { LayerId } from './useLayers'
import type { TimeWindow } from '@/lib/types'

export type TempUnit = 'K' | 'C'

interface SettingsState {
  units: TempUnit
  defaultWindow: TimeWindow
  minCoverageQuality: number
  defaultLayers: LayerId[]
  setUnits: (units: TempUnit) => void
  setDefaultWindow: (window: TimeWindow) => void
  setMinCoverageQuality: (value: number) => void
  toggleDefaultLayer: (id: LayerId) => void
}

const KEY = 'te.settings'

const saved = (): Partial<SettingsState> => {
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? '{}') as Partial<SettingsState>
  } catch {
    return {}
  }
}

export const useSettings = create<SettingsState>((set, get) => {
  const persist = () => {
    const { units, defaultWindow, minCoverageQuality, defaultLayers } = get()
    localStorage.setItem(KEY, JSON.stringify({ units, defaultWindow, minCoverageQuality, defaultLayers }))
  }
  const initial = saved()

  return {
    units: initial.units ?? 'K',
    defaultWindow: initial.defaultWindow ?? '24h',
    minCoverageQuality: initial.minCoverageQuality ?? 0,
    defaultLayers: initial.defaultLayers ?? ['thermal', 'sites', 'unmapped'],
    setUnits: (units) => {
      set({ units })
      persist()
    },
    setDefaultWindow: (defaultWindow) => {
      set({ defaultWindow })
      persist()
    },
    setMinCoverageQuality: (minCoverageQuality) => {
      set({ minCoverageQuality })
      persist()
    },
    toggleDefaultLayer: (id) => {
      const current = get().defaultLayers
      set({ defaultLayers: current.includes(id) ? current.filter((l) => l !== id) : [...current, id] })
      persist()
    },
  }
})

/** Temperature readings follow the unit chosen in Settings. */
export function formatTemp(kelvin: number | null, units: TempUnit): string {
  if (kelvin === null) return '—'
  if (units === 'C') return `${Math.round(kelvin - 273.15).toLocaleString('en-IN')} °C`
  return `${Math.round(kelvin).toLocaleString('en-IN')} K`
}
