import type { UnmappedCandidate } from '@/lib/types'
import { QualityChip } from './QualityChip'
import { tHotColor } from '@/lib/thermal'
import { cn } from '@/lib/utils'
import { EmptyState } from './EmptyState'

const ASSESSMENT_TONE: Record<string, string> = {
  'industrial-like': 'var(--color-terracotta)',
  'agricultural-like': 'var(--color-amber)',
  'natural-like': 'var(--color-forest)',
  unknown: 'var(--color-ink-faint)',
}

/**
 * Persistent unmapped thermal sources (section 16), ranked by persistence x retrieved
 * temperature. Coverage quality sits on every row because absence of a mapped facility only
 * carries information where the mapping effort was high.
 */
export function RankedQueue({
  rows,
  onSelect,
  selectedId,
  limit,
  maxHeight = 360,
  fill = false,
  showAssessment = true,
  variant = 'table',
}: {
  rows: UnmappedCandidate[]
  onSelect?: (row: UnmappedCandidate) => void
  selectedId?: string | null
  limit?: number
  /** Body height in px before the queue scrolls inside itself. */
  maxHeight?: number
  /** Take the panel's remaining height instead of a fixed one. */
  fill?: boolean
  showAssessment?: boolean
  /**
   * 'list' stacks each candidate into two lines instead of six columns. Six columns need
   * ~480px; a dock floating on the map has ~310px, and a table that scrolls sideways to
   * reach its own numbers is not a table anyone reads.
   */
  variant?: 'table' | 'list'
}) {
  const visible = limit ? rows.slice(0, limit) : rows

  if (visible.length === 0) {
    return (
      <EmptyState
        title="No candidates in this view"
        body="Candidates appear where a persistent thermal site has no industrial feature within 1 km."
      />
    )
  }

  if (variant === 'list') {
    return (
      <ul
        className={cn(
          'divide-line -mx-1 divide-y overflow-y-auto overscroll-contain',
          'panel-scroll',
          fill && 'h-full min-h-0 flex-1',
        )}
        style={fill ? undefined : { maxHeight }}
      >
        {visible.map((row) => (
          <li key={row.id}>
            <button
              type="button"
              onClick={() => onSelect?.(row)}
              aria-current={selectedId === row.id || undefined}
              className={cn(
                'hover:bg-paper-deep/70 flex w-full flex-col gap-1 rounded-[8px] px-1.5 py-2 text-left transition-colors',
                selectedId === row.id && 'bg-paper-deep',
              )}
            >
              <span className="flex w-full min-w-0 items-baseline gap-2">
                <span className="text-ink-faint tnum w-4 shrink-0 font-mono text-[11px]">{row.rank}</span>
                <span className="min-w-0 flex-1 truncate text-[12.5px]">{row.label}</span>
                <span
                  className="tnum shrink-0 font-mono text-[12px]"
                  style={{ color: tHotColor(row.tHot) }}
                >
                  {row.tHot} K
                </span>
              </span>

              <span className="text-ink-faint flex w-full items-center gap-2 pl-6 text-[11px]">
                <span className="tnum font-mono">{row.persistenceDays} d persistent</span>
                {showAssessment && (
                  <span className="inline-flex min-w-0 items-center gap-1.5">
                    <span
                      className="h-1.5 w-1.5 shrink-0 rounded-full"
                      style={{ backgroundColor: ASSESSMENT_TONE[row.assessment] }}
                    />
                    <span className="truncate">{row.assessment}</span>
                  </span>
                )}
                <span className="ml-auto shrink-0">
                  <QualityChip score={row.coverageQualityScore} width={28} />
                </span>
              </span>
            </button>
          </li>
        ))}
      </ul>
    )
  }

  return (
    <div
      className={cn('panel-scroll overflow-auto overscroll-contain', fill && 'h-full min-h-[260px] flex-1')}
      style={fill ? undefined : { maxHeight }}
    >
      <table className={cn('w-full text-[12.5px]', showAssessment ? 'min-w-[480px]' : 'min-w-[360px]')}>
        <thead className="text-ink-faint sticky top-0 z-10 text-[10.5px] [&_th]:bg-card [&_th]:border-line [&_th]:border-b">
          <tr>
            <th className="w-8 py-2 pr-3 text-left font-normal">#</th>
            <th className="px-3 py-2 text-left font-normal">Location</th>
            <th className="px-3 py-2 text-right font-normal">Persistence</th>
            <th className="px-3 py-2 text-right font-normal">T_hot</th>
            {showAssessment && <th className="px-3 py-2 text-left font-normal">Assessment</th>}
            <th className="py-2 pl-3 text-right font-normal">{showAssessment ? 'Coverage quality' : 'Coverage'}</th>
          </tr>
        </thead>
        <tbody className="divide-line divide-y">
          {visible.map((row) => (
            <tr
              key={row.id}
              onClick={() => onSelect?.(row)}
              className={cn(
                onSelect && 'hover:bg-paper-deep cursor-pointer',
                selectedId === row.id && 'bg-paper-deep',
              )}
            >
              <td className="tnum py-2 pr-3 font-mono text-[11px]">{row.rank}</td>
              <td className="px-3 py-2">{row.label}</td>
              <td className="tnum px-3 py-2 text-right font-mono text-[11.5px]">{row.persistenceDays} d</td>
              <td className="tnum px-3 py-2 text-right font-mono text-[11.5px]" style={{ color: tHotColor(row.tHot) }}>
                {row.tHot} K
              </td>
              {showAssessment && (
                <td className="px-3 py-2">
                  <span className="inline-flex items-center gap-1.5">
                    <span
                      className="h-2 w-2 rounded-full"
                      style={{ backgroundColor: ASSESSMENT_TONE[row.assessment] }}
                    />
                    {row.assessment}
                  </span>
                </td>
              )}
              <td className="py-2 pl-3">
                <div className="flex justify-end">
                  <QualityChip score={row.coverageQualityScore} width={showAssessment ? 40 : 28} />
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

/** The caveat that must travel with any unmapped list. */
export function CoverageCaveat() {
  return (
    <p className="bg-amber-dim border-line text-ink rounded-[10px] border px-3 py-2 text-[12px]">
      Absence of a mapped facility is evidence only where coverage quality is high. Rows below 0.5 are listed for
      completeness and should not be read as unmapped industry.
    </p>
  )
}
