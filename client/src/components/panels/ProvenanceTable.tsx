import { useMemo, useState } from 'react'
import { ChevronDown, ChevronUp } from 'lucide-react'
import type { ThermalSite } from '@/lib/types'
import { QualityChip } from './QualityChip'
import { REGISTER_LABEL } from '@/lib/classes'
import { cn } from '@/lib/utils'
import { EmptyState } from './EmptyState'

type SortId = 'name' | 'register' | 'match' | 'quality' | 'sar' | 'optical' | 'cloud' | 'gap'

const SORT: Record<SortId, (s: ThermalSite) => number | string> = {
  name: (s) => s.name.toLowerCase(),
  register: (s) => s.registerSource,
  match: (s) => s.matchConfidence ?? 'zz',
  quality: (s) => s.dataQuality,
  sar: (s) => (s.sentinel1Available ? s.sarQualityScore : -1),
  optical: (s) => (s.sentinel2Available ? s.opticalQualityScore : -1),
  cloud: (s) => (s.sentinel2Available ? s.cloudFraction : 2),
  gap: (s) => s.temporalGapDays,
}

const HEADERS: { id: SortId; label: string; align: 'left' | 'right' }[] = [
  { id: 'name', label: 'Site', align: 'left' },
  { id: 'register', label: 'Register', align: 'left' },
  { id: 'match', label: 'Match', align: 'left' },
  { id: 'quality', label: 'FIRMS quality', align: 'left' },
  { id: 'sar', label: 'Sentinel-1', align: 'left' },
  { id: 'optical', label: 'Sentinel-2', align: 'left' },
  { id: 'cloud', label: 'Cloud', align: 'right' },
  { id: 'gap', label: 'Temporal gap', align: 'right' },
]

/**
 * Where every record came from and how good it is (section 20). The dissemination view needs
 * this because the caveats have to travel with the data — an unavailable acquisition is
 * stated as unavailable, never filled in.
 */
export function ProvenanceTable({
  sites,
  onRowClick,
  selectedId,
  maxRows,
  maxHeight = 420,
  fill = false,
}: {
  sites: ThermalSite[]
  onRowClick?: (site: ThermalSite) => void
  selectedId?: string | null
  maxRows?: number
  /** Body height in px before the table scrolls inside itself. */
  maxHeight?: number
  /** Take the panel's remaining height instead of a fixed one. */
  fill?: boolean
}) {
  const [sortBy, setSortBy] = useState<SortId>('name')
  const [desc, setDesc] = useState(false)

  const rows = useMemo(() => {
    const read = SORT[sortBy]
    const sorted = [...sites].sort((a, b) => {
      const av = read(a)
      const bv = read(b)
      if (typeof av === 'number' && typeof bv === 'number') return desc ? bv - av : av - bv
      return desc ? String(bv).localeCompare(String(av)) : String(av).localeCompare(String(bv))
    })
    return maxRows ? sorted.slice(0, maxRows) : sorted
  }, [sites, sortBy, desc, maxRows])

  if (sites.length === 0) {
    return (
      <EmptyState
        title="Nothing to publish in this view"
        body="Every record has been filtered out. Relax a provenance filter to bring rows back."
      />
    )
  }

  return (
    <div
      className={cn('panel-scroll overflow-auto overscroll-contain', fill && 'h-full min-h-[260px] flex-1')}
      style={fill ? undefined : { maxHeight }}
    >
      <table className="w-full min-w-[820px] text-[12.5px]">
        <thead className="text-ink-faint sticky top-0 z-10 text-[10.5px] [&_th]:bg-card [&_th]:border-line [&_th]:border-b">
          <tr>
            {HEADERS.map((header) => {
              const active = sortBy === header.id
              return (
                <th
                  key={header.id}
                  scope="col"
                  className={cn(
                    'px-3 py-2 font-normal first:pl-0 last:pr-0',
                    header.align === 'right' ? 'text-right' : 'text-left',
                  )}
                >
                  <button
                    type="button"
                    onClick={() => {
                      if (active) setDesc(!desc)
                      else {
                        setSortBy(header.id)
                        setDesc(header.align === 'right')
                      }
                    }}
                    className={cn('hover:text-ink inline-flex items-center gap-1 whitespace-nowrap', active && 'text-ink')}
                  >
                    {header.label}
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
              className={cn(onRowClick && 'hover:bg-paper-deep cursor-pointer', selectedId === site.id && 'bg-paper-deep')}
            >
              <td className="max-w-[220px] truncate py-2 pr-3">{site.name}</td>
              <td className="px-3 py-2">{REGISTER_LABEL[site.registerSource]}</td>
              <td className="px-3 py-2">{site.matchConfidence ?? '—'}</td>
              <td className="px-3 py-2">
                <span
                  className="rounded-full px-2 py-0.5 text-[10.5px]"
                  style={{
                    backgroundColor: site.dataQuality === 'nrt' ? 'var(--color-amber-dim)' : 'var(--color-forest-dim)',
                    color: site.dataQuality === 'nrt' ? 'var(--color-amber)' : 'var(--color-forest)',
                  }}
                >
                  {site.dataQuality === 'nrt' ? 'NRT' : 'Standard'}
                </span>
              </td>
              <td className="px-3 py-2">
                {site.sentinel1Available ? (
                  <QualityChip score={site.sarQualityScore} width={38} />
                ) : (
                  <span className="text-ink-faint">no pass</span>
                )}
              </td>
              <td className="px-3 py-2">
                {site.sentinel2Available ? (
                  <QualityChip score={site.opticalQualityScore} width={38} />
                ) : (
                  <span className="text-ink-faint">no clear scene</span>
                )}
              </td>
              <td className="tnum px-3 py-2 text-right font-mono text-[11.5px]">
                {site.sentinel2Available ? site.cloudFraction.toFixed(2) : '—'}
              </td>
              <td className="tnum py-2 pl-3 text-right font-mono text-[11.5px]">{site.temporalGapDays} d</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
