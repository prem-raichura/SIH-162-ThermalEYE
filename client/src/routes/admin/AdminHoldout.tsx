import { MapPinned, Split, Target } from 'lucide-react'
import { PageHeader } from '@/components/shell/PageHeader'
import { Panel } from '@/components/panels/Panel'
import { StatTile } from '@/components/panels/StatTile'
import { HoldoutMap } from './HoldoutMap'
import { model } from '@/lib/data'
import { STATUS } from '@/lib/chart'
import { nf, pct } from '@/lib/format'
import { cn } from '@/lib/utils'
import type { Role } from '@/lib/roles'

/** Section 22: whole regions train, one region is never seen. */
export function AdminHoldout({ role }: { role: Role }) {
  const holdout = model.holdout
  const gap = (holdout.testAccuracy ?? 0) - (holdout.trainingAccuracy ?? 0)

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        role={role}
        eyebrow="Section 22"
        title="Geographic holdout"
        description="The split is regional, not random. Many detections belong to the same facility, so a random point split would score the model on locations it has already memorised."
        meta={[
          { label: 'Held out', value: holdout.testRegion },
          { label: 'Training sites', value: nf(holdout.trainingSites) },
          { label: 'Test sites', value: nf(holdout.testSites) },
        ]}
      />

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatTile
          icon={Split}
          label="Split"
          value={`${nf(holdout.regions.filter((r) => r.role === 'training').length)} / 1`}
          caption="Training regions against one held-out region"
        />
        <StatTile
          icon={Target}
          label="Training accuracy"
          value={pct(holdout.trainingAccuracy, 1)}
          caption={`${nf(holdout.trainingSites)} sites the model has seen`}
        />
        <StatTile
          icon={Target}
          label="Held-out accuracy"
          value={pct(holdout.testAccuracy, 1)}
          caption={`${nf(holdout.testSites)} sites in ${holdout.testRegion}`}
          tone={gap >= -0.03 ? 'good' : 'warning'}
        />
        <StatTile
          icon={MapPinned}
          label="Generalisation gap"
          value={`${gap >= 0 ? '+' : ''}${Math.round(gap * 1000) / 10}%`}
          caption="Held-out minus training — near zero is the result to want"
          tone={Math.abs(gap) <= 0.03 ? 'good' : 'warning'}
        />
      </div>

      <div className="grid gap-3 xl:grid-cols-[1.4fr_1fr]">
        <HoldoutMap role={role.id} />

        <Panel title="Regions" subtitle="Counted from the evaluated sites, per zone">
          <div className="panel-scroll overflow-auto overscroll-contain">
            <table className="w-full text-[12.5px]">
              <thead className="text-ink-faint text-[10.5px] [&_th]:border-line [&_th]:border-b">
                <tr>
                  <th className="py-2 pr-3 text-left font-normal">Region</th>
                  <th className="px-3 py-2 text-left font-normal">Role</th>
                  <th className="px-3 py-2 text-right font-normal">Sites</th>
                  <th className="py-2 pl-3 text-right font-normal">Accuracy</th>
                </tr>
              </thead>
              <tbody className="divide-line divide-y">
                {holdout.regions.map((region) => (
                  <tr key={region.region} className={cn(region.role === 'test' && 'bg-paper-deep')}>
                    <td className="py-2 pr-3">
                      <p className="font-medium">{region.region}</p>
                      <p className="text-ink-faint mt-0.5 max-w-[190px] truncate text-[11px]">
                        {region.states.join(', ')}
                      </p>
                    </td>
                    <td className="px-3 py-2">
                      <span
                        className="rounded-full px-2 py-0.5 text-[10.5px]"
                        style={{
                          backgroundColor: region.role === 'test' ? 'var(--color-terra-dim)' : 'var(--color-paper-deep)',
                          color: region.role === 'test' ? 'var(--color-terracotta)' : 'var(--color-ink-soft)',
                        }}
                      >
                        {region.role === 'test' ? 'held out' : 'training'}
                      </span>
                    </td>
                    <td className="tnum px-3 py-2 text-right font-mono text-[11.5px]">{nf(region.sites)}</td>
                    <td className="tnum py-2 pl-3 text-right font-mono text-[11.5px]">
                      <span
                        style={{
                          color:
                            region.accuracy === null
                              ? undefined
                              : region.accuracy >= 0.88
                                ? STATUS.good
                                : region.accuracy >= 0.8
                                  ? STATUS.warning
                                  : STATUS.critical,
                        }}
                      >
                        {pct(region.accuracy, 1)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>
      </div>

      <Panel title="Why the split is drawn this way" subtitle="Section 22">
        <p className="text-ink-soft text-[12.5px]">{holdout.note}</p>
        <div className="border-line mt-3 grid gap-3 border-t pt-3 md:grid-cols-2">
          <div>
            <p className="text-[12.5px] font-medium">A random point split would say</p>
            <p className="text-ink-soft mt-1 text-[12.5px]">
              that the model is excellent, because the same refinery appears on both sides of the split under a slightly
              different pixel. The score would measure recall of locations, not of physics.
            </p>
          </div>
          <div>
            <p className="text-[12.5px] font-medium">A regional split says</p>
            <p className="text-ink-soft mt-1 text-[12.5px]">
              what happens on facilities and districts the model has never been shown. {holdout.testRegion} contributes{' '}
              {nf(holdout.testSites)} evaluated sites and is excluded from training entirely.
            </p>
          </div>
        </div>
      </Panel>
    </div>
  )
}
