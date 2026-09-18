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
  showAssessment = true,
}: {
  rows: UnmappedCandidate[]
  onSelect?: (row: UnmappedCandidate) => void
  selectedId?: string | null
  limit?: number
  showAssessment?: boolean
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

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[480px] text-[12.5px]">
        <thead className="text-ink-faint border-line border-b text-[10.5px]">
          <tr>
            <th className="w-8 py-2 pr-3 text-left font-normal">#</th>
            <th className="px-3 py-2 text-left font-normal">Location</th>
            <th className="px-3 py-2 text-right font-normal">Persistence</th>
            <th className="px-3 py-2 text-right font-normal">T_hot</th>
            {showAssessment && <th className="px-3 py-2 text-left font-normal">Assessment</th>}
            <th className="py-2 pl-3 text-right font-normal">Coverage quality</th>
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
                  <QualityChip score={row.coverageQualityScore} width={40} />
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
