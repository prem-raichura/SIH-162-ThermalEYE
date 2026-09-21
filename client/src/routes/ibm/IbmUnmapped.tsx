import { useMemo } from 'react'
import { MapPinOff, Radar, Ruler } from 'lucide-react'
import { PageHeader } from '@/components/shell/PageHeader'
import { Panel } from '@/components/panels/Panel'
import { ThermalMap } from '@/components/map/ThermalMap'
import { StatTile } from '@/components/panels/StatTile'
import { CoverageCaveat, RankedQueue } from '@/components/panels/RankedQueue'
import { LandCoverDonut } from '@/components/panels/LandCoverDonut'
import { QualityChip } from '@/components/panels/QualityChip'
import { EmptyState } from '@/components/panels/EmptyState'
import { candidateRank, useIbmSites } from './useIbmData'
import { useFilters } from '@/store/useFilters'
import { logLine } from '@/store/useConsole'
import { coord, days, kelvin, nf, shortDate } from '@/lib/format'
import { tHotColor } from '@/lib/thermal'
import type { Role } from '@/lib/roles'
import { useSettingsFor } from '@/store/useRoleSettings'

/**
 * Section 16 discovery, read through a mining lens: bare and built-up ground dominant,
 * distance to the nearest known mine on every card, and the coverage score deciding whether
 * "no mine mapped here" means anything at all.
 */
export function IbmUnmapped({ role }: { role: Role }) {
  const settings = useSettingsFor('ibm')
  const { candidates } = useIbmSites()
  const selectUnmapped = useFilters((s) => s.selectUnmapped)
  const selectedId = useFilters((s) => s.selectedUnmappedId)

  const rows = useMemo(() => candidateRank(candidates), [candidates])
  const selected = useMemo(() => rows.find((r) => r.id === selectedId) ?? rows[0], [rows, selectedId])

  const farFromMines = rows.filter((r) => r.distanceToKnownMineKm > 10).length
  const trustworthy = rows.filter((r) => r.coverageQualityScore >= settings.trustworthyCoverage).length

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        role={role}
        eyebrow="Discovery"
        title="Unmapped candidates"
        description="Persistent heat on mining ground that the directory does not list. The map's gaps are the point, not a defect."
        meta={[
          { label: 'Candidates', value: nf(rows.length) },
          { label: 'Over 10 km from a mine', value: nf(farFromMines) },
          { label: 'Well-mapped area', value: nf(trustworthy) },
        ]}
      />

      <div className="grid gap-3 sm:grid-cols-3">
        <StatTile icon={Radar} label="Candidates" value={nf(rows.length)} caption="Bare or built-up ground dominant" />
        <StatTile
          icon={Ruler}
          label="Far from any mine"
          value={nf(farFromMines)}
          caption="More than 10 km from a listed mine"
          tone="warning"
        />
        <StatTile
          icon={MapPinOff}
          label="Absence is informative"
          value={nf(trustworthy)}
          caption="Coverage quality at or above 0.66"
          tone="good"
        />
      </div>

      <CoverageCaveat />

      <div className="grid gap-3 xl:grid-cols-[1.4fr_1fr]">
        <div className="relative min-h-[460px]">
          <Panel title="Candidate queue" subtitle="Ranked by persistence times retrieved temperature" className="absolute inset-0">
            <RankedQueue
              rows={rows}
              fill
              selectedId={selected?.id ?? null}
              onSelect={(row) => {
                selectUnmapped(row.id)
                logLine(role.id, `Inspecting candidate #${row.rank} — ${row.state}`)
              }}
            />
          </Panel>
        </div>

        <div className="flex min-w-0 flex-col gap-3">
          <ThermalMap role={role} sites={[]} unmapped={rows} shape="square" />

          {selected ? (
            <Panel title={`#${selected.rank} · ${selected.label}`} subtitle={selected.assessment}>
              <p className="text-ink-faint font-mono text-[11px]">{coord(selected.lat, selected.lon)}</p>

              <dl className="divide-line mt-2 divide-y text-[12.5px]">
                {(
                  [
                    ['Retrieved temperature', kelvin(selected.tHot)],
                    ['Persistence', days(selected.persistenceDays)],
                    ['Active days', days(selected.activeDays)],
                    ['Recurrence rate', selected.recurrenceRate.toFixed(2)],
                    ['Distance to known mine', `${selected.distanceToKnownMineKm} km`],
                    ['Register facilities, 5 km', String(selected.registerFacilityCount5km)],
                    ['OSM industrial density, 5 km', String(selected.osmIndustrialDensity5km)],
                    ['Bare / sparse ground', `${selected.landcover.bare}%`],
                    ['Built-up', `${selected.landcover.builtup}%`],
                    ['Last detection', shortDate(selected.lastDetection)],
                  ] as [string, string][]
                ).map(([label, value]) => (
                  <div key={label} className="flex items-baseline justify-between gap-4 py-1.5">
                    <dt className="text-ink-soft">{label}</dt>
                    <dd
                      className="tnum font-mono text-[11.5px]"
                      style={label === 'Retrieved temperature' ? { color: tHotColor(selected.tHot) } : undefined}
                    >
                      {value}
                    </dd>
                  </div>
                ))}
              </dl>

              <div className="border-line mt-3 border-t pt-3">
                <QualityChip label="Coverage quality" score={selected.coverageQualityScore} />
                <p className="text-ink-soft mt-2 text-[12px]">
                  {selected.coverageQualityScore >= settings.trustworthyCoverage
                    ? 'Mapping effort here is high, so the absence of a listed mine is informative.'
                    : 'Mapping effort here is low. Absence of a listed mine says little; the reading rests on the thermal record and the land cover.'}
                </p>
              </div>

              <div className="border-line mt-3 border-t pt-3">
                <LandCoverDonut mix={selected.landcover} height={140} />
              </div>

              <div className="border-line mt-3 border-t pt-3 text-[12px]">
                <p className="font-medium">Sentinel-1 structural evidence</p>
                <p className="text-ink-soft mt-1">
                  {selected.sentinel1Available
                    ? `SAR available at quality ${selected.sarQualityScore.toFixed(2)} — backscatter change distinguishes an active cut from bare rock.`
                    : 'No usable Sentinel-1 pass here. The reading rests on the thermal record and land cover alone.'}
                </p>
              </div>
            </Panel>
          ) : (
            <Panel>
              <EmptyState title="No candidate selected" body="Pick a row to inspect it." />
            </Panel>
          )}
        </div>
      </div>
    </div>
  )
}
