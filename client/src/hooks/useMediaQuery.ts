import { useCallback, useSyncExternalStore } from 'react'

/**
 * Subscribes to a media query. Used for the layout decisions that cannot be expressed in
 * CSS alone — which component renders at all, rather than how it looks.
 *
 * useSyncExternalStore rather than an effect: matchMedia is an external store, and reading it
 * during render keeps the first paint correct instead of flashing the wrong layout.
 */
export function useMediaQuery(query: string): boolean {
  const subscribe = useCallback(
    (onChange: () => void) => {
      const list = window.matchMedia(query)
      list.addEventListener('change', onChange)
      return () => list.removeEventListener('change', onChange)
    },
    [query],
  )

  return useSyncExternalStore(
    subscribe,
    () => window.matchMedia(query).matches,
    () => false,
  )
}

/** The breakpoints the layout actually changes at, named once so they cannot drift apart. */
export const BREAKPOINT = {
  /** Below this the rail becomes a sheet and the console is header-only. */
  mobile: '(max-width: 767px)',
  /** Below this the map goes full width above the panels and the console starts collapsed. */
  compact: '(max-width: 1279px)',
  /** Below this the side panels drop to a single column. */
  narrow: '(max-width: 1439px)',
} as const

export const useIsMobile = () => useMediaQuery(BREAKPOINT.mobile)
export const useIsCompact = () => useMediaQuery(BREAKPOINT.compact)

/** True when the visitor asked for less motion; map easing and the console boot obey it. */
export const usePrefersReducedMotion = () => useMediaQuery('(prefers-reduced-motion: reduce)')
