import { useEffect, useState } from 'react'
import { DIVERGING } from '@/lib/chart'
import { loadShap } from '@/lib/data'
import type { ShapEntry, ShapRow } from '@/lib/types'
import { Skeleton } from '@/components/ui/skeleton'

/**
 * Per-prediction explanation (section 29). Model evidence — what the thermal physics and the
 * site's own history say — is kept apart from contextual evidence, which is what the maps
 * say. A nearby facility is context, never proof.
 */
export function ShapEvidence({ siteId }: { siteId: string }) {
  const [shap, setShap] = useState<Record<string, ShapEntry> | null>(null)

  useEffect(() => {
    loadShap().then(setShap)
  }, [])

  if (!shap) return <Skeleton className="h-[260px] w-full rounded-[10px]" />
  const entry = shap[siteId]
  if (!entry) return null

  const scale = Math.max(
    ...[...entry.model, ...entry.context].map((r) => Math.abs(r.contribution)),
    0.01,
  )

  return (
    <div className="space-y-4">
      <Group title="Model evidence" note="Thermal physics and temporal behaviour" rows={entry.model} scale={scale} />
      <Group title="Contextual evidence" note="Maps and registers around the site" rows={entry.context} scale={scale} />
      <p className="text-ink-faint border-line border-t pt-2 text-[11px]">
        Bars show each feature's signed contribution to the predicted class, from a base value of{' '}
        {entry.baseValue.toFixed(2)}. Warm pushes toward the class, cool pushes away.
      </p>
    </div>
  )
}

function Group({ title, note, rows, scale }: { title: string; note: string; rows: ShapRow[]; scale: number }) {
  return (
    <div>
      <div className="flex items-baseline justify-between">
        <h4 className="text-[12.5px] font-semibold">{title}</h4>
        <span className="text-ink-faint text-[11px]">{note}</span>
      </div>
      <ul className="mt-2 space-y-1.5">
        {rows.map((row) => {
          const positive = row.contribution >= 0
          const width = (Math.abs(row.contribution) / scale) * 50
          return (
            <li key={row.feature} className="grid grid-cols-[minmax(0,1fr)_120px_64px] items-center gap-2">
              <span className="truncate font-mono text-[11px]">{row.feature}</span>
              <span className="relative block h-3.5">
                <span className="bg-line absolute inset-y-0 left-1/2 w-px" />
                <span
                  className="absolute inset-y-0 rounded-[2px]"
                  style={{
                    backgroundColor: positive ? DIVERGING.positive : DIVERGING.negative,
                    width: `${width}%`,
                    left: positive ? '50%' : `${50 - width}%`,
                  }}
                />
              </span>
              <span className="text-ink-soft tnum text-right font-mono text-[11px]">{row.value}</span>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
