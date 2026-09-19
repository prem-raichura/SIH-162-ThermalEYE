import { useMemo } from 'react'
import { PageHeader } from '@/components/shell/PageHeader'
import { Panel } from '@/components/panels/Panel'
import { ThermalMap } from '@/components/map/ThermalMap'
import { CoverageCaveat, RankedQueue } from '@/components/panels/RankedQueue'
import { LandCoverDonut } from '@/components/panels/LandCoverDonut'
import { QualityChip } from '@/components/panels/QualityChip'
import { StatTile } from '@/components/panels/StatTile'
import { useUnmappedQueue } from './useCpcbData'
import { useFilters } from '@/store/useFilters'
import { logLine } from '@/store/useConsole'
import { tHotColor } from '@/lib/thermal'
import { coord, days, kelvin, nf, shortDate } from '@/lib/format'
import { Radar, ShieldQuestion, Thermometer } from 'lucide-react'
import type { Role } from '@/lib/roles'

/**
 * The role's headline output (section 16). A candidate is never called industrial outright —
 * it is a Persistent Unmapped Thermal Source with an assessment attached.
 */
export function CpcbUnmapped({ role }: { role: Role }) {
  const rows = useUnmappedQueue()
  const selectUnmapped = useFilters((s) => s.selectUnmapped)
  const selectedId = useFilters((s) => s.selectedUnmappedId)
  const selected = useMemo(() => rows.find((r) => r.id === selectedId) ?? rows[0], [rows, selectedId])

  const industrialLike = rows.filter((r) => r.assessment === 'industrial-like').length
  const trustworthy = rows.filter((r) => r.coverageQualityScore >= 0.66).length
  const hottest = rows.reduce((a, r) => Math.max(a, r.tHot), 0)

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        role={role}
        eyebrow="Discovery"
        title="Persistent unmapped thermal sources"
        description="Sites that keep burning where no register lists a facility. Ranked by persistence times retrieved temperature."
        meta={[
          { label: 'Candidates', value: nf(rows.length) },
          { label: 'Industrial-like', value: nf(industrialLike) },
          { label: 'Well-mapped area', value: nf(trustworthy) },
        ]}
      />

      <div className="grid gap-3 sm:grid-cols-3">
        <StatTile icon={Radar} label="Candidates in queue" value={nf(rows.length)} caption="No facility within 1 km" />
        <StatTile
          icon={ShieldQuestion}
          label="Assessed industrial-like"
          value={nf(industrialLike)}
          caption="Thermal signature matches industrial sources"
          tone="warning"
        />
        <StatTile
          icon={Thermometer}
          label="Hottest candidate"
          value={nf(hottest)}
          unit="K"
          caption="Retrieved source temperature"
          tone="critical"
        />
      </div>

      <CoverageCaveat />

      <div className="grid gap-3 xl:grid-cols-[1.4fr_1fr]">
        <div className="relative min-h-[460px]">
          <Panel title="Candidate queue" subtitle="Select a row to inspect it" className="absolute inset-0">
            <RankedQueue
              rows={rows}
              fill
              selectedId={selected?.id ?? null}
              onSelect={(row) => {
                selectUnmapped(row.id)
                logLine(role.id, `Inspecting unmapped candidate #${row.rank} — ${row.state}`)
              }}
            />
          </Panel>
        </div>

        <div className="flex min-w-0 flex-col gap-3">
          <ThermalMap role={role} sites={[]} unmapped={rows} shape="square" />

          {selected && (
            <Panel title={`#${selected.rank} · ${selected.label}`} subtitle={selected.assessment}>
              <p className="text-ink-faint font-mono text-[11px]">{coord(selected.lat, selected.lon)}</p>

              <dl className="divide-line mt-2 divide-y text-[12.5px]">
                {(
                  [
                    ['Retrieved temperature', kelvin(selected.tHot)],
                    ['Dual-band contrast ΔT', `${selected.deltaT} K`],
                    ['FRP density', `${selected.frpDensity} MW/km²`],
                    ['Persistence', days(selected.persistenceDays)],
                    ['Active days', days(selected.activeDays)],
                    ['Night ratio', selected.nightRatio.toFixed(2)],
                    ['Nearest mapped facility', `${selected.nearestFacilityKm} km`],
                    ['Register facilities, 5 km', String(selected.registerFacilityCount5km)],
                    ['OSM industrial density, 5 km', String(selected.osmIndustrialDensity5km)],
                    ['First detection', shortDate(selected.firstDetection)],
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
                  {selected.coverageQualityScore >= 0.66
                    ? 'Mapping effort here is high, so the absence of a facility is informative.'
                    : 'Mapping effort here is low, so absence of a facility carries little information. The assessment rests on thermal physics and temporal behaviour alone.'}
                </p>
              </div>

              <div className="border-line mt-3 border-t pt-3">
                <LandCoverDonut mix={selected.landcover} height={140} />
              </div>
            </Panel>
          )}
        </div>
      </div>
    </div>
  )
}
