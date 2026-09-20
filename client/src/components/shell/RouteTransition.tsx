import { useEffect, useRef, useState, type ReactNode } from 'react'
import { useLocation } from 'react-router-dom'
import { LoadingOverlay } from './Loader'
import { usePrefersReducedMotion } from '@/hooks/useMediaQuery'

/** Long enough to read as a deliberate step, short enough not to be in the way. */
const HOLD_MS = 3000

/**
 * Holds the loader open across a navigation.
 *
 * Suspense alone cannot do this: it drops its fallback the instant the chunk resolves, which
 * on a warm cache is a few milliseconds and reads as a flicker rather than a transition. This
 * covers the other half — the two together mean a slow chunk is held by Suspense and a fast
 * one by this timer, and the reader sees the same thing either way.
 *
 * The flag is derived during render rather than set from an effect keyed on the path. While
 * a lazy chunk is in flight this subtree is suspended, and effects in a suspended tree are
 * torn down and re-run — which cancelled the timer and made the hold collapse to nothing. The
 * timer here keys off the flag instead, so a suspend/reveal cycle restarts it rather than
 * losing it.
 *
 * The hold is presentation, not work, so anyone who asked for less motion skips it entirely.
 */
export function RouteTransition({ children }: { children: ReactNode }) {
  const { pathname } = useLocation()
  const reducedMotion = usePrefersReducedMotion()
  const [busy, setBusy] = useState(!reducedMotion)
  const shownFor = useRef(pathname)

  if (shownFor.current !== pathname) {
    shownFor.current = pathname
    setBusy(!reducedMotion)
  }

  useEffect(() => {
    if (!busy) return
    const id = window.setTimeout(() => setBusy(false), HOLD_MS)
    return () => window.clearTimeout(id)
  }, [busy])

  return (
    <div className="relative h-full min-h-0">
      {children}
      {busy && <LoadingOverlay />}
    </div>
  )
}
