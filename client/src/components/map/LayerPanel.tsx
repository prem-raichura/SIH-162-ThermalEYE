import { Eye, EyeOff } from 'lucide-react'
import { LAYERS, useLayers, type LayerId } from '@/store/useLayers'
import { logLine } from '@/store/useConsole'
import { cn } from '@/lib/utils'

export function LayerPanel({
  available,
  variant = 'panel',
}: {
  available?: LayerId[]
  /** 'chips' lays the toggles out in a row, for control bars under a small map. */
  variant?: 'panel' | 'chips'
}) {
  const visible = useLayers((s) => s.visible)
  const toggle = useLayers((s) => s.toggle)
  const rows = available ? LAYERS.filter((l) => available.includes(l.id)) : LAYERS

  if (variant === 'chips') {
    return (
      <div className="flex flex-wrap items-center gap-1.5">
        {rows.map((layer) => {
          const on = visible[layer.id]
          return (
            <button
              key={layer.id}
              type="button"
              onClick={() => {
                toggle(layer.id)
                logLine('INFO', `${layer.label} layer ${on ? 'hidden' : 'shown'}`)
              }}
              aria-pressed={on}
              className={cn(
                'border-line inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11.5px] transition-colors',
                on ? 'bg-ink text-paper border-transparent' : 'text-ink-soft hover:text-ink',
              )}
            >
              {on ? <Eye size={12.5} strokeWidth={1.9} /> : <EyeOff size={12.5} strokeWidth={1.9} />}
              {layer.label}
            </button>
          )
        })}
      </div>
    )
  }

  return (
    <div className="bg-card border-line rounded-[12px] border px-3.5 py-3">
      <p className="text-[12.5px] font-semibold">Layers</p>
      <ul className="mt-2 space-y-0.5">
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
                  'flex w-full items-center gap-2.5 rounded-[8px] px-1.5 py-1.5 text-left text-[12.5px] transition-colors',
                  on ? 'text-ink' : 'text-ink-faint',
                  'hover:bg-paper-deep',
                )}
              >
                {on ? <Eye size={15} strokeWidth={1.8} /> : <EyeOff size={15} strokeWidth={1.8} />}
                {layer.label}
              </button>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
