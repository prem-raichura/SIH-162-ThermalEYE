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

  setWindow: (window: TimeWindow) => void
  setClasses: (classes: SourceClass[] | null) => void
  toggleClass: (cls: SourceClass) => void
  setState: (state: string | null) => void
  setBehaviour: (behaviour: Behaviour | 'all') => void
  setSearch: (search: string) => void
  selectSite: (id: string | null) => void
  selectUnmapped: (id: string | null) => void
  reset: () => void
}

const base = {
  window: '1y' as TimeWindow,
  classes: null,
  state: null,
  behaviour: 'all' as const,
  search: '',
  selectedSiteId: null,
  selectedUnmappedId: null,
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
  selectSite: (selectedSiteId) => set({ selectedSiteId, selectedUnmappedId: null }),
  selectUnmapped: (selectedUnmappedId) => set({ selectedUnmappedId, selectedSiteId: null }),
  reset: () => set(base),
}))
