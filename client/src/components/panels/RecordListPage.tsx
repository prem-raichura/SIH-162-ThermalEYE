import type { ReactNode } from 'react'
import { PageHeader } from '@/components/shell/PageHeader'
import { Panel } from '@/components/panels/Panel'
import { SiteTable, type ColumnId } from '@/components/panels/SiteTable'
import { SiteCard } from '@/components/panels/SiteCard'
import { EmptyState } from '@/components/panels/EmptyState'
import { SiteDetailDrawer } from '@/components/panels/SiteDetailDrawer'
import { useFilters } from '@/store/useFilters'
import { logLine } from '@/store/useConsole'
import { siteById } from '@/lib/data'
import { nf } from '@/lib/format'
import type { MetaItem } from '@/components/shell/PageHeader'
import type { ThermalSite } from '@/lib/types'
import type { Role } from '@/lib/roles'

/**
 * The records behind a map console, as text.
 *
 * The console itself is for reading the country at a glance and picking a point off it; this
 * is the other half of that — every row the map is drawing, sortable, searchable and legible
 * to a screen reader. Each map console's accessible name points here by name.
 */
export function RecordListPage({
  role,
  eyebrow,
  title,
  description,
  sites,
  columns,
  meta,
  filters,
  tableAction,
  emptyTitle,
  emptyBody,
}: {
  role: Role
  eyebrow: string
  title: string
  description: string
  sites: ThermalSite[]
  columns: ColumnId[]
  meta?: MetaItem[]
  /** A filter row above the table, for the roles that carry one. */
  filters?: ReactNode
  /** Goes in the table panel's header — the column chooser, typically. */
  tableAction?: ReactNode
  emptyTitle?: string
  emptyBody?: string
}) {
  const selectSite = useFilters((s) => s.selectSite)
  const openDetail = useFilters((s) => s.openDetail)
  const selectedSiteId = useFilters((s) => s.selectedSiteId)
  const selected = siteById(selectedSiteId)

  return (
    <div className="flex flex-col gap-4">
      <PageHeader role={role} eyebrow={eyebrow} title={title} description={description} meta={meta} />

      {filters}

      <div className="grid gap-3 xl:grid-cols-[2.2fr_1fr]">
        <div className="relative min-h-[520px]">
          <Panel
            title={title}
            subtitle={`${nf(sites.length)} records · sort any column`}
            action={tableAction}
            className="absolute inset-0"
          >
            <SiteTable
              sites={sites}
              columns={columns}
              fill
              selectedId={selectedSiteId}
              emptyTitle={emptyTitle}
              emptyBody={emptyBody}
              onRowClick={(site) => {
                selectSite(site.id)
                logLine(role.id, `Selected ${site.name} — ${site.predictedLabel}, ${site.state}`)
              }}
            />
          </Panel>
        </div>

        <Panel title="Selected record">
          {selected ? (
            <SiteCard site={selected} onOpenDetail={openDetail} />
          ) : (
            <EmptyState
              title="Nothing selected yet"
              body="Pick a row to see its readings here. The full record opens from the card."
            />
          )}
        </Panel>
      </div>

      <SiteDetailDrawer role={role} />
    </div>
  )
}
