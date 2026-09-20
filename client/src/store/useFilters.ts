import { create } from 'zustand'
import type { SourceClass, TimeWindow, Behaviour } from '@/lib/types'

interface FilterState {
  window: TimeWindow
  classes: SourceClass[] | null
  state: string | null
  behaviour: Behaviour | 'all'
  search: string
  selectedSiteId: string | null
  selectedUnmappedId: string | null
  /** Whether the full-record drawer is showing. Closing it keeps the selection. */
  detailOpen: boolean

  setWindow: (window: TimeWindow) => void
  setClasses: (classes: SourceClass[] | null) => void
  toggleClass: (cls: SourceClass) => void
  setState: (state: string | null) => void
  setBehaviour: (behaviour: Behaviour | 'all') => void
  setSearch: (search: string) => void
  selectSite: (id: string | null) => void
  selectUnmapped: (id: string | null) => void
  openDetail: () => void
  closeDetail: () => void
  reset: () => void
}

const base = {
  // Opens on the most recent acquisition day, not a year of history.
  window: '24h' as TimeWindow,
  classes: null,
  state: null,
  behaviour: 'all' as const,
  search: '',
  selectedSiteId: null,
  selectedUnmappedId: null,
  detailOpen: false,
}

export const useFilters = create<FilterState>((set) => ({
  ...base,
  setWindow: (window) => set({ window }),
  setClasses: (classes) => set({ classes }),
  toggleClass: (cls) =>
    set((s) => {
      const current = s.classes ?? []
      return { classes: current.includes(cls) ? current.filter((c) => c !== cls) : [...current, cls] }
    }),
  setState: (state) => set({ state }),
  setBehaviour: (behaviour) => set({ behaviour }),
  setSearch: (search) => set({ search }),
  // Selecting fills the page's own panels. The full-record drawer is a deliberate second
  // step, opened from those panels.
  selectSite: (selectedSiteId) => set({ selectedSiteId, selectedUnmappedId: null, detailOpen: false }),
  selectUnmapped: (selectedUnmappedId) =>
    set({ selectedUnmappedId, selectedSiteId: null, detailOpen: false }),
  openDetail: () => set({ detailOpen: true }),
  closeDetail: () => set({ detailOpen: false }),
  reset: () => set(base),
}))
