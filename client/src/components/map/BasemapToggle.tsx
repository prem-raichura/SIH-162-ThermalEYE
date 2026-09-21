import { useLayers } from '@/store/useLayers'
import { cn } from '@/lib/utils'

export function BasemapToggle() {
  const basemap = useLayers((s) => s.basemap)
  const setBasemap = useLayers((s) => s.setBasemap)
  const tilesFailed = useLayers((s) => s.tilesFailed)

  const options: { id: 'satellite' | 'offline'; label: string }[] = [
    { id: 'satellite', label: 'Satellite' },
    { id: 'offline', label: 'Map' },
  ]

  return (
    <div className="flex flex-col items-start gap-1.5">
      <div className="bg-card/92 border-line flex rounded-full border p-1 shadow-sm backdrop-blur">
        {options.map((o) => (
          <button
            key={o.id}
            type="button"
            onClick={() => {
              setBasemap(o.id)
            }}
            className={cn(
              'rounded-full px-3.5 py-1 text-[12.5px] transition-colors',
              basemap === o.id ? 'bg-ink text-paper' : 'text-ink-soft hover:text-ink',
            )}
          >
            {o.label}
          </button>
        ))}
      </div>
      {tilesFailed && (
        <p className="bg-amber-dim text-ink border-line max-w-[240px] rounded-[8px] border px-2.5 py-1.5 text-[11px]">
          Satellite tiles need a connection. Showing the offline map.
        </p>
      )}
    </div>
  )
}
