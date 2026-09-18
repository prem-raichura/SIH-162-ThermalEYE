import { Eye, EyeOff } from 'lucide-react'
import { LAYERS, useLayers, type LayerId } from '@/store/useLayers'
import { logLine } from '@/store/useConsole'
import { cn } from '@/lib/utils'

export function LayerPanel({ available }: { available?: LayerId[] }) {
  const visible = useLayers((s) => s.visible)
  const toggle = useLayers((s) => s.toggle)
  const rows = available ? LAYERS.filter((l) => available.includes(l.id)) : LAYERS

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
