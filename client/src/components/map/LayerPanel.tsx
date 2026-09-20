import { useState } from 'react'
import { ChevronDown, Eye, EyeOff, Layers as LayersIcon } from 'lucide-react'
import { LAYERS, useLayers, type LayerId } from '@/store/useLayers'
import { logLine } from '@/store/useConsole'
import { BrandSpinner } from '@/components/shell/BrandSpinner'
import { cn } from '@/lib/utils'

/**
 * The layer switcher, collapsible. Expanded it covers a useful part of a small map, so the
 * header folds it down to a single bar that still reports how many layers are on.
 */
export function LayerPanel({
  available,
  busy = false,
}: {
  available?: LayerId[]
  /** A layer's file is still arriving — districts is 1.1 MB and used to look like a dead toggle. */
  busy?: boolean
}) {
  const visible = useLayers((s) => s.visible)
  const toggle = useLayers((s) => s.toggle)
  // Folded by default: the map is the thing worth looking at, and the header still reports
  // how many layers are on without taking the space to list them.
  const [open, setOpen] = useState(false)

  const rows = available ? LAYERS.filter((l) => available.includes(l.id)) : LAYERS
  const onCount = rows.filter((l) => visible[l.id]).length

  return (
    <div className="bg-card/92 border-line overflow-hidden rounded-[12px] border shadow-sm backdrop-blur">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="hover:bg-paper-deep/60 flex w-full items-center gap-2 px-3 py-2 text-left transition-colors"
      >
        <LayersIcon size={14} strokeWidth={1.8} className="text-ink-soft shrink-0" />
        <span className="text-[12.5px] font-semibold">Layers</span>
        <span className="text-ink-faint tnum font-mono text-[10.5px]">
          {onCount}/{rows.length}
        </span>
        {busy && <BrandSpinner size="sm" className="scale-[0.6]" />}
        <ChevronDown
          size={15}
          strokeWidth={1.9}
          className={cn('text-ink-faint ml-auto shrink-0 transition-transform', open && 'rotate-180')}
        />
      </button>

      {open && (
        <ul className="space-y-0.5 px-1.5 pb-1.5">
          {rows.map((layer) => {
            const on = visible[layer.id]
            return (
              <li key={layer.id}>
                <button
                  type="button"
                  onClick={() => {
                    toggle(layer.id)
                    logLine('INFO', `${layer.label} layer ${on ? 'hidden' : 'shown'}`)
                  }}
                  aria-pressed={on}
                  className={cn(
                    'hover:bg-paper-deep flex w-full items-center gap-2 rounded-[8px] px-2 py-1.5 text-left text-[12px] transition-colors',
                    on ? 'text-ink' : 'text-ink-faint',
                  )}
                >
                  {on ? (
                    <Eye size={14} strokeWidth={1.8} className="shrink-0" />
                  ) : (
                    <EyeOff size={14} strokeWidth={1.8} className="shrink-0" />
                  )}
                  <span className="truncate">{layer.label}</span>
                </button>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
