import { useMemo } from 'react'
import { PageHeader } from '@/components/shell/PageHeader'
import { Panel } from '@/components/panels/Panel'
import { ThermalMap } from '@/components/map/ThermalMap'
import { SiteCard } from '@/components/panels/SiteCard'
import { SarEvidence } from '@/components/panels/SarEvidence'
import { EmptyState } from '@/components/panels/EmptyState'
import { SiteDetailDrawer } from '@/components/panels/SiteDetailDrawer'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { SUBTYPE_NOTE, fireSubtype, useIbmSites } from './useIbmData'
import { useFilters } from '@/store/useFilters'
import { logLine } from '@/store/useConsole'
import { siteById } from '@/lib/data'
import { days, nf, shortDate } from '@/lib/format'
import { tHotColor } from '@/lib/thermal'
import { cn } from '@/lib/utils'
import type { Role } from '@/lib/roles'

const SUBTYPE_TONE: Record<string, { bg: string; fg: string }> = {
  'coal-seam-like': { bg: 'var(--color-terra-dim)', fg: 'var(--color-terracotta)' },
  'waste-dump-like': { bg: 'var(--color-amber-dim)', fg: 'var(--color-amber)' },
  episodic: { bg: 'var(--color-paper-deep)', fg: 'var(--color-ink-soft)' },
}

/** Section 8 — persistence, recurrence and inter-event time, which is what separates a
 *  burning seam from a truck that was hot once. */
export function IbmSites({ role }: { role: Role }) {
  const { filtered, mines, states } = useIbmSites()
  const selectSite = useFilters((s) => s.selectSite)
  const openDetail = useFilters((s) => s.openDetail)
  const selectedSiteId = useFilters((s) => s.selectedSiteId)
  const state = useFilters((s) => s.state)
  const setState = useFilters((s) => s.setState)
  const selected = siteById(selectedSiteId)

  const rows = useMemo(() => [...filtered].sort((a, b) => b.persistenceDays - a.persistenceDays), [filtered])

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        role={role}
        eyebrow="Persistence"
        title="Mining sites"
        description="How long each source has burned, how often it returns, and what that pattern reads as."
        meta={[
          { label: 'In view', value: nf(rows.length) },
          { label: 'All mine sites', value: nf(mines.length) },
          { label: 'Seam-like', value: nf(rows.filter((s) => fireSubtype(s) === 'coal-seam-like').length) },
        ]}
      />

      <Panel bodyClassName="py-2.5">
        <div className="flex flex-wrap items-center gap-3">
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
          <p className="text-ink-faint max-w-[74ch] text-[11.5px]">{SUBTYPE_NOTE}</p>
        </div>
      </Panel>

      <div className="grid gap-3 xl:grid-cols-[1.45fr_1fr]">
        <div className="relative min-h-[460px]">
          <Panel title="Persistence analysis" subtitle="Select a row to inspect the site" className="absolute inset-0">
            <div className="panel-scroll h-full min-h-[260px] flex-1 overflow-auto overscroll-contain">
              <table className="w-full min-w-[780px] text-[12.5px]">
                <thead className="text-ink-faint sticky top-0 z-10 text-[10.5px] [&_th]:bg-card [&_th]:border-line [&_th]:border-b">
                  <tr>
                    <th className="w-8 py-2 pr-3 text-left font-normal">#</th>
                    <th className="py-2 pr-3 text-left font-normal">Site</th>
                    <th className="px-3 py-2 text-left font-normal">State</th>
                    <th className="px-3 py-2 text-right font-normal">Persistence</th>
                    <th className="px-3 py-2 text-right font-normal">Recurrence</th>
                    <th className="px-3 py-2 text-right font-normal">Active days</th>
                    <th className="px-3 py-2 text-right font-normal">Last seen</th>
                    <th className="py-2 pl-3 text-left font-normal">Reads as</th>
                  </tr>
                </thead>
                <tbody className="divide-line divide-y">
                  {rows.map((site, i) => {
                    const subtype = fireSubtype(site)
                    return (
                      <tr
                        key={site.id}
                        onClick={() => {
                          selectSite(site.id)
                          logLine(role.id, `Selected ${site.name} — ${subtype}`)
                        }}
                        className={cn('hover:bg-paper-deep cursor-pointer', selectedSiteId === site.id && 'bg-paper-deep')}
                      >
                        <td className="tnum py-2 pr-3 font-mono text-[11px]">{i + 1}</td>
                        <td className="max-w-[200px] truncate py-2 pr-3">{site.name}</td>
                        <td className="px-3 py-2">{site.state}</td>
                        <td
                          className="tnum px-3 py-2 text-right font-mono text-[11.5px]"
                          style={{ color: tHotColor(site.tHot) }}
                        >
                          {days(site.persistenceDays)}
                        </td>
                        <td className="tnum px-3 py-2 text-right font-mono text-[11.5px]">
                          {site.recurrenceRate.toFixed(3)}
                        </td>
                        <td className="tnum px-3 py-2 text-right font-mono text-[11.5px]">{days(site.activeDays)}</td>
                        <td className="tnum px-3 py-2 text-right font-mono text-[11.5px]">
                          {shortDate(site.lastDetection)}
                        </td>
                        <td className="py-2 pl-3">
                          <span
                            className="rounded-full px-2 py-0.5 text-[10.5px] whitespace-nowrap"
                            style={{ backgroundColor: SUBTYPE_TONE[subtype].bg, color: SUBTYPE_TONE[subtype].fg }}
                          >
                            {subtype}
                          </span>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </Panel>
        </div>

        <div className="flex min-w-0 flex-col gap-3">
          <ThermalMap role={role} sites={filtered} shape="square" />
          {selected ? (
            <>
              <SiteCard site={selected} onOpenDetail={openDetail} />
              <Panel title="Sentinel-1 structural evidence" subtitle="What the surface is doing, not how hot it is">
                <SarEvidence siteId={selected.id} />
              </Panel>
            </>
          ) : (
            <Panel>
              <EmptyState title="Nothing selected yet" body="Pick a site to see its readings and SAR evidence." />
            </Panel>
          )}
        </div>
      </div>

      <SiteDetailDrawer role={role} />
    </div>
  )
}
