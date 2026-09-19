import { create } from 'zustand'
import { DEFAULT_SEVERITY_CONFIG, type RouteId, type SeverityConfig } from '@/lib/severity'
import type { Severity, SourceClass } from '@/lib/types'

/** What an operator did with an alert. Dispositions are session state, not shipped data. */
export type Disposition = 'acknowledged' | 'escalated' | 'dismissed'

/** How far back the response feed looks. Disaster response works in hours, not months. */
export type AlertWindow = 6 | 24 | 72 | 0

export const ALERT_WINDOWS: { hours: AlertWindow; label: string }[] = [
  { hours: 6, label: '6 h' },
  { hours: 24, label: '24 h' },
  { hours: 72, label: '72 h' },
  { hours: 0, label: 'All' },
]

interface NdmaState {
  config: SeverityConfig
  windowHours: AlertWindow
  disposition: Record<string, Disposition>
  /** Alert ids the simulated FIRMS pass has released into the stream. */
  ingested: string[]
  passes: number
  selectedAlertId: string | null

  setBand: (key: 'highPct' | 'mediumPct', value: number) => void
  setMinConfidence: (value: number) => void
  toggleClass: (cls: SourceClass) => void
  setQuietHours: (patch: Partial<SeverityConfig['quietHours']>) => void
  setRoute: (severity: Severity, route: RouteId) => void
  resetConfig: () => void
  setWindow: (hours: AlertWindow) => void
  setDisposition: (id: string, disposition: Disposition | null) => void
  ingest: (id: string) => void
  selectAlert: (id: string | null) => void
}

const KEY = 'te.ndma'

interface Persisted {
  config: SeverityConfig
  windowHours: AlertWindow
}

const saved = (): Partial<Persisted> => {
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? '{}') as Partial<Persisted>
  } catch {
    return {}
  }
}

export const useNdma = create<NdmaState>((set, get) => {
  const initial = saved()
  const persist = () => {
    const { config, windowHours } = get()
    localStorage.setItem(KEY, JSON.stringify({ config, windowHours }))
  }
  const patchConfig = (patch: Partial<SeverityConfig>) => {
    set((s) => ({ config: { ...s.config, ...patch } }))
    persist()
  }

  return {
    config: { ...DEFAULT_SEVERITY_CONFIG, ...(initial.config ?? {}) },
    windowHours: initial.windowHours ?? 24,
    disposition: {},
    ingested: [],
    passes: 0,
    selectedAlertId: null,

    // The bands cannot cross: medium always sits below high.
    setBand: (key, value) => {
      const { config } = get()
      if (key === 'highPct') patchConfig({ highPct: Math.max(value, config.mediumPct + 5) })
      else patchConfig({ mediumPct: Math.min(value, config.highPct - 5) })
    },
    setMinConfidence: (minConfidence) => patchConfig({ minConfidence }),
    toggleClass: (cls) => {
      const current = get().config.excludedClasses
      patchConfig({
        excludedClasses: current.includes(cls) ? current.filter((c) => c !== cls) : [...current, cls],
      })
    },
    setQuietHours: (patch) => patchConfig({ quietHours: { ...get().config.quietHours, ...patch } }),
    setRoute: (severity, route) => patchConfig({ routing: { ...get().config.routing, [severity]: route } }),
    resetConfig: () => {
      set({ config: DEFAULT_SEVERITY_CONFIG })
      persist()
    },
    setWindow: (windowHours) => {
      set({ windowHours })
      persist()
    },
    setDisposition: (id, disposition) =>
      set((s) => {
        const next = { ...s.disposition }
        if (disposition === null) delete next[id]
        else next[id] = disposition
        return { disposition: next }
      }),
    ingest: (id) => set((s) => (s.ingested.includes(id) ? s : { ingested: [...s.ingested, id], passes: s.passes + 1 })),
    selectAlert: (selectedAlertId) => set({ selectedAlertId }),
  }
})
