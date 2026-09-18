import { PageHeader } from '@/components/shell/PageHeader'
import { Panel } from '@/components/panels/Panel'
import { CoverageAudit } from '@/components/panels/CoverageAudit'
import { StatTile } from '@/components/panels/StatTile'
import { coverage } from '@/lib/data'
import { nf } from '@/lib/format'
import { Layers, MapPinned, ScanSearch } from 'lucide-react'
import type { Role } from '@/lib/roles'

/** Section 21.1 — coverage is measured and reported as a number, never asserted. */
export function CpcbCoverage({ role }: { role: Role }) {
  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        role={role}
        eyebrow="Audit"
        title="Facility coverage"
        description="How much of the industrial map actually exists, measured against persistent thermal sites."
        meta={[
          { label: 'OSM only', value: `${coverage.osmOnlyOverall}%` },
          { label: 'With registers', value: `${coverage.withRegistersOverall}%` },
          { label: 'Usable features', value: nf(coverage.usableForWeakSupervision) },
        ]}
      />

      <div className="grid gap-3 sm:grid-cols-3">
        <StatTile
          icon={MapPinned}
          label="Raw tag matches"
          value={nf(coverage.rawFeatures)}
          caption={`${nf(coverage.duplicateRows)} were the same facility mapped twice`}
        />
        <StatTile
          icon={Layers}
          label="Unique features"
          value={nf(coverage.uniqueFeatures)}
          caption={`${nf(coverage.generatorNoise)} of them are rooftop generators, not facilities`}
        />
        <StatTile
          icon={ScanSearch}
          label="Usable for weak supervision"
          value={nf(coverage.usableForWeakSupervision)}
          caption={`Only ${coverage.namedPct}% of features carry a name`}
          tone="good"
        />
      </div>

      <Panel
        title="Coverage by facility class"
        subtitle="Share of persistent thermal sites with a mapped facility within 1 km"
      >
        <CoverageAudit height={280} />
      </Panel>

      <Panel title="Why the raw count is not the answer">
        <div className="text-ink-soft space-y-2 text-[12.5px]">
          <p>
            Two corrections come before the number means anything. First, deduplication: {nf(coverage.duplicateRows)} rows
            are one physical facility mapped both as a node and as a polygon, with different OSM ids and identical
            coordinates, so an id-based check misses them entirely.
          </p>
          <p>
            Second, panel-level noise: {nf(coverage.generatorNoise)} entries are <code className="font-mono text-[11px]">power=generator</code>{' '}
            rooftop solar installations. Only 404 features in the whole extraction are thermal power plants.
          </p>
          <p>
            Refineries show the same trap from the other side. Naive name matching returns 173 candidates because{' '}
            <code className="font-mono text-[11px]">industrial=oil</code> also tags depots, tank farms and edible-oil
            mills. Restricting to <code className="font-mono text-[11px]">industrial=refinery</code> plus an explicit
            refinery name gives 45, against roughly 23 operating refineries. Structural tags beat name matching
            everywhere.
          </p>
          <p className="text-ink">
            Where coverage is thin, absence of a facility stops being evidence. That is exactly where the unmapped
            queue earns its place rather than reading as a gap in the data.
          </p>
        </div>
      </Panel>
    </div>
  )
}
