import { useMemo, useState } from 'react'
import { rampAt } from '@/lib/thermal'
import { nf } from '@/lib/format'
import { cn } from '@/lib/utils'

interface Cell {
  row: number
  col: number
  count: number
  share: number
}

/**
 * The confusion matrix on the plasma ramp: rows are the true class, columns the predicted one,
 * so a healthy model reads hot down the diagonal and dark everywhere else. Cells are shaded by
 * the share of their own row, because class supports differ by an order of magnitude and raw
 * counts would make the large classes the only visible ones.
 */
export function ConfusionMatrix({
  matrix,
  labels,
  onSelect,
}: {
  matrix: number[][]
  labels: string[]
  onSelect?: (trueLabel: string, predictedLabel: string, count: number) => void
}) {
  const [hover, setHover] = useState<Cell | null>(null)

  const cells = useMemo(
    () =>
      matrix.map((row) => {
        const total = row.reduce((a, b) => a + b, 0) || 1
        return row.map((count) => ({ count, share: count / total }))
      }),
    [matrix],
  )

  return (
    <div>
      <div className="panel-scroll overflow-auto overscroll-contain">
        <table className="border-separate border-spacing-0 text-[11px]">
          <thead>
            <tr>
              <th className="bg-card sticky left-0 z-10 px-2 py-1 text-right font-normal" />
              {labels.map((label) => (
                <th
                  key={label}
                  className="text-ink-faint h-[86px] px-0.5 align-bottom font-normal"
                  style={{ width: 26 }}
                >
                  <span className="block origin-bottom-left translate-x-3 -rotate-45 whitespace-nowrap">{label}</span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {cells.map((row, r) => (
              <tr key={labels[r]}>
                <th
                  scope="row"
                  className="bg-card text-ink-soft sticky left-0 z-10 max-w-[130px] truncate py-0.5 pr-2 text-right text-[11px] font-normal"
                >
                  {labels[r]}
                </th>
                {row.map((cell, c) => {
                  const active = hover?.row === r && hover.col === c
                  return (
                    <td key={`${labels[r]}-${labels[c]}`} className="p-[1px]">
                      <button
                        type="button"
                        onMouseEnter={() => setHover({ row: r, col: c, ...cell })}
                        onMouseLeave={() => setHover(null)}
                        onClick={() => onSelect?.(labels[r], labels[c], cell.count)}
                        className={cn(
                          'tnum grid h-6 w-6 place-items-center rounded-[3px] font-mono text-[9.5px] transition-transform',
                          active && 'scale-[1.18]',
                        )}
                        style={{
                          backgroundColor: cell.count === 0 ? 'var(--color-line-soft)' : rampAt(cell.share),
                          color: cell.share > 0.55 ? '#1b1a17' : cell.count === 0 ? 'transparent' : '#f4f1ea',
                        }}
                        title={`${labels[r]} predicted as ${labels[c]} — ${nf(cell.count)}`}
                      >
                        {cell.count === 0 ? '' : cell.count}
                      </button>
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="text-ink-soft mt-3 flex flex-wrap items-center gap-x-5 gap-y-1.5 text-[11.5px]">
        <span className="inline-flex items-center gap-2">
          Share of the true class
          <span
            className="h-2 w-24 rounded-full"
            style={{ background: `linear-gradient(90deg, ${rampAt(0)}, ${rampAt(0.5)}, ${rampAt(1)})` }}
          />
          <span className="tnum font-mono">0 → 100%</span>
        </span>
        <span>Rows are the true class, columns the prediction.</span>
        {hover && (
          <span className="text-ink">
            {labels[hover.row]} predicted as {labels[hover.col]} —{' '}
            <span className="tnum font-mono">
              {nf(hover.count)} ({Math.round(hover.share * 100)}%)
            </span>
          </span>
        )}
      </div>
    </div>
  )
}
