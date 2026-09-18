import { create } from 'zustand'
import type { RoleId } from '@/lib/roles'

export type LogTag = 'INFO' | 'SUCCESS' | 'WARN' | 'ERROR' | RoleId

export interface LogLine {
  id: number
  at: Date
  tag: LogTag
  message: string
}

const MAX_LINES = 500
let seq = 0

interface ConsoleState {
  lines: LogLine[]
  filter: 'all' | RoleId
  autoScroll: boolean
  collapsed: boolean
  height: number
  log: (tag: LogTag, message: string) => void
  clear: () => void
  setFilter: (filter: 'all' | RoleId) => void
  setAutoScroll: (on: boolean) => void
  setCollapsed: (collapsed: boolean) => void
  setHeight: (height: number) => void
}

const stored = <T,>(key: string, fallback: T): T => {
  try {
    const raw = localStorage.getItem(key)
    return raw === null ? fallback : (JSON.parse(raw) as T)
  } catch {
    return fallback
  }
}

export const useConsole = create<ConsoleState>((set) => ({
  lines: [],
  filter: 'all',
  autoScroll: true,
  collapsed: stored('te.console.collapsed', false),
  height: stored('te.console.height', 220),
  log: (tag, message) =>
    set((s) => ({
      lines: [...s.lines, { id: ++seq, at: new Date(), tag, message }].slice(-MAX_LINES),
    })),
  clear: () => set({ lines: [{ id: ++seq, at: new Date(), tag: 'INFO', message: 'Console cleared' }] }),
  setFilter: (filter) => set({ filter }),
  setAutoScroll: (autoScroll) => set({ autoScroll }),
  setCollapsed: (collapsed) => {
    localStorage.setItem('te.console.collapsed', JSON.stringify(collapsed))
    set({ collapsed })
  },
  setHeight: (height) => {
    localStorage.setItem('te.console.height', JSON.stringify(height))
    set({ height })
  },
}))

/** Call from anywhere without subscribing to the store. */
export const logLine = (tag: LogTag, message: string) => useConsole.getState().log(tag, message)
