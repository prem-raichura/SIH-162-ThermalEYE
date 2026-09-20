import { Search } from 'lucide-react'
import { RecordListPage } from '@/components/panels/RecordListPage'
import { FilterBar } from '@/components/panels/FilterBar'
import { ColumnChooser } from '@/components/panels/SiteTable'
import { useNrscData } from './useNrscData'
import { useNrsc } from '@/store/useNrsc'
import { useFilters } from '@/store/useFilters'
import { nf } from '@/lib/format'
import type { Role } from '@/lib/roles'

/**
 * The published layer as records. NRSC hands this layer on to other agencies, so every field
 * that travels with a record — identity, verdict, provenance — is a column you can choose.
 */
export function NrscRecords({ role }: { role: Role }) {
  const { filtered, states, classes, counts } = useNrscData()
  const columns = useNrsc((s) => s.columns)
  const setColumns = useNrsc((s) => s.setColumns)
  const search = useFilters((s) => s.search)
  const setSearch = useFilters((s) => s.setSearch)

  return (
    <RecordListPage
      role={role}
      eyebrow="Cross-publication"
      title="Site records"
      description="Every record the pipeline produced — all classes, both branches and the non-thermal controls — with its source and its quality attached."
      sites={filtered}
      columns={columns}
      meta={[
        { label: 'Records', value: nf(filtered.length) },
        { label: 'Register-backed', value: nf(counts.registerBacked) },
        { label: 'OSM only', value: nf(counts.osmOnly) },
        { label: 'Both modalities', value: nf(counts.bothModalities) },
      ]}
      tableAction={<ColumnChooser value={columns} onChange={setColumns} />}
      filters={
        <div className="flex flex-wrap items-center gap-2">
          <FilterBar role={role.id} classes={classes} states={states} />
          <label className="border-line text-ink-soft ml-auto inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-[12px]">
            <Search size={13} strokeWidth={1.8} />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Find a site or operator"
              className="text-ink w-[190px] bg-transparent outline-none"
            />
          </label>
        </div>
      }
      emptyTitle="No records match these filters"
      emptyBody="Clear a class filter or widen the time window to bring records back."
    />
  )
}
