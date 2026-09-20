import { ALERT_WINDOWS, useNdma } from '@/store/useNdma'
import { logLine } from '@/store/useConsole'
import { cn } from '@/lib/utils'

/**
 * How far back the response feed looks, for the console bar.
 *
 * Response works in hours, and alerts are the one record type that carries a real time —
 * `minutesAgo` — so this filters on measured age rather than a derived hour. It replaces the
 * general time picker on the NDMA console, where the feed is the thing being narrowed.
 */
export function AlertWindowPicker({ className }: { className?: string }) {
  const windowHours = useNdma((s) => s.windowHours)
  const setWindow = useNdma((s) => s.setWindow)

  return (
    <div
      className={cn(
        'bg-card/92 border-line flex rounded-full border p-1 shadow-sm backdrop-blur',
        className,
      )}
    >
      {ALERT_WINDOWS.map((w) => (
        <button
          key={w.hours}
          type="button"
          onClick={() => {
            setWindow(w.hours)
            logLine('INFO', `Alert window set to ${w.hours === 0 ? 'all alerts' : `the last ${w.hours} hours`}`)
          }}
          aria-pressed={windowHours === w.hours}
          className={cn(
            'tnum rounded-full px-3 py-1 font-mono text-[12px] whitespace-nowrap transition-colors',
            windowHours === w.hours ? 'bg-ink text-paper' : 'text-ink-soft hover:text-ink',
          )}
        >
          {w.label}
        </button>
      ))}
    </div>
  )
}
