import { useMemo, useState } from 'react'
import { ChevronDown, ChevronUp } from 'lucide-react'
import type { ThermalSite } from '@/lib/types'
import { CLASS_COLOR, tHotColor } from '@/lib/thermal'
import { coord, days, megawatt, nf, shortDate } from '@/lib/format'
import { formatTemp, useSettings } from '@/store/useSettings'
import { cn } from '@/lib/utils'
import { EmptyState } from './EmptyState'

export type ColumnId =
  | 'name'
  | 'class'
  | 'state'
  | 'operator'
  | 'capacity'
  | 'fuel'
  | 'tHot'
  | 'deltaT'
  | 'frpMean'
  | 'frpPeak'
  | 'frpDensity'
  | 'nightRatio'
  | 'saturation'
  | 'detections'
  | 'activeDays'
  | 'persistence'
  | 'frpSlope'
  | 'lastDetection'
  | 'coverage'
  | 'confidence'
  | 'status'
  | 'coords'

interface Column {
  id: ColumnId
  label: string
  align: 'left' | 'right'
  sort: (s: ThermalSite) => number | string
  render: (s: ThermalSite) => React.ReactNode
}

const COLUMNS: Record<ColumnId, Column> = {
  name: {
    id: 'name',
    label: 'Site',
    align: 'left',
    sort: (s) => s.name.toLowerCase(),
    render: (s) => (
      <span className="flex min-w-0 items-center gap-2">
        <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: CLASS_COLOR[s.predictedClass] }} />
        <span className="truncate">{s.name}</span>
      </span>
    ),
  },
  class: { id: 'class', label: 'Class', align: 'left', sort: (s) => s.predictedLabel, render: (s) => s.predictedLabel },
  state: { id: 'state', label: 'State', align: 'left', sort: (s) => s.state, render: (s) => s.state },
  operator: {
    id: 'operator',
    label: 'Operator',
    align: 'left',
    sort: (s) => s.operator ?? '',
    render: (s) => <span className="text-ink-soft truncate">{s.operator ?? '—'}</span>,
  },
  capacity: {
    id: 'capacity',
    label: 'Capacity',
    align: 'right',
    sort: (s) => s.capacity ?? -1,
    render: (s) => (s.capacity === null ? '—' : `${nf(s.capacity, s.capacityUnit === 'MMTPA' ? 2 : 0)} ${s.capacityUnit}`),
  },
  fuel: { id: 'fuel', label: 'Fuel', align: 'left', sort: (s) => s.fuel ?? '', render: (s) => s.fuel ?? '—' },
  tHot: {
    id: 'tHot',
    label: 'T_hot',
    align: 'right',
    sort: (s) => s.tHot ?? 0,
    render: (s) => <TempCell kelvin={s.tHot} />,
  },
  deltaT: { id: 'deltaT', label: 'ΔT', align: 'right', sort: (s) => s.deltaT ?? 0, render: (s) => `${s.deltaT ?? '—'} K` },
  frpMean: { id: 'frpMean', label: 'Mean FRP', align: 'right', sort: (s) => s.frpMean, render: (s) => megawatt(s.frpMean) },
  frpPeak: { id: 'frpPeak', label: 'Peak FRP', align: 'right', sort: (s) => s.frpPeak, render: (s) => megawatt(s.frpPeak) },
  frpDensity: {
    id: 'frpDensity',
    label: 'FRP density',
    align: 'right',
    sort: (s) => s.frpDensity,
    render: (s) => `${s.frpDensity} MW/km²`,
  },
  nightRatio: {
    id: 'nightRatio',
    label: 'Night ratio',
    align: 'right',
    sort: (s) => s.nightRatio,
    render: (s) => s.nightRatio.toFixed(2),
  },
  saturation: {
    id: 'saturation',
    label: 'Saturation',
    align: 'right',
    sort: (s) => s.saturationFraction,
    render: (s) => s.saturationFraction.toFixed(3),
  },
  detections: {
    id: 'detections',
    label: 'Detections',
    align: 'right',
    sort: (s) => s.detectionCount,
    render: (s) => nf(s.detectionCount),
  },
  activeDays: { id: 'activeDays', label: 'Active days', align: 'right', sort: (s) => s.activeDays, render: (s) => days(s.activeDays) },
  persistence: {
    id: 'persistence',
    label: 'Persistence',
    align: 'right',
    sort: (s) => s.persistenceDays,
    render: (s) => days(s.persistenceDays),
  },
  frpSlope: {
    id: 'frpSlope',
    label: 'FRP slope',
    align: 'right',
    sort: (s) => s.frpSlope,
    render: (s) => (s.frpSlope > 0 ? `+${s.frpSlope.toFixed(3)}` : s.frpSlope.toFixed(3)),
  },
  lastDetection: {
    id: 'lastDetection',
    label: 'Last seen',
    align: 'right',
    sort: (s) => s.lastDetection ?? '',
    render: (s) => shortDate(s.lastDetection),
  },
  coverage: {
    id: 'coverage',
    label: 'Coverage',
    align: 'right',
    sort: (s) => s.coverageQualityScore,
    render: (s) => s.coverageQualityScore.toFixed(2),
  },
  confidence: {
    id: 'confidence',
    label: 'Confidence',
    align: 'right',
    sort: (s) => s.confidence,
    render: (s) => s.confidence.toFixed(2),
  },
  status: {
    id: 'status',
    label: 'Status',
    align: 'left',
    sort: (s) => s.behaviour,
    render: (s) => (
      <span className="inline-flex items-center gap-1.5">
        <span
          className="h-2 w-2 rounded-full"
          style={{ backgroundColor: s.behaviour === 'abnormal' ? 'var(--color-terracotta)' : 'var(--color-forest)' }}
        />
        {s.behaviour === 'abnormal' ? 'Abnormal' : 'Normal'}
      </span>
    ),
  },
  coords: {
    id: 'coords',
    label: 'Coordinates',
    align: 'right',
    sort: (s) => s.lat,
    render: (s) => coord(s.lat, s.lon),
  },
}

