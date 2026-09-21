import { X } from 'lucide-react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { CLASS_COLOR } from '@/lib/thermal'
import { CLASS_LABELS } from '@/lib/classes'
import { useFilters } from '@/store/useFilters'
import type { SourceClass } from '@/lib/types'
import { cn } from '@/lib/utils'

/** One row of filters above the content, as the interaction guidance asks for. */
export function FilterBar({
  classes,
  states,
  showBehaviour = true,
}: {
  classes: SourceClass[]
  states: string[]
  showBehaviour?: boolean
}) {
  const selected = useFilters((s) => s.classes)
  const toggleClass = useFilters((s) => s.toggleClass)
  const setClasses = useFilters((s) => s.setClasses)
  const state = useFilters((s) => s.state)
  const setState = useFilters((s) => s.setState)
  const behaviour = useFilters((s) => s.behaviour)
  const setBehaviour = useFilters((s) => s.setBehaviour)

  const active = selected ?? []
  const anyFilter = active.length > 0 || state !== null || behaviour !== 'all'

  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="flex flex-wrap gap-1.5">
        {classes.map((cls) => {
          const on = active.includes(cls)
          return (
            <button
              key={cls}
              type="button"
              onClick={() => {
                toggleClass(cls)
              }}
              className={cn(
                'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[12px] transition-colors',
                on ? 'border-transparent text-white' : 'border-line text-ink-soft hover:text-ink',
              )}
              style={on ? { backgroundColor: CLASS_COLOR[cls] } : undefined}
            >
              <span
                className="h-2 w-2 rounded-full"
                style={{ backgroundColor: on ? 'rgba(255,255,255,0.85)' : CLASS_COLOR[cls] }}
              />
              {CLASS_LABELS[cls]}
            </button>
          )
        })}
      </div>

      <Select
        value={state ?? 'all'}
        onValueChange={(value) => {
          setState(value === 'all' ? null : value)
        }}
      >
        <SelectTrigger className="h-8 w-[168px] rounded-full text-[12px]">
          <SelectValue placeholder="All states" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All states</SelectItem>
          {states.map((s) => (
            <SelectItem key={s} value={s}>
              {s}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {showBehaviour && (
        <Select
          value={behaviour}
          onValueChange={(value) => {
            setBehaviour(value as 'all' | 'normal' | 'abnormal')
          }}
        >
          <SelectTrigger className="h-8 w-[150px] rounded-full text-[12px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Any behaviour</SelectItem>
            <SelectItem value="normal">Normal only</SelectItem>
            <SelectItem value="abnormal">Abnormal only</SelectItem>
          </SelectContent>
        </Select>
      )}

      {anyFilter && (
        <button
          type="button"
          onClick={() => {
            setClasses(null)
            setState(null)
            setBehaviour('all')
          }}
          className="text-ink-soft hover:text-ink inline-flex items-center gap-1 text-[12px]"
        >
          <X size={13} />
          Clear filters
        </button>
      )}
    </div>
  )
}
