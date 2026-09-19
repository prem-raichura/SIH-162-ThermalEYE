import { PageHeader } from '@/components/shell/PageHeader'
import { Panel } from '@/components/panels/Panel'
import { ThermalMap } from '@/components/map/ThermalMap'
import { SiteTable } from '@/components/panels/SiteTable'
import { SiteCard } from '@/components/panels/SiteCard'
import { EmptyState } from '@/components/panels/EmptyState'
import { SiteDetailDrawer } from '@/components/panels/SiteDetailDrawer'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useCeaSites } from './useCeaData'
import { useFilters } from '@/store/useFilters'
import { logLine } from '@/store/useConsole'
import { siteById } from '@/lib/data'
import { nf } from '@/lib/format'
import { cn } from '@/lib/utils'
import type { Role } from '@/lib/roles'

export function CeaPlants({ role }: { role: Role }) {
  const { filtered, plants, fuels, fuel, setFuel, states } = useCeaSites()
  const selectSite = useFilters((s) => s.selectSite)
  const openDetail = useFilters((s) => s.openDetail)
  const selectedSiteId = useFilters((s) => s.selectedSiteId)
  const state = useFilters((s) => s.state)
  const setState = useFilters((s) => s.setState)
  const selected = siteById(selectedSiteId)

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        role={role}
        eyebrow="Directory"
        title="Power plants"
        description="Thermal stations from the WRI and GEM registers, each carrying capacity, fuel and owner."
        meta={[
          { label: 'In view', value: nf(filtered.length) },
          { label: 'All stations', value: nf(plants.length) },
          { label: 'Abnormal', value: nf(filtered.filter((s) => s.behaviour === 'abnormal').length) },
        ]}
      />

      <Panel bodyClassName="py-2.5">
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => {
              setFuel(null)
              logLine(role.id, 'Fuel filter cleared')
            }}
            className={cn(
              'border-line rounded-full border px-2.5 py-1 text-[12px] transition-colors',
              fuel === null ? 'bg-ink text-paper border-transparent' : 'text-ink-soft hover:text-ink',
            )}
          >
            All fuels
          </button>
          {fuels.map(([name, count]) => (
            <button
              key={name}
              type="button"
              onClick={() => {
                setFuel(name)
                logLine(role.id, `Fuel filter set to ${name}`)
              }}
              className={cn(
                'border-line inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[12px] transition-colors',
                fuel === name ? 'bg-ink text-paper border-transparent' : 'text-ink-soft hover:text-ink',
              )}
            >
              {name}
              <span className="tnum text-[10.5px] opacity-70">{count}</span>
            </button>
          ))}

          <Select
            value={state ?? 'all'}
            onValueChange={(value) => {
              setState(value === 'all' ? null : value)
              logLine(role.id, `State filter set to ${value === 'all' ? 'all states' : value}`)
            }}
          >
            <SelectTrigger className="h-8 w-[168px] rounded-full text-[12px]">
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
        </div>
      </Panel>

      <div className="grid gap-3 xl:grid-cols-[1.4fr_1fr]">
        <div className="relative min-h-[460px]">
          <Panel title="Stations" subtitle="Sort any column. Selecting a row flies the map." className="absolute inset-0">
            <SiteTable
              sites={filtered}
              columns={[
                'name',
                'fuel',
                'capacity',
                'state',
                'operator',
                'frpMean',
                'frpDensity',
                'detections',
                'status',
              ]}
              fill
              selectedId={selectedSiteId}
              onRowClick={(site) => {
                selectSite(site.id)
                logLine(role.id, `Selected ${site.name} — ${site.fuel ?? 'unknown fuel'}, ${site.state}`)
              }}
            />
          </Panel>
        </div>

        <div className="flex min-w-0 flex-col gap-3">
          <ThermalMap role={role} sites={filtered} shape="square" />
          {selected ? (
            <SiteCard site={selected} onOpenDetail={openDetail} />
          ) : (
            <Panel>
              <EmptyState title="Nothing selected yet" body="Pick a station to see its readings here." />
            </Panel>
          )}
        </div>
      </div>

      <SiteDetailDrawer role={role} />
    </div>
  )
}
