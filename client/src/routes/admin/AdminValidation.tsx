import { useMemo, useState } from 'react'
import { CheckCircle2, ClipboardList, Users, XCircle } from 'lucide-react'
import { PageHeader } from '@/components/shell/PageHeader'
import { Panel } from '@/components/panels/Panel'
import { StatTile } from '@/components/panels/StatTile'
import { validation } from '@/lib/data'
import { logLine } from '@/store/useConsole'
import { STATUS } from '@/lib/chart'
import { nf, pct } from '@/lib/format'
import { cn } from '@/lib/utils'
import type { Role } from '@/lib/roles'

type TransitionFilter = 'all' | 'pass' | 'fail'

/** Section 21: three tiers, two of which need no human judgement at all. */
export function AdminValidation({ role }: { role: Role }) {
  const [filter, setFilter] = useState<TransitionFilter>('all')

  const totalSites = validation.tiers.reduce((a, t) => a + t.sites, 0)
  const noHuman = validation.tiers.filter((t) => !t.humanNeeded).reduce((a, t) => a + t.sites, 0)
  const passes = validation.transitions.filter((t) => t.pass).length

  const rows = useMemo(
    () =>
      validation.transitions.filter((t) => (filter === 'all' ? true : filter === 'pass' ? t.pass : !t.pass)),
    [filter],
  )

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        role={role}
        eyebrow="Section 21"
        title="Validation"
        description="What the system can be checked against without labelling anything, and what still waits on human work."
        meta={[
          { label: 'Sites', value: nf(totalSites) },
          { label: 'No labelling needed', value: nf(noHuman) },
          { label: 'Transition pass rate', value: pct(validation.transitionPassRate, 1) },
        ]}
      />

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatTile icon={ClipboardList} label="Validation sites" value={nf(totalSites)} caption="Across the three tiers" />
        <StatTile
          icon={CheckCircle2}
          label="Need no human"
          value={nf(noHuman)}
          caption="Registers and dated transitions carry their own truth"
          tone="good"
        />
        <StatTile
          icon={Users}
          label="Labelling outstanding"
          value={nf(totalSites - noHuman)}
          caption="Tier B, imagery-based, still to do"
          tone="warning"
        />
        <StatTile
          icon={CheckCircle2}
          label="Transitions passing"
          value={`${nf(passes)} / ${nf(validation.transitions.length)}`}
          caption={`${pct(validation.transitionPassRate, 1)} of the natural experiment`}
        />
      </div>

      <Panel title="Tiers" subtitle="How much of the validation set is free of human judgement">
        <ul className="divide-line divide-y">
          {validation.tiers.map((tier) => (
            <li key={tier.tier} className="py-3">
              <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                <p className="text-[13px] font-medium">
                  Tier {tier.tier} · {tier.name}
                </p>
                <p className="tnum text-ink-soft font-mono text-[12px]">
                  {nf(tier.sites)} sites · {Math.round((tier.sites / totalSites) * 100)}% of the set
                </p>
              </div>
              <div className="bg-line mt-2 h-2 overflow-hidden rounded-full">
                <div
                  className="h-full rounded-full"
                  style={{
                    width: `${(tier.sites / totalSites) * 100}%`,
                    backgroundColor: tier.humanNeeded ? STATUS.warning : STATUS.good,
                  }}
                />
              </div>
              <p className="text-ink-soft mt-1.5 text-[12px]">
                {tier.source} · {tier.humanNeeded ? 'human labelling outstanding' : 'no labelling needed'}
              </p>
            </li>
          ))}
        </ul>
        <p className="text-ink-faint mt-2 text-[11.5px]">{validation.note}</p>
      </Panel>

      <Panel
        title="Tier A2 — the temporal natural experiment"
        subtitle="Section 21.2 — dated commissioning and retirement, and what the thermal record did around that year"
        action={
          <div className="flex gap-1.5">
            {(['all', 'pass', 'fail'] as TransitionFilter[]).map((id) => (
              <button
                key={id}
                type="button"
                onClick={() => {
                  setFilter(id)
                  logLine(role.id, `Transition view filtered to ${id}`)
                }}
                className={cn(
                  'border-line rounded-full border px-2.5 py-1 text-[11.5px] capitalize',
                  filter === id ? 'bg-ink text-paper border-ink' : 'hover:border-ink-faint',
                )}
              >
                {id}
              </button>
            ))}
          </div>
        }
      >
        <div className="panel-scroll max-h-[520px] overflow-auto overscroll-contain">
          <table className="w-full min-w-[820px] text-[12.5px]">
            <thead className="text-ink-faint sticky top-0 z-10 text-[10.5px] [&_th]:bg-card [&_th]:border-line [&_th]:border-b">
              <tr>
                <th className="py-2 pr-3 text-left font-normal">Plant</th>
                <th className="px-3 py-2 text-left font-normal">Transition</th>
                <th className="px-3 py-2 text-right font-normal">Year</th>
                <th className="px-3 py-2 text-right font-normal">MW</th>
                <th className="px-3 py-2 text-left font-normal">Expected</th>
                <th className="px-3 py-2 text-left font-normal">Observed</th>
                <th className="py-2 pl-3 text-right font-normal">Result</th>
              </tr>
            </thead>
            <tbody className="divide-line divide-y">
              {rows.map((t) => (
                <tr key={t.id}>
                  <td className="max-w-[220px] truncate py-2 pr-3">{t.plant}</td>
                  <td className="px-3 py-2 capitalize">{t.transition}</td>
                  <td className="tnum px-3 py-2 text-right font-mono text-[11.5px]">{t.year}</td>
                  <td className="tnum px-3 py-2 text-right font-mono text-[11.5px]">{nf(t.mw)}</td>
                  <td className="text-ink-soft max-w-[240px] px-3 py-2">{t.expected}</td>
                  <td className="text-ink-soft max-w-[220px] px-3 py-2">{t.observed}</td>
                  <td className="py-2 pl-3 text-right">
                    {t.pass ? (
                      <span className="inline-flex items-center gap-1 text-[11.5px]" style={{ color: STATUS.good }}>
                        <CheckCircle2 size={13} strokeWidth={1.9} /> pass
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[11.5px]" style={{ color: STATUS.critical }}>
                        <XCircle size={13} strokeWidth={1.9} /> no shift
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <p className="text-ink-faint mt-3 text-[11.5px]">
          A plant that was commissioned or retired on a known date is ground truth nobody had to label, and it is the one
          check a map-lookup model cannot reproduce: the facility is in the register on both sides of the date, only the
          thermal record changes.
        </p>
      </Panel>
    </div>
  )
}
