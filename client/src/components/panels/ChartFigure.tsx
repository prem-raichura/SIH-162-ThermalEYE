import type { ReactNode } from 'react'

export interface FallbackTable {
  caption: string
  columns: string[]
  rows: (string | number)[][]
}

/**
 * A chart that carries a claim has to be readable without seeing it. The canvas gets a
 * described role so a screen reader announces the summary rather than a wall of SVG, and
 * the numbers behind it stay one keystroke away in a real table.
 */
export function ChartFigure({
  label,
  summary,
  table,
  children,
}: {
  /** Short name of the chart, announced first. */
  label: string
  /** One sentence stating what the chart shows — the thing a sighted reader takes away. */
  summary: string
  table?: FallbackTable
  children: ReactNode
}) {
  return (
    <figure className="m-0">
      <div role="img" aria-label={`${label}. ${summary}`}>
        {children}
      </div>

      {table && (
        <details className="group mt-2">
          <summary className="text-ink-soft hover:text-ink cursor-pointer text-[11.5px] underline-offset-4 hover:underline">
            Show the numbers behind this chart
          </summary>
          <div className="panel-scroll mt-2 max-h-[300px] overflow-auto overscroll-contain">
            <table className="w-full text-[12px]">
              <caption className="text-ink-faint pb-2 text-left text-[11.5px]">{table.caption}</caption>
              <thead className="text-ink-faint text-[10.5px] [&_th]:border-line [&_th]:border-b">
                <tr>
                  {table.columns.map((column, i) => (
                    <th key={column} scope="col" className={i === 0 ? 'py-1.5 pr-3 text-left font-normal' : 'px-3 py-1.5 text-right font-normal last:pr-0'}>
                      {column}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-line divide-y">
                {table.rows.map((row) => (
                  <tr key={String(row[0])}>
                    {row.map((cell, i) => (
                      <td
                        key={table.columns[i]}
                        className={i === 0 ? 'py-1.5 pr-3' : 'tnum px-3 py-1.5 text-right font-mono text-[11.5px] last:pr-0'}
                      >
                        {cell}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </details>
      )}
    </figure>
  )
}
