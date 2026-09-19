import { useMemo } from 'react'
import { PageHeader } from '@/components/shell/PageHeader'
import { Panel } from '@/components/panels/Panel'
import { SiteTable } from '@/components/panels/SiteTable'
import { SpectralIndexChart } from '@/components/panels/SpectralIndexChart'
import { LandCoverDonut } from '@/components/panels/LandCoverDonut'
import { EmptyState } from '@/components/panels/EmptyState'
import { SiteDetailDrawer } from '@/components/panels/SiteDetailDrawer'
import { useFsiSites } from './useFsiData'
import { useFilters } from '@/store/useFilters'
import { logLine } from '@/store/useConsole'
import { siteById } from '@/lib/data'
import { nf } from '@/lib/format'
import type { Role } from '@/lib/roles'

/** Section 9 — optical change as burn corroboration, with its quality metadata attached. */
export function FsiVegetation({ role }: { role: Role }) {
  const { filtered } = useFsiSites()
  const selectSite = useFilters((s) => s.selectSite)
  const selectedSiteId = useFilters((s) => s.selectedSiteId)

  const rows = useMemo(() => [...filtered].sort((a, b) => b.frpPeak - a.frpPeak), [filtered])
  const site = siteById(selectedSiteId) ?? rows[0]
  const withOptical = filtered.filter((s) => s.sentinel2Available).length

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        role={role}
        eyebrow="Damage"
        title="Vegetation analysis"
        description="Before and after spectral change, with cloud fraction and acquisition gap travelling alongside every reading."
        meta={[
          { label: 'Events', value: nf(rows.length) },
          { label: 'With clear optical', value: `${nf(withOptical)} / ${nf(filtered.length)}` },
        ]}
      />

      <div className="grid gap-3 xl:grid-cols-[1fr_1.3fr]">
        <div className="relative min-h-[420px]">
          <Panel title="Events" subtitle="Strongest peak FRP first" className="absolute inset-0">
            <SiteTable
              sites={rows}
              columns={['name', 'class', 'state', 'frpPeak', 'lastDetection']}
              fill
              selectedId={site?.id ?? null}
              onRowClick={(s) => {
                selectSite(s.id)
                logLine(role.id, `Vegetation analysis opened for ${s.name}`)
              }}
            />
          </Panel>
        </div>

        <div className="flex min-w-0 flex-col gap-3">
          {site ? (
            <>
              <Panel
                title={`ΔNDVI / ΔNBR / ΔNDMI — ${site.name}`}
                subtitle="Sentinel-2 L2A, monthly composite across the year"
              >
                <SpectralIndexChart siteId={site.id} height={230} />
              </Panel>
              <Panel title="Land cover at the event">
                <LandCoverDonut siteId={site.id} height={150} />
              </Panel>
            </>
          ) : (
            <Panel>
              <EmptyState title="No event selected" body="Pick an event to see its spectral change." />
            </Panel>
          )}
        </div>
      </div>

      <Panel title="How to read a missing scene">
        <div className="text-ink-soft space-y-2 text-[12.5px]">
          <p>
            Sentinel-2 revisits every five days and sees nothing through cloud, so a burn during the monsoon frequently
            has no usable acquisition at all. Where that happens the panel says so rather than drawing a flat line.
          </p>
          <p className="text-ink">
            A missing optical scene weakens the corroboration; it does not weaken the detection. The thermal record and
            the temporal behaviour stand on their own.
          </p>
        </div>
      </Panel>

      <SiteDetailDrawer role={role} />
    </div>
  )
}
