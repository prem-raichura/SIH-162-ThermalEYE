import { useMemo } from 'react'
import { PageHeader } from '@/components/shell/PageHeader'
import { Panel } from '@/components/panels/Panel'
import { ThermalMap } from '@/components/map/ThermalMap'
import { SiteDetailDrawer } from '@/components/panels/SiteDetailDrawer'
import { usePpacSites } from './usePpacData'
import { useFilters } from '@/store/useFilters'
import { sites as allSites } from '@/lib/data'
import { coord, nf } from '@/lib/format'
import { cn } from '@/lib/utils'
import type { Role } from '@/lib/roles'

const CONFIDENCE_TONE: Record<string, { bg: string; fg: string }> = {
  high: { bg: 'var(--color-forest-dim)', fg: 'var(--color-forest)' },
  medium: { bg: 'var(--color-amber-dim)', fg: 'var(--color-amber)' },
  low: { bg: 'var(--color-terra-dim)', fg: 'var(--color-terracotta)' },
}

/**
 * The register itself: the complete PPAC refinery list joined to coordinates, with the match
 * confidence carried through. Where the join is uncertain the row says so — a low-confidence
 * coordinate is a labelling risk, not a detail to bury.
 */
export function PpacGas({ role }: { role: Role }) {
  const { refineries } = usePpacSites()
  const selectSite = useFilters((s) => s.selectSite)
  const selectedSiteId = useFilters((s) => s.selectedSiteId)

  const lng = useMemo(() => allSites.filter((s) => s.predictedClass === 'lng_gas'), [])
  const totalCapacity = useMemo(() => refineries.reduce((a, r) => a + (r.capacity ?? 0), 0), [refineries])
  const lowConfidence = refineries.filter((r) => r.matchConfidence === 'low')

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        role={role}
        eyebrow="Register"
        title="Gas infrastructure and refineries"
        description="The official PPAC list with the coordinate join that places each refinery on the map."
        meta={[
          { label: 'Refineries', value: nf(refineries.length) },
          { label: 'Capacity', value: `${nf(totalCapacity, 1)} MMTPA` },
          { label: 'LNG / gas sites', value: nf(lng.length) },
        ]}
      />

      <div className="grid gap-3 xl:grid-cols-[1.5fr_1fr]">
        <div className="relative min-h-[460px]">
          <Panel
            title="PPAC refineries"
            subtitle="Installed capacity as of 1 April 2026, joined to OSM coordinates"
            className="absolute inset-0"
          >
            <div className="panel-scroll h-full min-h-[260px] flex-1 overflow-auto overscroll-contain">
              <table className="w-full min-w-[620px] text-[12.5px]">
                <thead className="text-ink-faint sticky top-0 z-10 text-[10.5px] [&_th]:bg-card [&_th]:border-line [&_th]:border-b">
                  <tr>
                    <th className="py-2 pr-3 text-left font-normal">Refinery</th>
                    <th className="px-3 py-2 text-left font-normal">Company</th>
                    <th className="px-3 py-2 text-left font-normal">State</th>
                    <th className="px-3 py-2 text-right font-normal">Capacity</th>
                    <th className="px-3 py-2 text-right font-normal">Coordinates</th>
                    <th className="py-2 pl-3 text-left font-normal">Match</th>
                  </tr>
                </thead>
                <tbody className="divide-line divide-y">
                  {refineries.map((r) => (
                    <tr
                      key={r.id}
                      onClick={() => {
                        selectSite(r.id)
                      }}
                      className={cn('hover:bg-paper-deep cursor-pointer', selectedSiteId === r.id && 'bg-paper-deep')}
                    >
                      <td className="max-w-[190px] truncate py-2 pr-3">{r.name}</td>
                      <td className="text-ink-soft max-w-[190px] truncate px-3 py-2">{r.operator ?? '—'}</td>
                      <td className="px-3 py-2">{r.state}</td>
                      <td className="tnum px-3 py-2 text-right font-mono text-[11.5px]">
                        {r.capacity === null ? '—' : `${nf(r.capacity, 2)} MMTPA`}
                      </td>
                      <td className="text-ink-faint tnum px-3 py-2 text-right font-mono text-[11px]">
                        {coord(r.lat, r.lon)}
                      </td>
                      <td className="py-2 pl-3">
                        {r.matchConfidence && (
                          <span
                            className="rounded-full px-2 py-0.5 text-[10.5px]"
                            style={{
                              backgroundColor: CONFIDENCE_TONE[r.matchConfidence].bg,
                              color: CONFIDENCE_TONE[r.matchConfidence].fg,
                            }}
                          >
                            {r.matchConfidence}
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Panel>
        </div>

        <div className="flex min-w-0 flex-col gap-3">
          <ThermalMap role={role} sites={[...refineries, ...lng]} shape="square" />

          <Panel title="Where the join is uncertain" subtitle={`${lowConfidence.length} rows need human verification`}>
            <div className="text-ink-soft space-y-2 text-[12.5px]">
              <p>
                OSM alone returns 45 refinery features for what is really {refineries.length} refineries, because{' '}
                <code className="font-mono text-[11px]">industrial=oil</code> also tags depots, tank farms and
                edible-oil mills. Large complexes such as Panipat and Mumbai have their units mapped as separate
                polygons.
              </p>
              <ul className="list-disc space-y-1 pl-4">
                {lowConfidence.map((r) => (
                  <li key={r.id}>
                    <strong className="text-ink">{r.name}</strong>
                    {r.registerNote ? ` — ${r.registerNote}` : ' — coordinate assignment needs checking.'}
                  </li>
                ))}
              </ul>
              <p>
                One auto-match was wrong and has been corrected: MRPL Mangalore first matched a fuel station named
                &ldquo;MRPL petrol bunk&rdquo; rather than the refinery.
              </p>
            </div>
          </Panel>
        </div>
      </div>

      <SiteDetailDrawer />
    </div>
  )
}
