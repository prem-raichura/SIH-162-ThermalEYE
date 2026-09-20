import { useCallback, useEffect, useState } from 'react'
import { logLine } from '@/store/useConsole'

export interface AsyncData<T> {
  data: T | null
  /** True until the first attempt settles, either way. */
  pending: boolean
  /** What to tell the reader, already phrased for the panel. Null while fine. */
  error: string | null
  retry: () => void
}

/**
 * One file, fetched once, with the two states the app never used to show.
 *
 * Every lazy panel used to hand-roll `useState(null)` plus a bare `.then`, which meant a slow
 * fetch rendered an empty chart and a failed one rendered an empty chart forever. This keeps
 * the pending and failed cases explicit so a panel can draw them, and writes the failure to
 * the operator console the way the rest of the app reports faults.
 */
export function useAsyncData<T>(
  load: () => Promise<T>,
  /** What the reader calls this data, used in the failure line: "Site baselines". */
  subject: string,
): AsyncData<T> {
  const [data, setData] = useState<T | null>(null)
  const [pending, setPending] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    let live = true
    setPending(true)
    setError(null)

    load()
      .then((value) => {
        if (!live) return
        setData(value)
        setPending(false)
      })
      .catch(() => {
        if (!live) return
        setError(`${subject} could not be loaded.`)
        setPending(false)
        logLine('ERROR', `${subject} could not be loaded`)
      })

    return () => {
      live = false
    }
    // `load` is a fresh closure on every render at most call sites, so the attempt counter is
    // what actually re-runs this — not the function identity.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [attempt, subject])

  const retry = useCallback(() => setAttempt((n) => n + 1), [])

  return { data, pending, error, retry }
}
