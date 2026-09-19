import { useMemo } from 'react'
import { PageHeader } from '@/components/shell/PageHeader'
import { Panel } from '@/components/panels/Panel'
import { ThermalMap } from '@/components/map/ThermalMap'
import { FilterBar } from '@/components/panels/FilterBar'
import { FlareSignature } from '@/components/panels/FlareSignature'
import { SwirPanel } from '@/components/panels/SwirPanel'
import { EmptyState } from '@/components/panels/EmptyState'
import { SiteDetailDrawer } from '@/components/panels/SiteDetailDrawer'
import { PPAC_CLASSES, flareSignature, usePpacSites } from './usePpacData'
import { useFilters } from '@/store/useFilters'
import { logLine } from '@/store/useConsole'
import { siteById } from '@/lib/data'
import { kelvin, nf, sqm } from '@/lib/format'
import { tHotColor } from '@/lib/thermal'
import { cn } from '@/lib/utils'
import type { Role } from '@/lib/roles'

/**
 * The night-restricted thermal profile of section 7.5. Reflected sunlight contaminates the
 * 4 µm channel during the day, so the night-only retrieval is the honest one for flares.
 */
export function PpacFlares({ role }: { role: Role }) {
  const { filtered, states } = usePpacSites()
  const selectSite = useFilters((s) => s.selectSite)
  const selectedSiteId = useFilters((s) => s.selectedSiteId)
  const selected = siteById(selectedSiteId) ?? filtered[0]

  const rows = useMemo(
    () => [...filtered].sort((a, b) => (b.nightTHotMean ?? 0) - (a.nightTHotMean ?? 0)),
    [filtered],
  )

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        role={role}
        eyebrow="Night-restricted profile"
        title="Refineries and flares"
        description="Flares are read from the night-only retrieval, where reflected sunlight cannot contaminate the 4 µm channel."
        meta={[
          { label: 'Sites', value: nf(rows.length) },
          { label: 'Abnormal', value: nf(rows.filter((s) => s.behaviour === 'abnormal').length) },
          { label: 'Saturating', value: nf(rows.filter((s) => s.saturationFraction > 0.2).length) },
        ]}
      />

      <Panel bodyClassName="py-2.5">
        <FilterBar role="ppac" classes={PPAC_CLASSES} states={states} />
      </Panel>

      <div className="grid gap-3 xl:grid-cols-[1.45fr_1fr]">
        <div className="relative min-h-[460px]">
          <Panel
            title="Flare site details"
            subtitle="Night-only retrieval per site — select a row to inspect the signature"
            className="absolute inset-0"
          >
            <div className="panel-scroll h-full min-h-[260px] flex-1 overflow-auto overscroll-contain">
              <table className="w-full min-w-[560px] text-[12.5px]">
                <thead className="text-ink-faint sticky top-0 z-10 text-[10.5px] [&_th]:bg-card [&_th]:border-line [&_th]:border-b">
                  <tr>
                    <th className="py-2 pr-3 text-left font-normal">Site</th>
                    <th className="px-3 py-2 text-right font-normal">night_t_hot_mean</th>
                    <th className="px-3 py-2 text-right font-normal">source_area_mean</th>
                    <th className="px-3 py-2 text-right font-normal">saturation_fraction</th>
                    <th className="px-3 py-2 text-right font-normal">Stacks</th>
                    <th className="py-2 pl-3 text-left font-normal">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-line divide-y">
                  {rows.map((site) => (
                    <tr
                      key={site.id}
                      onClick={() => {
                        selectSite(site.id)
                        logLine(role.id, `Inspecting ${site.name} — night profile`)
                      }}
                      className={cn(
                        'hover:bg-paper-deep cursor-pointer',
                        selected?.id === site.id && 'bg-paper-deep',
                      )}
                    >
                      <td className="max-w-[220px] truncate py-2 pr-3">{site.name}</td>
                      <td
                        className="tnum px-3 py-2 text-right font-mono text-[11.5px]"
                        style={{ color: tHotColor(site.nightTHotMean) }}
                      >
                        {kelvin(site.nightTHotMean)}
                      </td>
                      <td className="tnum px-3 py-2 text-right font-mono text-[11.5px]">{sqm(site.sourceAreaM2)}</td>
                      <td className="tnum px-3 py-2 text-right font-mono text-[11.5px]">
                        {site.saturationFraction.toFixed(3)}
                      </td>
                      <td className="tnum px-3 py-2 text-right font-mono text-[11.5px]">{site.flareStacks ?? '—'}</td>
                      <td className="py-2 pl-3">
                        <span className="inline-flex items-center gap-1.5">
                          <span
                            className="h-2 w-2 rounded-full"
                            style={{
                              backgroundColor:
                                site.behaviour === 'abnormal' ? 'var(--color-terracotta)' : 'var(--color-forest)',
                            }}
                          />
                          {site.behaviour === 'abnormal' ? 'Abnormal' : 'Normal'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Panel>
        </div>

        <div className="flex min-w-0 flex-col gap-3">
          <ThermalMap role={role} sites={filtered} shape="square" />

          {selected ? (
            <>
              <Panel title="Why this reads as a flare" subtitle="Section 7.5 signature, checked against the retrieval">
                <FlareSignature checks={flareSignature(selected)} siteName={selected.name} />
              </Panel>
              <Panel title="Sentinel-2 SWIR" subtitle="Hot units resolved inside the coarse thermal pixel">
                <SwirPanel siteId={selected.id} siteName={selected.name} />
              </Panel>
            </>
          ) : (
            <Panel>
              <EmptyState title="No site selected" body="Pick a row to see why it reads as a flare." />
            </Panel>
          )}
        </div>
      </div>

      <SiteDetailDrawer role={role} />
    </div>
  )
}
