import { useId, type ReactNode } from 'react'
import { ChevronDown } from 'lucide-react'
import { useMapConsole } from '@/store/useMapConsole'
import { cn } from '@/lib/utils'

/**
 * A panel that floats over the map, folded to its header when it is in the way.
 *
 * Same surface as the layer switcher and the legend — a near-opaque card with a blur behind
 * it — so every floating thing on the map reads as one family, over satellite imagery and
 * over the flat offline basemap alike. The summary stays on the header, so a folded dock
 * still reports its count.
 */
export function MapDock({
  title,
  summary,
  action,
  defaultOpen = true,
  maxBodyHeight = 300,
  grow = false,
  children,
  className,
}: {
  title: string
  summary?: ReactNode
  action?: ReactNode
  defaultOpen?: boolean
  maxBodyHeight?: number
  /** Takes the height the docks above it leave over, instead of sizing to its content. */
  grow?: boolean
  children: ReactNode
  className?: string
}) {
  const bodyId = useId()
  const stored = useMapConsole((s) => s.docksOpen[title])
  const setDockOpen = useMapConsole((s) => s.setDockOpen)
  const open = stored ?? defaultOpen

  return (
    <section
      className={cn(
        'bg-card/92 border-line flex flex-col overflow-hidden rounded-[12px] border shadow-sm backdrop-blur',
        grow && open && 'min-h-[132px] flex-1',
        className,
      )}
    >
      <div className="flex shrink-0 items-center">
        <button
          type="button"
          onClick={() => setDockOpen(title, !open)}
          aria-expanded={open}
          aria-controls={bodyId}
          className="hover:bg-paper-deep/60 flex min-w-0 flex-1 items-center gap-2 px-3 py-2 text-left transition-colors"
        >
          <h3 className="truncate text-[12.5px] font-semibold">{title}</h3>
          {summary && (
            <span className="text-ink-faint tnum shrink-0 font-mono text-[10.5px]">{summary}</span>
          )}
          <ChevronDown
            size={15}
            strokeWidth={1.9}
            className={cn('text-ink-faint ml-auto shrink-0 transition-transform', open && 'rotate-180')}
          />
        </button>
        {action && open && <div className="shrink-0 pr-2.5">{action}</div>}
      </div>

      {/* Unmounted rather than hidden: a folded dock must not leave its controls in the tab order. */}
      {open && (
        <div
          id={bodyId}
          className={cn(
            'panel-scroll overflow-y-auto overscroll-contain px-3 pt-0.5 pb-3',
            grow && 'flex min-h-0 flex-1 flex-col',
          )}
          style={grow ? undefined : { maxHeight: maxBodyHeight }}
        >
          {children}
        </div>
      )}
    </section>
  )
}
