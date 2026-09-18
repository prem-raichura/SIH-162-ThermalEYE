import { useEffect, useState } from 'react'
import { QualityChip } from './QualityChip'
import { EmptyState } from './EmptyState'
import { loadSar } from '@/lib/data'
import type { SarEntry } from '@/lib/types'
import { Skeleton } from '@/components/ui/skeleton'

/**
 * Sentinel-1 structural evidence (section 10). SAR never detects heat — it answers what
 * physical surface is present or changing, which is why it is read as before/after values
 * rather than plotted against the thermal series.
 */
export function SarEvidence({ siteId }: { siteId: string }) {
  const [sar, setSar] = useState<Record<string, SarEntry> | null>(null)

  useEffect(() => {
    loadSar().then(setSar)
  }, [])

  if (!sar) return <Skeleton className="h-[150px] w-full rounded-[10px]" />
  const entry = sar[siteId]
  if (!entry) return null

  if (!entry.available) {
    return (
      <EmptyState
        title="No Sentinel-1 pass for this site"
        body="Revisit thinned across 2022–2024 after the loss of Sentinel-1B. Structural evidence is unavailable here; the thermal and temporal features stand on their own."
      />
    )
  }

  const rows: [string, number, number, number][] = [
    ['VV', entry.vvBefore, entry.vvAfter, entry.dVv],
    ['VH', entry.vhBefore, entry.vhAfter, entry.dVh],
    ['VV/VH', entry.ratioBefore, entry.ratioAfter, Math.round((entry.ratioAfter - entry.ratioBefore) * 100) / 100],
  ]

  return (
    <div>
      <table className="w-full text-[12px]">
        <thead className="text-ink-faint border-line border-b text-[10.5px]">
          <tr>
            <th className="py-1.5 pr-3 text-left font-normal">Band</th>
            <th className="px-3 py-1.5 text-right font-normal last:pr-0">Before (dB)</th>
            <th className="px-3 py-1.5 text-right font-normal last:pr-0">After (dB)</th>
            <th className="px-3 py-1.5 text-right font-normal last:pr-0">Change</th>
          </tr>
        </thead>
        <tbody className="divide-line divide-y">
          {rows.map(([band, before, after, delta]) => (
            <tr key={band}>
              <td className="py-1.5 pr-3 font-mono text-[11px]">{band}</td>
              <td className="tnum px-3 py-1.5 text-right font-mono">{before}</td>
              <td className="tnum px-3 py-1.5 text-right font-mono">{after}</td>
              <td
                className="tnum py-1.5 pl-3 text-right font-mono"
                style={{ color: Math.abs(delta) > 1.6 ? 'var(--color-terracotta)' : 'inherit' }}
              >
                {delta > 0 ? `+${delta}` : delta}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="text-ink-soft mt-2 text-[12px]">{entry.read}</p>
      <QualityChip label="SAR quality" score={entry.qualityScore} className="mt-2" />
    </div>
  )
}
