import type { TimeWindow } from './types'

export interface WindowOption {
  id: TimeWindow
  label: string
  /** Read out in the console line and the dropdown, where the short label is too terse. */
  full: string
}

/** The hours of the most recent acquisition day — what a duty desk is actually watching. */
export const RECENT: WindowOption[] = [
  { id: '3h', label: '3h', full: 'Last 3 hours' },
  { id: '6h', label: '6h', full: 'Last 6 hours' },
  { id: '12h', label: '12h', full: 'Last 12 hours' },
  { id: '24h', label: '24h', full: 'Last 24 hours' },
]

/** Everything older, behind one control so the bar stays short. */
export const HISTORY: WindowOption[] = [
  { id: '3d', label: '3 days', full: 'Last 3 days' },
  { id: '7d', label: '7 days', full: 'Last 7 days' },
  { id: '30d', label: '30 days', full: 'Last 30 days' },
  { id: '1y', label: '1 year', full: 'Last year' },
  { id: 'all', label: 'All 6 years', full: 'All 6 years' },
]

export const WINDOW_LABEL = Object.fromEntries(
  [...RECENT, ...HISTORY].map((o) => [o.id, o.full]),
) as Record<TimeWindow, string>
