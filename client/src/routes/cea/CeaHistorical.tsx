import { useMemo } from 'react'
import { Check, X } from 'lucide-react'
import { PageHeader } from '@/components/shell/PageHeader'
import { Panel } from '@/components/panels/Panel'
import { StatTile } from '@/components/panels/StatTile'
import { TrendChart } from '@/components/panels/TrendChart'
import { SiteTable } from '@/components/panels/SiteTable'
import { SiteDetailDrawer } from '@/components/panels/SiteDetailDrawer'
import { useCeaSites } from './useCeaData'
import { useFilters } from '@/store/useFilters'
import { loadDetections, validation } from '@/lib/data'
import type { Detection } from '@/lib/types'
import { useAsyncData } from '@/hooks/useAsyncData'

/** One frozen empty array, so a pending load does not re-key every memo below it. */
const NO_DETECTIONS: Detection[] = []
import { PanelLoader } from '@/components/shell/Loader'
import { nf, pct } from '@/lib/format'
import { CalendarClock, PlugZap, Power } from 'lucide-react'
import { STATUS } from '@/lib/chart'
import type { Role } from '@/lib/roles'

/**
 * Section 21.2 — the temporal natural experiment. The Global Coal Plant Tracker records a
 * commissioning or retirement year per unit, which is a dated physical fact rather than an
 * opinion. If the retrieved thermal series shifts in the right direction around that year,
 * the system is reading the plant and not the map: no map-lookup model can reproduce this.
 */
export function CeaHistorical({ role }: { role: Role }) {
  const { filtered } = useCeaSites()
  const selectSite = useFilters((s) => s.selectSite)
  const selectedSiteId = useFilters((s) => s.selectedSiteId)

  const transitions = validation.transitions
  const retirements = transitions.filter((t) => t.transition === 'retirement')
  const commissionings = transitions.filter((t) => t.transition === 'commissioning')

  // Counted from the detection records themselves rather than modelled, so the shape is
  // whatever the FIRMS passes actually did over these stations.
  const { data: loaded, pending, error, retry } = useAsyncData(loadDetections, 'Detection records')
  const detections = loaded ?? NO_DETECTIONS

  const seasonal = useMemo(() => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    const ids = new Set(filtered.map((s) => s.id))
    const counts = new Array(12).fill(0) as number[]
    for (const d of detections) {
      if (d.siteId === null || !ids.has(d.siteId)) continue
      counts[new Date(`${d.acqDate}T00:00:00Z`).getUTCMonth()] += 1
    }
    return months.map((month, i) => ({ month, detections: counts[i] }))
  }, [detections, filtered])

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        role={role}
        eyebrow="Validation"
        title="Historical analysis"
        description="Recurrence across the fleet, and the dated commissionings and retirements that test whether the system reads plants or maps."
        meta={[
          { label: 'Transitions', value: nf(transitions.length) },
          { label: 'Pass rate', value: pct(validation.transitionPassRate, 0) },
        ]}
      />

      <div className="grid gap-3 sm:grid-cols-3">
        <StatTile
          icon={Power}
          label="Retirements in window"
          value={nf(retirements.length)}
          caption="Signature should fall after the year"
        />
        <StatTile
          icon={PlugZap}
          label="Commissionings in window"
          value={nf(commissionings.length)}
          caption="Signature should appear after the year"
        />
        <StatTile
          icon={CalendarClock}
          label="Shift in the right direction"
          value={pct(validation.transitionPassRate, 0)}
          caption="Of the dated state changes"
          tone="good"
        />
      </div>

      <Panel
        title="Fleet seasonality"
        subtitle={
          pending
            ? 'Detections per month across the stations in view'
            : `Detections per month across the stations in view — ${nf(
                detections.filter((d) => d.siteId !== null).length,
              )} records sampled`
        }
      >
        {pending || error ? (
          <PanelLoader height={200} label="Loading detections" error={error} onRetry={retry} />
        ) : (
          <TrendChart data={seasonal} xKey="month" series={[{ key: 'detections', label: 'Detections' }]} height={200} />
        )}
      </Panel>

      <Panel
        title="Dated state changes"
        subtitle="Global Coal Plant Tracker, July 2026 — ground truth that needs no human judgement"
      >
        <div className="panel-scroll max-h-[400px] overflow-auto overscroll-contain">
          <table className="w-full min-w-[640px] text-[12.5px]">
            <thead className="text-ink-faint sticky top-0 z-10 text-[10.5px] [&_th]:bg-card [&_th]:border-line [&_th]:border-b">
              <tr>
                <th className="py-2 pr-3 text-left font-normal">Plant</th>
                <th className="px-3 py-2 text-left font-normal">Transition</th>
                <th className="px-3 py-2 text-right font-normal">Year</th>
                <th className="px-3 py-2 text-right font-normal">Capacity</th>
                <th className="px-3 py-2 text-left font-normal">Observed</th>
                <th className="py-2 pl-3 text-right font-normal">Result</th>
              </tr>
            </thead>
            <tbody className="divide-line divide-y">
              {transitions.map((t) => (
                <tr key={t.id}>
                  <td className="max-w-[220px] truncate py-2 pr-3">{t.plant}</td>
                  <td className="px-3 py-2">{t.transition}</td>
                  <td className="tnum px-3 py-2 text-right font-mono text-[11.5px]">{t.year}</td>
                  <td className="tnum px-3 py-2 text-right font-mono text-[11.5px]">{nf(t.mw, 0)} MW</td>
                  <td className="text-ink-soft px-3 py-2">{t.observed}</td>
                  <td className="py-2 pl-3">
                    <span className="flex justify-end">
                      {t.pass ? (
                        <Check size={14} strokeWidth={2.2} style={{ color: STATUS.good }} />
                      ) : (
                        <X size={14} strokeWidth={2.2} style={{ color: STATUS.critical }} />
                      )}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-ink-faint mt-2 text-[11px]">{validation.note}</p>
      </Panel>

      <Panel title="Recurrence across the fleet" subtitle="Stations ranked by how often they are detected">
        <SiteTable
          sites={[...filtered].sort((a, b) => b.recurrenceRate - a.recurrenceRate)}
          columns={['name', 'fuel', 'state', 'persistence', 'activeDays', 'frpSlope', 'status']}
          maxHeight={360}
          selectedId={selectedSiteId}
          onRowClick={(s) => {
            selectSite(s.id)
          }}
        />
      </Panel>

      <SiteDetailDrawer />
    </div>
  )
}
