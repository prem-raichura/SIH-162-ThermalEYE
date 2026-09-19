import { create } from 'zustand'

export type LayerId = 'thermal' | 'sites' | 'unmapped' | 'boundary' | 'landcover' | 'districts' | 'alerts'
export type Basemap = 'offline' | 'satellite'

export interface LayerDef {
  id: LayerId
  label: string
}

export const LAYERS: LayerDef[] = [
  { id: 'thermal', label: 'Thermal (IR)' },
  { id: 'sites', label: 'Thermal sites' },
  { id: 'unmapped', label: 'Unmapped candidates' },
  { id: 'alerts', label: 'Alerts' },
  { id: 'boundary', label: 'Facility boundary' },
  { id: 'landcover', label: 'Land cover' },
  { id: 'districts', label: 'Districts' },
]

interface LayerState {
  visible: Record<LayerId, boolean>
  basemap: Basemap
  tilesFailed: boolean
  toggle: (id: LayerId) => void
  setVisible: (next: Partial<Record<LayerId, boolean>>) => void
  setBasemap: (basemap: Basemap) => void
  setTilesFailed: (failed: boolean) => void
}

export const useLayers = create<LayerState>((set) => ({
  visible: {
    thermal: true,
    sites: true,
    unmapped: true,
    alerts: false,
    boundary: false,
    landcover: false,
    districts: false,
  },
  // Satellite is the default view: imagery is what makes a thermal site legible as a place.
  // It needs a connection, and when the tiles fail the map falls back to the offline
  // basemap and says so, so the app still works with no network at all.
  basemap: 'satellite',
  tilesFailed: false,
  toggle: (id) => set((s) => ({ visible: { ...s.visible, [id]: !s.visible[id] } })),
  setVisible: (next) => set((s) => ({ visible: { ...s.visible, ...next } })),
  setBasemap: (basemap) => set({ basemap }),
  setTilesFailed: (tilesFailed) => set({ tilesFailed }),
}))
