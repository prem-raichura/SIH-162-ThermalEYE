import { useMemo } from 'react'
import { PageHeader } from '@/components/shell/PageHeader'
import { ThermalMap } from '@/components/map/ThermalMap'
import type { Role } from '@/lib/roles'
import { sites as allSites } from '@/lib/data'
import { istClock, istDate, nf } from '@/lib/format'

/**
 * Stand-in for sections whose dashboards are built in the role plans (07-14). The overview
 * of every role already runs the real map so the engine is exercised everywhere.
 */
export function SectionScaffold({
  role,
  section,
  note,
  withMap,
}: {
  role: Role
  section: string
  note: string
  withMap: boolean
}) {
  const sites = useMemo(
    () => (role.classFilter === 'all' ? allSites : allSites.filter((s) => role.classFilter.includes(s.class))),
    [role],
  )

  return (
    <div className="flex h-full flex-col gap-4">
      <PageHeader
        role={role}
        eyebrow={role.short}
        title={section}
        description={role.remit}
        meta={[
          { label: 'Date', value: istDate() },
          { label: 'Time (IST)', value: istClock() },
          { label: 'Sites in view', value: nf(sites.length) },
        ]}
        action="Generate report"
      />

      {withMap ? (
        <ThermalMap role={role} sites={sites} className="min-h-[520px] flex-1" />
      ) : (
        <section className="bg-card border-line rounded-[14px] border px-6 py-10 text-center">
          <p className="text-ink-soft mx-auto max-w-[56ch] text-[13.5px]">{note}</p>
        </section>
      )}
    </div>
  )
}
