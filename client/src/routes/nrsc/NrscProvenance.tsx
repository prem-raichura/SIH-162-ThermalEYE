import { Database, Globe2, RotateCcw, ScanLine } from 'lucide-react'
import { PageHeader } from '@/components/shell/PageHeader'
import { Panel } from '@/components/panels/Panel'
import { StatTile } from '@/components/panels/StatTile'
import { ProvenanceTable } from '@/components/panels/ProvenanceTable'
import { SiteDetailDrawer } from '@/components/panels/SiteDetailDrawer'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useNrscData } from './useNrscData'
import { useNrsc, type Availability } from '@/store/useNrsc'
import { useFilters } from '@/store/useFilters'
import { logLine } from '@/store/useConsole'
import { nf, pctRaw } from '@/lib/format'
import type { DataQuality, MatchConfidence, RegisterSource } from '@/lib/types'
import type { Role } from '@/lib/roles'

const REGISTERS: { value: RegisterSource | 'all'; label: string }[] = [
  { value: 'all', label: 'Any register' },
  { value: 'osm', label: 'OpenStreetMap' },
  { value: 'ppac', label: 'PPAC' },
  { value: 'wri', label: 'WRI' },
  { value: 'gem', label: 'GEM' },
  { value: 'cea', label: 'CEA' },
  { value: 'none', label: 'No register' },
]

const MATCHES: { value: MatchConfidence | 'all'; label: string }[] = [
  { value: 'all', label: 'Any match' },
  { value: 'high', label: 'High' },
  { value: 'medium', label: 'Medium' },
  { value: 'low', label: 'Low' },
]

const QUALITIES: { value: DataQuality | 'all'; label: string }[] = [
  { value: 'all', label: 'Any FIRMS quality' },
  { value: 'standard', label: 'Standard' },
  { value: 'nrt', label: 'NRT' },
]

const AVAILABILITY: { value: Availability; label: string }[] = [
  { value: 'any', label: 'Any' },
  { value: 'yes', label: 'Available' },
  { value: 'no', label: 'Unavailable' },
]

