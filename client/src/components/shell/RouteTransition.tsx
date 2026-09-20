import { useEffect, useState, type ReactNode } from 'react'
import { LoadingOverlay } from './Loader'
import { usePrefersReducedMotion } from '@/hooks/useMediaQuery'

/** Long enough to read as a deliberate step, short enough not to be in the way. */
const HOLD_MS = 420

/**
 * Holds the loader open across a navigation.
 *
 * Suspense alone cannot do this: it drops its fallback the instant the chunk resolves, which
 * on a warm cache is a few milliseconds and reads as a flicker rather than a transition.
 *
 * This has to sit *outside* the Suspense boundary, not inside it. A component inside the
 * boundary is part of the tree that suspends while the chunk is in flight, and React tears
 * down and re-runs the effects of a suspended tree — which cancelled the timer and collapsed
 * the hold to nothing. Out here the timer is never interrupted, and the overlay covers both
 * the suspended frames and the fast ones.
 *
 * It is keyed on the route by its caller, so each navigation mounts a fresh one and the flag
 * starts true by construction rather than being pushed there from an effect.
 *
 * The hold is presentation, not work, so anyone who asked for less motion skips it entirely.
 */
export function RouteTransition({ children }: { children: ReactNode }) {
  const reducedMotion = usePrefersReducedMotion()
  const [busy, setBusy] = useState(!reducedMotion)

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
