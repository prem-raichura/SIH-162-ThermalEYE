import { create } from 'zustand'

interface MapConsoleState {
  /** Keyed by dock title, so a dock stays as the operator left it when they switch roles. */
  docksOpen: Record<string, boolean>
  setDockOpen: (key: string, open: boolean) => void
}

export const useMapConsole = create<MapConsoleState>((set) => ({
  docksOpen: {},
  setDockOpen: (key, open) => set((s) => ({ docksOpen: { ...s.docksOpen, [key]: open } })),
}))
