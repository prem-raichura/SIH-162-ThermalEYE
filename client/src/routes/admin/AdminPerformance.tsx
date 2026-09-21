import { useMemo } from 'react'
import { Gauge, Layers, ShieldCheck, Target } from 'lucide-react'
import { PageHeader } from '@/components/shell/PageHeader'
import { Panel } from '@/components/panels/Panel'
import { StatTile } from '@/components/panels/StatTile'
import { ConfusionMatrix } from '@/components/panels/ConfusionMatrix'
import { model } from '@/lib/data'
import { logLine } from '@/store/useConsole'
import { STATUS } from '@/lib/chart'
import { nf, pct } from '@/lib/format'
import { cn } from '@/lib/utils'
import type { Role } from '@/lib/roles'
import { useSettingsFor } from '@/store/useRoleSettings'

/** Section 26. Everything computable is computed from the shipped sites; the rest says so. */
export function AdminPerformance({ role }: { role: Role }) {
  const settings = useSettingsFor('admin')
  const perClass = useMemo(() => [...model.perClass].sort((a, b) => b.support - a.support), [])
  const weakest = useMemo(() => [...model.perClass].sort((a, b) => a.f1 - b.f1)[0], [])
  const imbalanced = model.perClass.filter((c) => c.imbalanced).length

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        role={role}
        eyebrow="Section 26"
        title="Model performance"
        description="The evaluation as reported: accuracy and the confusion matrix computed from the sites in this build, with the curve metrics carried from the evaluation design."
        meta={[
          { label: 'Accuracy', value: pct(model.accuracy, 1) },
          { label: 'Macro-F1', value: model.macroF1.toFixed(3) },
          { label: 'Sites', value: nf(model.evaluatedSites) },
        ]}
      />

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatTile icon={Target} label="Accuracy" value={pct(model.accuracy, 1)} caption="Over the evaluated sites" tone="good" />
        <StatTile
          icon={Gauge}
          label="Macro-F1"
          value={model.macroF1.toFixed(3)}
          caption="Every class weighs the same, however rare"
        />
        <StatTile icon={Layers} label="Classes" value={nf(model.classes)} caption={`${nf(imbalanced)} below median support`} />
        <StatTile
          icon={ShieldCheck}
          label="Control false positives"
          value={nf(model.controls.falsePositives)}
          caption={`${nf(model.controls.monitored)} renewable plants monitored`}
          tone="good"
        />
      </div>

      <Panel
        title="Confusion matrix"
        subtitle="True class down the side, prediction across the top — the diagonal should read hot"
      >
        <ConfusionMatrix
          matrix={model.confusionMatrix}
          labels={model.classLabels}
          onSelect={(trueLabel, predictedLabel, count) =>
            logLine(role.id, `${trueLabel} predicted as ${predictedLabel} — ${nf(count)} sites`)
          }
        />
      </Panel>

      <Panel
        title="Per class"
        subtitle="PR-AUC is the curve to read for the rare classes; ROC-AUC flatters them"
      >
        <div className="panel-scroll max-h-[520px] overflow-auto overscroll-contain">
          <table className="w-full min-w-[720px] text-[12.5px]">
            <thead className="text-ink-faint sticky top-0 z-10 text-[10.5px] [&_th]:bg-card [&_th]:border-line [&_th]:border-b">
              <tr>
                <th className="py-2 pr-3 text-left font-normal">Class</th>
                <th className="px-3 py-2 text-right font-normal">Support</th>
                <th className="px-3 py-2 text-right font-normal">Precision</th>
                <th className="px-3 py-2 text-right font-normal">Recall</th>
                <th className="px-3 py-2 text-right font-normal">F1</th>
                <th className="px-3 py-2 text-right font-normal">ROC-AUC</th>
                <th className="py-2 pl-3 text-right font-normal">PR-AUC</th>
              </tr>
            </thead>
            <tbody className="divide-line divide-y">
              {perClass.map((row) => (
                <tr key={row.class}>
                  <td className="py-2 pr-3">
                    {row.label}
                    {row.imbalanced && (
                      <span className="text-ink-faint ml-2 text-[10.5px]">imbalanced</span>
                    )}
                  </td>
                  <td className="tnum px-3 py-2 text-right font-mono text-[11.5px]">{nf(row.support)}</td>
                  <td className="tnum px-3 py-2 text-right font-mono text-[11.5px]">{row.precision.toFixed(3)}</td>
                  <td className="tnum px-3 py-2 text-right font-mono text-[11.5px]">{row.recall.toFixed(3)}</td>
                  <td className="tnum px-3 py-2 text-right font-mono text-[11.5px]">
                    <Score value={row.f1} good={settings.f1Good} warn={settings.f1Warn} />
                  </td>
                  <td className="tnum px-3 py-2 text-right font-mono text-[11.5px]">{row.rocAuc.toFixed(3)}</td>
                  <td className={cn('tnum py-2 pl-3 text-right font-mono text-[11.5px]', row.imbalanced && 'font-semibold')}>
                    {row.prAuc.toFixed(3)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-ink-faint mt-3 text-[11.5px]">
          Weakest class: {weakest.label} at F1 {weakest.f1.toFixed(3)} on {nf(weakest.support)} sites.
        </p>
      </Panel>

      <div className="grid gap-3 xl:grid-cols-2">
        <Panel title="Negative controls" subtitle="Section 21 — facilities that must never fire">
          <div className="flex flex-wrap gap-x-8 gap-y-3">
            <Figure label="Controls in the register" value={nf(model.controls.total)} />
            <Figure label="Monitored" value={nf(model.controls.monitored)} />
            <Figure label="False positives" value={nf(model.controls.falsePositives)} tone={STATUS.good} />
          </div>
          <p className="text-ink-soft mt-3 text-[12.5px]">{model.controls.note}</p>
        </Panel>

        <Panel title="What these numbers are" subtitle="Computed against reported">
          <p className="text-ink-soft text-[12.5px]">{model.metricNote}</p>
          <p className="text-ink-faint mt-2 text-[11.5px]">
            No training runs here and no model files ship with this build. The page reports an evaluation design and the
            figures it produces.
          </p>
        </Panel>
      </div>
    </div>
  )
}

function Score({ value, good, warn }: { value: number; good: number; warn: number }) {
  const color = value >= good ? STATUS.good : value >= warn ? STATUS.warning : STATUS.critical
  return <span style={{ color }}>{value.toFixed(3)}</span>
}

function Figure({ label, value, tone }: { label: string; value: string; tone?: string }) {
  return (
    <div>
      <p className="text-ink-faint text-[10px] tracking-[0.1em] uppercase">{label}</p>
      <p className="font-display tnum mt-1 text-[26px] leading-none" style={tone ? { color: tone } : undefined}>
        {value}
      </p>
    </div>
  )
}
