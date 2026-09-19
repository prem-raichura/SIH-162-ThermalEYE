import { useMemo } from 'react'
import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { Thermometer } from 'lucide-react'
import { PageHeader } from '@/components/shell/PageHeader'
import { Panel } from '@/components/panels/Panel'
import { model } from '@/lib/data'
import { AXIS, CHART_CATEGORICAL, MARK, STATUS, TOOLTIP_STYLE } from '@/lib/chart'
import { nf, pct } from '@/lib/format'
import { cn } from '@/lib/utils'
import type { Role } from '@/lib/roles'

/**
 * Section 28. A0 against A1 is the whole argument of the project: the same detections, the
 * same sites, with the derived thermal physics added. It is the largest thing on the page.
 */
export function AdminAblations({ role }: { role: Role }) {
  // The delta is against the previous *completed* run, so a pending row never invents a jump.
  const rows = useMemo(() => {
    const done = model.ablations.filter((r) => r.accuracy !== null && r.macroF1 !== null)
    return model.ablations.map((run) => {
      const position = done.findIndex((r) => r.run === run.run)
      const previous = position > 0 ? done[position - 1] : null
      const delta =
        run.accuracy !== null && run.macroF1 !== null && previous?.accuracy != null && previous.macroF1 != null
          ? { accuracy: run.accuracy - previous.accuracy, macroF1: run.macroF1 - previous.macroF1 }
          : null
      return { ...run, delta }
    })
  }, [])

  const complete = rows.filter((r) => r.status === 'complete')
  const pending = rows.filter((r) => r.status === 'pending')
  const key = model.keyAblation

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        role={role}
        eyebrow="Section 28"
        title="Ablations"
        description="What each block of features is actually worth, measured by taking it away. Runs that need data this build does not hold are reported as pending, never as results."
        meta={[
          { label: 'Runs complete', value: nf(complete.length) },
          { label: 'Pending', value: nf(pending.length) },
        ]}
      />

      <Panel
        title={`${key.from} against ${key.to}`}
        subtitle="Raw FIRMS alone, then the same data with the dual-band retrieval added"
      >
        <div className="flex flex-wrap items-center gap-x-12 gap-y-6">
          <div className="flex items-end gap-3">
            <span className="grid h-12 w-12 shrink-0 place-items-center rounded-full" style={{ backgroundColor: 'var(--color-paper-deep)', color: 'var(--color-graphite)' }}>
              <Thermometer size={22} strokeWidth={1.8} />
            </span>
            <div>
              <p className="text-ink-faint text-[10px] tracking-[0.12em] uppercase">Accuracy gain</p>
              <p className="font-display tnum text-[64px] leading-[0.95]" style={{ color: STATUS.good }}>
                +{Math.round(key.accuracyDelta * 1000) / 10}
                <span className="text-[34px]">%</span>
              </p>
            </div>
          </div>

          <div>
            <p className="text-ink-faint text-[10px] tracking-[0.12em] uppercase">Macro-F1 gain</p>
            <p className="font-display tnum text-[46px] leading-none" style={{ color: STATUS.good }}>
              +{Math.round(key.macroF1Delta * 1000) / 10}
              <span className="text-[26px]">%</span>
            </p>
          </div>

          <div className="min-w-[240px] flex-1">
            <p className="text-[13.5px]">{key.claim}</p>
            <p className="text-ink-soft mt-2 text-[12.5px]">
              This is the evidence that the system measures how hot the source is, not merely how often it is detected.
            </p>
          </div>
        </div>

        <div className="border-line mt-5 border-t pt-4">
          <ResponsiveContainer width="100%" height={220}>
            <BarChart
              data={complete.map((r) => ({
                run: r.run,
                accuracy: Math.round((r.accuracy ?? 0) * 1000) / 10,
                macroF1: Math.round((r.macroF1 ?? 0) * 1000) / 10,
              }))}
              margin={{ top: 4, right: 8, bottom: 0, left: -12 }}
              barGap={MARK.barGap}
            >
              <CartesianGrid {...AXIS.grid} vertical={false} />
              <XAxis dataKey="run" tickLine={false} axisLine={{ stroke: AXIS.stroke }} tick={AXIS.tick} />
              <YAxis tickLine={false} axisLine={false} tick={AXIS.tick} width={46} domain={[0, 100]} unit="%" />
              <Tooltip {...TOOLTIP_STYLE} formatter={(value, name) => [`${value}%`, String(name)]} />
              <Bar dataKey="accuracy" name="Accuracy" radius={MARK.barRadius} isAnimationActive={false}>
                {complete.map((r) => (
                  <Cell key={r.run} fill={r.run === key.to ? STATUS.good : CHART_CATEGORICAL[2]} />
                ))}
              </Bar>
              <Bar dataKey="macroF1" name="Macro-F1" fill={CHART_CATEGORICAL[4]} radius={MARK.barRadius} isAnimationActive={false} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Panel>

      <Panel title="Every run" subtitle="Each row adds one block of features to the row above it">
        <div className="panel-scroll overflow-auto overscroll-contain">
          <table className="w-full min-w-[760px] text-[12.5px]">
            <thead className="text-ink-faint text-[10.5px] [&_th]:border-line [&_th]:border-b">
              <tr>
                <th className="py-2 pr-3 text-left font-normal">Run</th>
                <th className="px-3 py-2 text-left font-normal">Features</th>
                <th className="px-3 py-2 text-right font-normal">Accuracy</th>
                <th className="px-3 py-2 text-right font-normal">Macro-F1</th>
                <th className="py-2 pl-3 text-right font-normal">Δ from previous</th>
              </tr>
            </thead>
            <tbody className="divide-line divide-y">
              {rows.map((run) => {
                const isKey = run.run === key.to
                return (
                  <tr key={run.run} className={cn(isKey && 'bg-paper-deep')}>
                    <td className="py-2 pr-3 font-medium">
                      {run.run}
                      {isKey && <span className="text-ink-faint ml-2 text-[10.5px]">key ablation</span>}
                    </td>
                    <td className="text-ink-soft max-w-[380px] px-3 py-2">{run.features}</td>
                    <td className="tnum px-3 py-2 text-right font-mono text-[11.5px]">
                      {run.accuracy === null ? <Pending /> : pct(run.accuracy, 1)}
                    </td>
                    <td className="tnum px-3 py-2 text-right font-mono text-[11.5px]">
                      {run.macroF1 === null ? <Pending /> : run.macroF1.toFixed(3)}
                    </td>
                    <td className="tnum py-2 pl-3 text-right font-mono text-[11.5px]">
                      {run.delta ? (
                        <span style={{ color: run.delta.accuracy >= 0 ? STATUS.good : STATUS.critical }}>
                          {run.delta.accuracy >= 0 ? '+' : ''}
                          {Math.round(run.delta.accuracy * 1000) / 10}%
                        </span>
                      ) : (
                        <span className="text-ink-faint">—</span>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        <p className="text-ink-faint mt-3 text-[11.5px]">{model.pendingNote}</p>
      </Panel>
    </div>
  )
}

function Pending() {
  return (
    <span
      className="rounded-full px-2 py-0.5 text-[10.5px]"
      style={{ backgroundColor: 'var(--color-amber-dim)', color: 'var(--color-amber)' }}
    >
      pending
    </span>
  )
}
