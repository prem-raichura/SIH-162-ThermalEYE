import { useMemo } from 'react'
import { PageHeader } from '@/components/shell/PageHeader'
import { Panel } from '@/components/panels/Panel'
import { ThermalMap } from '@/components/map/ThermalMap'
import { SiteCard } from '@/components/panels/SiteCard'
import { SpectralIndexChart } from '@/components/panels/SpectralIndexChart'
import { EmptyState } from '@/components/panels/EmptyState'
import { SiteDetailDrawer } from '@/components/panels/SiteDetailDrawer'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useFsiSites } from './useFsiData'
import { useFilters } from '@/store/useFilters'
import { logLine } from '@/store/useConsole'
import { landcover, siteById } from '@/lib/data'
import { kelvin, nf, shortDate } from '@/lib/format'
import { tHotColor } from '@/lib/thermal'
import { cn } from '@/lib/utils'
import type { SourceClass } from '@/lib/types'
import type { Role } from '@/lib/roles'

/**
 * Event land-cover context (section 12). Forest and cropland percentages sit on every row,
 * because what burned is the first question after how hot it was.
 */
export function FsiEvents({
  role,
  cls,
  title,
  eyebrow,
  description,
}: {
  role: Role
  cls: SourceClass
  title: string
  eyebrow: string
  description: string
}) {
  const { filtered, states } = useFsiSites()
  const selectSite = useFilters((s) => s.selectSite)
  const openDetail = useFilters((s) => s.openDetail)
  const selectedSiteId = useFilters((s) => s.selectedSiteId)
  const state = useFilters((s) => s.state)
  const setState = useFilters((s) => s.setState)

  const rows = useMemo(
    () =>
      filtered
        .filter((s) => s.predictedClass === cls)
        .map((s) => ({ site: s, mix: landcover[s.id] }))
        .sort((a, b) => (b.site.lastDetection ?? '').localeCompare(a.site.lastDetection ?? '')),
    [filtered, cls],
  )

  const selected = siteById(selectedSiteId) ?? rows[0]?.site

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        role={role}
        eyebrow={eyebrow}
        title={title}
        description={description}
        meta={[
          { label: 'Events', value: nf(rows.length) },
          {
            label: 'Mean ΔT',
            value: `${nf(rows.reduce((a, r) => a + (r.site.deltaT ?? 0), 0) / Math.max(rows.length, 1), 1)} K`,
          },
        ]}
      />

      <Panel bodyClassName="py-2.5">
        <Select
          value={state ?? 'all'}
          onValueChange={(value) => {
            setState(value === 'all' ? null : value)
            logLine(role.id, `State filter set to ${value === 'all' ? 'all states' : value}`)
          }}
        >
          <SelectTrigger className="h-8 w-[180px] rounded-full text-[12px]">
            <SelectValue placeholder="All states" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All states</SelectItem>
            {states.map((s) => (
              <SelectItem key={s} value={s}>
                {s}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Panel>

      <div className="grid gap-3 xl:grid-cols-[1.45fr_1fr]">
        <div className="relative min-h-[460px]">
          <Panel title="Event land cover context" subtitle="What burned, from WorldCover" className="absolute inset-0">
            <div className="panel-scroll h-full min-h-[260px] flex-1 overflow-auto overscroll-contain">
              <table className="w-full min-w-[680px] text-[12.5px]">
                <thead className="text-ink-faint sticky top-0 z-10 text-[10.5px] [&_th]:bg-card [&_th]:border-line [&_th]:border-b">
                  <tr>
                    <th className="py-2 pr-3 text-left font-normal">Event</th>
                    <th className="px-3 py-2 text-left font-normal">State</th>
                    <th className="px-3 py-2 text-right font-normal">Forest %</th>
                    <th className="px-3 py-2 text-right font-normal">Cropland %</th>
                    <th className="px-3 py-2 text-right font-normal">T_hot</th>
                    <th className="px-3 py-2 text-right font-normal">ΔT</th>
                    <th className="py-2 pl-3 text-right font-normal">Last seen</th>
                  </tr>
                </thead>
                <tbody className="divide-line divide-y">
                  {rows.map(({ site, mix }) => (
                    <tr
                      key={site.id}
                      onClick={() => {
                        selectSite(site.id)
                        logLine(role.id, `Selected ${site.name} — ${site.state}`)
                      }}
                      className={cn('hover:bg-paper-deep cursor-pointer', selected?.id === site.id && 'bg-paper-deep')}
                    >
                      <td className="max-w-[230px] truncate py-2 pr-3">{site.name}</td>
                      <td className="px-3 py-2">{site.state}</td>
                      <td className="tnum px-3 py-2 text-right font-mono text-[11.5px]">{mix ? `${mix.forest}%` : '—'}</td>
                      <td className="tnum px-3 py-2 text-right font-mono text-[11.5px]">
                        {mix ? `${mix.cropland}%` : '—'}
                      </td>
                      <td
                        className="tnum px-3 py-2 text-right font-mono text-[11.5px]"
                        style={{ color: tHotColor(site.tHot) }}
                      >
                        {kelvin(site.tHot)}
                      </td>
                      <td className="tnum px-3 py-2 text-right font-mono text-[11.5px]">{site.deltaT} K</td>
                      <td className="tnum py-2 pl-3 text-right font-mono text-[11.5px]">
                        {shortDate(site.lastDetection)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Panel>
        </div>

        <div className="flex min-w-0 flex-col gap-3">
          <ThermalMap
            role={role}
            sites={rows.map((r) => r.site)}
            controls="below"
            availableLayers={['thermal', 'sites', 'landcover', 'districts']}
          />
          {selected ? (
            <>
              <SiteCard site={selected} onOpenDetail={openDetail} />
              <Panel title="Burn corroboration" subtitle="Sentinel-2 indices before and after">
                <SpectralIndexChart siteId={selected.id} height={170} />
              </Panel>
            </>
          ) : (
            <Panel>
              <EmptyState title="No events here" body="Widen the state filter or the time window." />
            </Panel>
          )}
        </div>
      </div>

      <SiteDetailDrawer role={role} />
    </div>
  )
}

export function FsiForest({ role }: { role: Role }) {
  return (
    <FsiEvents
      role={role}
      cls="forest_fire"
      eyebrow="Forest"
      title="Forest fires"
      description="Broad, cooler burns over forest cover — the class the national fire feed exists to serve."
    />
  )
}

export function FsiCrop({ role }: { role: Role }) {
  return (
    <FsiEvents
      role={role}
      cls="crop_burning"
      eyebrow="Agriculture"
      title="Crop burning"
      description="Residue burning over cropland, concentrated in the post-harvest weeks."
    />
  )
}
