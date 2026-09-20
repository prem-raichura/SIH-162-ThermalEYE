import { Check, ChevronDown, History } from 'lucide-react'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { useFilters } from '@/store/useFilters'
import { logLine } from '@/store/useConsole'
import { cn } from '@/lib/utils'
import { HISTORY, RECENT, type WindowOption } from '@/lib/timeWindows'

/**
 * The time filter, split by how the two halves get used.
 *
 * Hours are the live view and stay one click away; the longer ranges are a deliberate step
 * back into history, so they fold into a dropdown that reports which one is active.
 */
export function TimeWindowPicker({ className }: { className?: string }) {
  const window = useFilters((s) => s.window)
  const setWindow = useFilters((s) => s.setWindow)

  const historic = HISTORY.find((o) => o.id === window)

  const pick = (option: WindowOption) => {
    setWindow(option.id)
    logLine('INFO', `Time window set to ${option.full.toLowerCase()}`)
  }

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <div className="bg-card/92 border-line flex rounded-full border p-1 shadow-sm backdrop-blur">
        {RECENT.map((o) => (
          <button
            key={o.id}
            type="button"
            onClick={() => pick(o)}
            aria-pressed={window === o.id}
            title={o.full}
            className={cn(
              'tnum rounded-full px-3 py-1 font-mono text-[12px] whitespace-nowrap transition-colors',
              window === o.id ? 'bg-ink text-paper' : 'text-ink-soft hover:text-ink',
            )}
          >
            {o.label}
          </button>
        ))}
      </div>

      <Popover>
        <PopoverTrigger asChild>
          <button
            type="button"
            aria-label={historic ? `Older: ${historic.full}` : 'Choose an older window'}
            className={cn(
              'bg-card/92 border-line flex items-center gap-1.5 rounded-full border py-1.5 pr-2 pl-3 text-[12px] shadow-sm backdrop-blur transition-colors',
              historic ? 'text-ink' : 'text-ink-soft hover:text-ink',
            )}
          >
            <History size={13} strokeWidth={1.8} className="shrink-0" />
            <span className="whitespace-nowrap">{historic ? historic.label : 'Older'}</span>
            <ChevronDown size={14} strokeWidth={1.9} className="text-ink-faint shrink-0" />
          </button>
        </PopoverTrigger>

        <PopoverContent align="start" className="w-[180px] p-1.5">
          <p className="text-ink-faint px-2 pt-1 pb-1.5 text-[10.5px] tracking-[0.1em] uppercase">
            Look further back
          </p>
          {HISTORY.map((o) => (
            <button
              key={o.id}
              type="button"
              onClick={() => pick(o)}
              className={cn(
                'hover:bg-paper-deep flex w-full items-center gap-2 rounded-[8px] px-2 py-1.5 text-left text-[12.5px] transition-colors',
                window === o.id ? 'text-ink font-medium' : 'text-ink-soft',
              )}
            >
              <Check size={13} strokeWidth={2} className={cn('shrink-0', window !== o.id && 'opacity-0')} />
              {o.label}
            </button>
          ))}
        </PopoverContent>
      </Popover>
    </div>
  )
}