/** Section 20: every published record states where it came from and how good the evidence is. */
export function NrscProvenance({ role }: { role: Role }) {
  const { filtered, published, counts } = useNrscData()
  const provenance = useNrsc((s) => s.provenance)
  const setProvenance = useNrsc((s) => s.setProvenance)
  const resetProvenance = useNrsc((s) => s.resetProvenance)
  const selectSite = useFilters((s) => s.selectSite)
  const openDetail = useFilters((s) => s.openDetail)
  const selectedSiteId = useFilters((s) => s.selectedSiteId)

  const share = (n: number) => (filtered.length === 0 ? 0 : Math.round((n / filtered.length) * 100))

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        role={role}
        eyebrow="Section 20"
        title="Provenance"
        description="One row per record: the register it joined to, how confident that join was, and what satellite evidence was actually available at the time."
        meta={[
          { label: 'In layer', value: nf(filtered.length) },
          { label: 'Passing filters', value: nf(published.length) },
          { label: 'NRT rows', value: nf(counts.nrt) },
        ]}
      />

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatTile
          icon={Database}
          label="Register-backed"
          value={nf(counts.registerBacked)}
          caption={`${pctRaw(share(counts.registerBacked))} of the layer`}
          tone="good"
        />
        <StatTile
          icon={Globe2}
          label="OSM only"
          value={nf(counts.osmOnly)}
          caption="No authoritative register join"
          tone="warning"
        />
        <StatTile
          icon={ScanLine}
          label="Unmapped"
          value={nf(counts.unmapped)}
          caption="Thermal evidence with no facility record"
          tone="critical"
        />
        <StatTile
          icon={ScanLine}
          label="Sentinel-1 / Sentinel-2"
          value={`${nf(counts.sentinel1)} / ${nf(counts.sentinel2)}`}
          caption="Records with a usable acquisition"
        />
      </div>

      <Panel
        title="Filters"
        subtitle="Every provenance column can narrow the published set"
        action={
          <Button
            size="sm"
            variant="outline"
            className="gap-1.5 rounded-[9px]"
            onClick={() => {
              resetProvenance()
              logLine(role.id, 'Provenance filters cleared')
            }}
          >
            <RotateCcw size={13} strokeWidth={1.8} />
            Clear
          </Button>
        }
      >
        <div className="flex flex-wrap items-end gap-3">
          <Field label="Register source">
            <Select
              value={provenance.register}
              onValueChange={(value) => {
                setProvenance('register', value as RegisterSource | 'all')
                logLine(role.id, `Register filter set to ${value}`)
              }}
            >
              <SelectTrigger className="h-8 w-[170px] text-[12.5px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {REGISTERS.map((r) => (
                  <SelectItem key={r.value} value={r.value}>
                    {r.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>

          <Field label="Match confidence">
            <Select
              value={provenance.match}
              onValueChange={(value) => {
                setProvenance('match', value as MatchConfidence | 'all')
                logLine(role.id, `Match-confidence filter set to ${value}`)
              }}
            >
              <SelectTrigger className="h-8 w-[140px] text-[12.5px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {MATCHES.map((m) => (
                  <SelectItem key={m.value} value={m.value}>
                    {m.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>

          <Field label="FIRMS quality">
            <Select
              value={provenance.dataQuality}
              onValueChange={(value) => {
                setProvenance('dataQuality', value as DataQuality | 'all')
                logLine(role.id, `FIRMS quality filter set to ${value}`)
              }}
            >
              <SelectTrigger className="h-8 w-[168px] text-[12.5px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {QUALITIES.map((q) => (
                  <SelectItem key={q.value} value={q.value}>
                    {q.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>

          <Field label="Sentinel-1">
            <Select
              value={provenance.sentinel1}
              onValueChange={(value) => {
                setProvenance('sentinel1', value as Availability)
                logLine(role.id, `Sentinel-1 availability filter set to ${value}`)
              }}
            >
              <SelectTrigger className="h-8 w-[130px] text-[12.5px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {AVAILABILITY.map((a) => (
                  <SelectItem key={a.value} value={a.value}>
                    {a.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>

          <Field label="Sentinel-2">
            <Select
              value={provenance.sentinel2}
              onValueChange={(value) => {
                setProvenance('sentinel2', value as Availability)
                logLine(role.id, `Sentinel-2 availability filter set to ${value}`)
              }}
            >
              <SelectTrigger className="h-8 w-[130px] text-[12.5px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {AVAILABILITY.map((a) => (
                  <SelectItem key={a.value} value={a.value}>
                    {a.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>

          <Slider
            label="Min SAR quality"
            value={provenance.minSarQuality}
            max={0.95}
            step={0.05}
            display={provenance.minSarQuality.toFixed(2)}
            onChange={(v) => setProvenance('minSarQuality', v)}
            onCommit={() => logLine(role.id, `SAR quality floor set to ${provenance.minSarQuality.toFixed(2)}`)}
          />
          <Slider
            label="Min optical quality"
            value={provenance.minOpticalQuality}
            max={0.95}
            step={0.05}
            display={provenance.minOpticalQuality.toFixed(2)}
            onChange={(v) => setProvenance('minOpticalQuality', v)}
            onCommit={() => logLine(role.id, `Optical quality floor set to ${provenance.minOpticalQuality.toFixed(2)}`)}
          />
          <Slider
            label="Max cloud fraction"
            value={provenance.maxCloudFraction}
            max={1}
            step={0.05}
            display={provenance.maxCloudFraction.toFixed(2)}
            onChange={(v) => setProvenance('maxCloudFraction', v)}
            onCommit={() => logLine(role.id, `Cloud ceiling set to ${provenance.maxCloudFraction.toFixed(2)}`)}
          />
          <Slider
            label="Max temporal gap"
            value={provenance.maxTemporalGap}
            max={90}
            step={5}
            display={`${provenance.maxTemporalGap} d`}
            onChange={(v) => setProvenance('maxTemporalGap', v)}
            onCommit={() => logLine(role.id, `Temporal-gap ceiling set to ${provenance.maxTemporalGap} d`)}
          />
        </div>

        <p className="text-ink-faint mt-3 text-[11.5px]">
          A quality floor above 0.00 also drops records with no acquisition at all — a missing scene has no score to
          compare, and filling one in would be an invention.
        </p>
      </Panel>

      <Panel title="Provenance table" subtitle={`${nf(published.length)} of ${nf(filtered.length)} records pass`}>
        <ProvenanceTable
          sites={published}
          maxHeight={520}
          selectedId={selectedSiteId}
          onRowClick={(site) => {
            selectSite(site.id)
            openDetail()
            logLine(role.id, `Opened the full record for ${site.name}`)
          }}
        />
      </Panel>

      <SiteDetailDrawer role={role} />
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-ink-faint text-[10px] tracking-[0.1em] uppercase">{label}</span>
      {children}
    </label>
  )
}

function Slider({
  label,
  value,
  max,
  step,
  display,
  onChange,
  onCommit,
}: {
  label: string
  value: number
  max: number
  step: number
  display: string
  onChange: (value: number) => void
  onCommit: () => void
}) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-ink-faint text-[10px] tracking-[0.1em] uppercase">
        {label} <span className="tnum font-mono">{display}</span>
      </span>
      <input
        type="range"
        min={0}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        onMouseUp={onCommit}
        className="accent-teal-deep h-8 w-[140px]"
      />
    </label>
  )
}
