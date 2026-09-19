import type { ThermalSite } from '@/lib/types'
import { QualityChip } from './QualityChip'
import { cn } from '@/lib/utils'
import { EmptyState } from './EmptyState'

const REGISTER_LABEL: Record<string, string> = {
  osm: 'OpenStreetMap',
  ppac: 'PPAC',
  wri: 'WRI',
  gem: 'GEM',
  cea: 'CEA',
  none: 'No register',
}

/**
 * Where every record came from and how good it is (section 20). The dissemination view needs
 * this because the caveats have to travel with the data.
 */
export function ProvenanceTable({
  sites,
  onRowClick,
  maxRows,
  maxHeight = 420,
  fill = false,
}: {
  sites: ThermalSite[]
  onRowClick?: (site: ThermalSite) => void
  maxRows?: number
  /** Body height in px before the table scrolls inside itself. */
  maxHeight?: number
  /** Take the panel's remaining height instead of a fixed one. */
  fill?: boolean
}) {
  const rows = maxRows ? sites.slice(0, maxRows) : sites
  if (rows.length === 0) {
    return <EmptyState title="Nothing to publish in this view" body="Clear a filter to bring records back." />
  }

  return (
    <div
      className={cn('panel-scroll overflow-auto overscroll-contain', fill && 'h-full min-h-[260px] flex-1')}
      style={fill ? undefined : { maxHeight }}
    >
      <table className="w-full min-w-[720px] text-[12.5px]">
        <thead className="text-ink-faint sticky top-0 z-10 text-[10.5px] [&_th]:bg-card [&_th]:border-line [&_th]:border-b">
          <tr>
            <th className="px-3 py-2 text-left font-normal first:pl-0">Site</th>
            <th className="px-3 py-2 text-left font-normal first:pl-0">Register</th>
            <th className="px-3 py-2 text-left font-normal first:pl-0">Match</th>
            <th className="px-3 py-2 text-left font-normal first:pl-0">FIRMS quality</th>
            <th className="px-3 py-2 text-left font-normal first:pl-0">Sentinel-1</th>
            <th className="px-3 py-2 text-left font-normal first:pl-0">Sentinel-2</th>
            <th className="px-3 py-2 text-right font-normal last:pr-0">Temporal gap</th>
          </tr>
        </thead>
        <tbody className="divide-line divide-y">
          {rows.map((site) => (
            <tr
              key={site.id}
              onClick={() => onRowClick?.(site)}
              className={cn(onRowClick && 'hover:bg-paper-deep cursor-pointer')}
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
                {site.sentinel1Available ? <QualityChip score={site.sarQualityScore} width={38} /> : <span className="text-ink-faint">no pass</span>}
              </td>
              <td className="px-3 py-2">
                {site.sentinel2Available ? <QualityChip score={site.opticalQualityScore} width={38} /> : <span className="text-ink-faint">no clear scene</span>}
              </td>
              <td className="tnum py-2 pl-3 text-right font-mono text-[11.5px]">{site.temporalGapDays} d</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
