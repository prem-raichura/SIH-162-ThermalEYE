import { useFilters } from '@/store/useFilters'
import { logLine } from '@/store/useConsole'
import { cn } from '@/lib/utils'
import type { TimeWindow } from '@/lib/types'

const OPTIONS: { id: TimeWindow; label: string }[] = [
  { id: '7d', label: 'Last 7 days' },
  { id: '30d', label: '30 days' },
  { id: '1y', label: '1 year' },
  { id: 'all', label: 'All 6 years' },
]

export function TimeWindowPicker({ className }: { className?: string }) {
  const window = useFilters((s) => s.window)
  const setWindow = useFilters((s) => s.setWindow)

  return (
    <div className={cn('bg-card/92 border-line flex rounded-full border p-1 shadow-sm backdrop-blur', className)}>
      {OPTIONS.map((o) => (
        <button
          key={o.id}
          type="button"
          onClick={() => {
            setWindow(o.id)
            logLine('INFO', `Time window set to ${o.label.toLowerCase()}`)
          }}
          className={cn(
            'rounded-full px-3 py-1 text-[12px] whitespace-nowrap transition-colors',
            window === o.id ? 'bg-ink text-paper' : 'text-ink-soft hover:text-ink',
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}