/** Temperature follows the unit chosen in Settings; the colour always follows the ramp. */
function TempCell({ kelvin }: { kelvin: number | null }) {
  const units = useSettings((s) => s.units)
  return <span style={{ color: tHotColor(kelvin) }}>{formatTemp(kelvin, units)}</span>
}

/** Dense, hairline-ruled, sortable. No zebra striping and no per-row hover lift. */
export function SiteTable({
  sites,
  columns,
  onRowClick,
  selectedId,
  maxRows,
  maxHeight = 360,
  fill = false,
  emptyTitle = 'No sites match these filters',
  emptyBody = 'Widen the time window or clear a class filter to bring sites back.',
}: {
  sites: ThermalSite[]
  columns: ColumnId[]
  onRowClick?: (site: ThermalSite) => void
  selectedId?: string | null
  maxRows?: number
  /** Body height in px before the table scrolls inside itself. */
  maxHeight?: number
  /** Take the panel's remaining height instead of a fixed one, so a tall neighbouring
   *  column does not leave dead space under the table. */
  fill?: boolean
  emptyTitle?: string
  emptyBody?: string
}) {
  const [sortBy, setSortBy] = useState<ColumnId>(columns[0])
  const [desc, setDesc] = useState(false)

  const rows = useMemo(() => {
    const col = COLUMNS[sortBy]
    const sorted = [...sites].sort((a, b) => {
      const av = col.sort(a)
      const bv = col.sort(b)
      if (typeof av === 'number' && typeof bv === 'number') return desc ? bv - av : av - bv
      return desc ? String(bv).localeCompare(String(av)) : String(av).localeCompare(String(bv))
    })
    return maxRows ? sorted.slice(0, maxRows) : sorted
  }, [sites, sortBy, desc, maxRows])

  if (sites.length === 0) return <EmptyState title={emptyTitle} body={emptyBody} />

  return (
    <div
      className={cn('panel-scroll overflow-auto overscroll-contain', fill && 'h-full min-h-[260px] flex-1')}
      style={fill ? undefined : { maxHeight }}
    >
      <table className="w-full min-w-[560px] text-[12.5px]">
        <thead className="sticky top-0 z-10">
          <tr className="text-ink-faint">
            {columns.map((id) => {
              const col = COLUMNS[id]
              const active = sortBy === id
              return (
                <th
                  key={id}
                  scope="col"
                  className={cn(
                    'bg-card border-line sticky top-0 border-b px-3 py-2 font-normal first:pl-0 last:pr-0',
                    col.align === 'right' ? 'text-right' : 'text-left',
                  )}
                >
                  <button
                    type="button"
                    onClick={() => {
                      if (active) setDesc(!desc)
                      else {
                        setSortBy(id)
                        setDesc(col.align === 'right')
                      }
                    }}
                    className={cn(
                      'hover:text-ink inline-flex items-center gap-1 text-[10.5px] tracking-wide whitespace-nowrap',
                      active && 'text-ink',
                    )}
                  >
                    {col.label}
                    {active && (desc ? <ChevronDown size={12} /> : <ChevronUp size={12} />)}
                  </button>
                </th>
              )
            })}
          </tr>
        </thead>
        <tbody className="divide-line divide-y">
          {rows.map((site) => (
            <tr
              key={site.id}
              onClick={() => onRowClick?.(site)}
              className={cn(
                onRowClick && 'hover:bg-paper-deep cursor-pointer',
                selectedId === site.id && 'bg-paper-deep',
              )}
            >
              {columns.map((id) => {
                const col = COLUMNS[id]
                return (
                  <td
                    key={id}
                    className={cn(
                      'max-w-[240px] px-3 py-2 first:pl-0 last:pr-0',
                      col.align === 'right' ? 'tnum text-right font-mono text-[11.5px]' : 'text-left',
                    )}
                  >
                    {col.render(site)}
                  </td>
                )
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
