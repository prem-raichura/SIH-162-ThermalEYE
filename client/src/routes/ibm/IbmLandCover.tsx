import { useMemo } from 'react'
import { PageHeader } from '@/components/shell/PageHeader'
import { Panel } from '@/components/panels/Panel'
import { DistributionDonut } from '@/components/panels/DistributionDonut'
import { SiteDetailDrawer } from '@/components/panels/SiteDetailDrawer'
import { useIbmSites } from './useIbmData'
import { useFilters } from '@/store/useFilters'
import { landcover } from '@/lib/data'
import { LANDCOVER_COLORS, LANDCOVER_LABEL } from '@/lib/chart'
import { nf } from '@/lib/format'
import { cn } from '@/lib/utils'
import type { Role } from '@/lib/roles'

/** Section 12 — WorldCover context. Mining ground reads as bare or sparse, which is what
 *  separates an active cut from a kiln sitting in cropland. */
export function IbmLandCover({ role }: { role: Role }) {
  const { filtered, cover } = useIbmSites()
  const selectSite = useFilters((s) => s.selectSite)
  const selectedSiteId = useFilters((s) => s.selectedSiteId)

  const slices = useMemo(
    () =>
      [
        { label: LANDCOVER_LABEL.forest, value: cover.forest, color: LANDCOVER_COLORS.forest },
        { label: LANDCOVER_LABEL.cropland, value: cover.cropland, color: LANDCOVER_COLORS.cropland },
        { label: LANDCOVER_LABEL.builtup, value: cover.builtup, color: LANDCOVER_COLORS.builtup },
        { label: LANDCOVER_LABEL.water, value: cover.water, color: LANDCOVER_COLORS.water },
        {
          label: LANDCOVER_LABEL.other,
          value: Math.round((cover.bare + cover.grass) * 10) / 10,
          color: LANDCOVER_COLORS.other,
        },
      ].filter((s) => s.value > 0),
    [cover],
  )

  // The centre reads the dominant slice, so it can never disagree with the legend beside it.
  const dominant = useMemo(() => slices.reduce((a, b) => (b.value > a.value ? b : a), slices[0]), [slices])

  const rows = useMemo(
    () =>
      filtered
        .map((s) => ({ site: s, mix: landcover[s.id] }))
        .filter((r) => r.mix)
        .sort((a, b) => b.mix.bare - a.mix.bare),
    [filtered],
  )

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        role={role}
        eyebrow="Context"
        title="Land cover analysis"
        description="What each mine site sits on, so bare ground and spoil can be told apart from cropland and forest."
        meta={[
          { label: 'Sites', value: nf(filtered.length) },
          { label: 'Mean bare / sparse', value: `${cover.bare}%` },
          { label: 'Mean built-up', value: `${cover.builtup}%` },
        ]}
      />

      <div className="grid gap-3 lg:grid-cols-2">
        <Panel title="Mining sites, averaged" subtitle="Mean WorldCover mix across the sites in view">
          <DistributionDonut
            slices={slices}
            centerLabel={dominant.label.toLowerCase()}
            centerValue={`${Math.round(dominant.value)}%`}
            unit="%"
          />
          <p className="text-ink-faint mt-3 text-[11px]">
            ESA WorldCover 10 m v200, 2021. Pits expand; a cut opened since then still reads as whatever was there
            before, which is one reason land cover supports the thermal evidence rather than leading it.
          </p>
        </Panel>

        <Panel title="Why this matters here" subtitle="Land cover as corroboration, never as the verdict">
          <div className="text-ink-soft space-y-2 text-[12.5px]">
            <p>
              A persistent hot source on bare or sparse ground with no vegetation to burn is hard to explain as a crop
              or forest fire. That is the corroboration land cover offers.
            </p>
            <p>
              It cannot do the opposite job. Cropland around a source does not make it agricultural — brick kilns sit
              in fields across the Indo-Gangetic plain, and their retrieved temperature separates them from stubble
              burning regardless of what the map underneath says.
            </p>
            <p className="text-ink">
              The thermal retrieval leads; WorldCover, OSM and the registers agree or disagree with it.
            </p>
          </div>
        </Panel>
      </div>

      <Panel title="Per-site cover" subtitle="Sorted by bare and sparse ground">
        <div className="panel-scroll max-h-[420px] overflow-auto overscroll-contain">
          <table className="w-full min-w-[620px] text-[12.5px]">
            <thead className="text-ink-faint sticky top-0 z-10 text-[10.5px] [&_th]:bg-card [&_th]:border-line [&_th]:border-b">
              <tr>
                <th className="py-2 pr-3 text-left font-normal">Site</th>
                <th className="px-3 py-2 text-left font-normal">State</th>
                <th className="px-3 py-2 text-right font-normal">Bare / sparse</th>
                <th className="px-3 py-2 text-right font-normal">Built-up</th>
                <th className="px-3 py-2 text-right font-normal">Cropland</th>
                <th className="px-3 py-2 text-right font-normal">Forest</th>
                <th className="py-2 pl-3 text-right font-normal">Persistence</th>
              </tr>
            </thead>
            <tbody className="divide-line divide-y">
              {rows.map(({ site, mix }) => (
                <tr
                  key={site.id}
                  onClick={() => {
                    selectSite(site.id)
                  }}
                  className={cn('hover:bg-paper-deep cursor-pointer', selectedSiteId === site.id && 'bg-paper-deep')}
                >
                  <td className="max-w-[220px] truncate py-2 pr-3">{site.name}</td>
                  <td className="px-3 py-2">{site.state}</td>
                  <td className="tnum px-3 py-2 text-right font-mono text-[11.5px]">{mix.bare}%</td>
                  <td className="tnum px-3 py-2 text-right font-mono text-[11.5px]">{mix.builtup}%</td>
                  <td className="tnum px-3 py-2 text-right font-mono text-[11.5px]">{mix.cropland}%</td>
                  <td className="tnum px-3 py-2 text-right font-mono text-[11.5px]">{mix.forest}%</td>
                  <td className="tnum py-2 pl-3 text-right font-mono text-[11.5px]">{site.persistenceDays} d</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>

      <SiteDetailDrawer />
    </div>
  )
}
