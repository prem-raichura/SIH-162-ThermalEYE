import { useMemo } from 'react'
import { PageHeader } from '@/components/shell/PageHeader'
import { Panel } from '@/components/panels/Panel'
import { TrendChart } from '@/components/panels/TrendChart'
import { StatTile } from '@/components/panels/StatTile'
import { useFsiSites, useSeasonalCounts } from './useFsiData'
import { CalendarRange, Leaf, TreePine } from 'lucide-react'
import { nf } from '@/lib/format'
import type { Role } from '@/lib/roles'

/**
 * Burn-season comparison. Crop residue peaks in the post-harvest weeks; forest fire peaks in
 * the dry pre-monsoon months. Industrial heat is on the same axis deliberately — it barely
 * moves with the season, which is itself a discriminator.
 */
export function FsiSeasonal({ role }: { role: Role }) {
  const { series, indexed, sampled } = useSeasonalCounts()
  const { filtered } = useFsiSites()

  const peaks = useMemo(() => {
    const peakOf = (key: 'crop_burning' | 'forest_fire' | 'industrial') =>
      series.reduce((a, b) => (b[key] > a[key] ? b : a), series[0])
    return {
      crop: peakOf('crop_burning'),
      forest: peakOf('forest_fire'),
      industrial: peakOf('industrial'),
    }
  }, [series])

  const industrialSpread = useMemo(() => {
    const values = series.map((r) => r.industrial)
    const max = Math.max(...values, 1)
    const min = Math.min(...values)
    return Math.round(((max - min) / max) * 100)
  }, [series])

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        role={role}
        eyebrow="Seasonality"
        title="Burn seasons"
        description="When each class actually burns, counted from the detection record rather than assumed."
        meta={[
          { label: 'Records sampled', value: nf(sampled) },
          { label: 'Events in view', value: nf(filtered.length) },
        ]}
      />

      <div className="grid gap-3 sm:grid-cols-3">
        <StatTile
          icon={Leaf}
          label="Crop burning peaks"
          value={peaks.crop?.month ?? '—'}
          caption={`${nf(peaks.crop?.crop_burning ?? 0)} detections that month`}
          tone="warning"
        />
        <StatTile
          icon={TreePine}
          label="Forest fire peaks"
          value={peaks.forest?.month ?? '—'}
          caption={`${nf(peaks.forest?.forest_fire ?? 0)} detections that month`}
        />
        <StatTile
          icon={CalendarRange}
          label="Industrial seasonal swing"
          value={`${industrialSpread}%`}
          caption="Industrial heat barely follows the seasons"
          tone="good"
        />
      </div>

      <Panel
        title="When each class burns"
        subtitle="Each class as a share of its own annual detections, so the seasons are comparable on one scale"
      >
        <TrendChart
          data={indexed}
          xKey="month"
          series={[
            { key: 'crop_burning', label: 'Crop burning' },
            { key: 'forest_fire', label: 'Forest fire' },
            { key: 'waste_fire', label: 'Waste fire' },
            { key: 'industrial', label: 'Industrial' },
          ]}
          height={280}
          unit="% of year"
        />
        <p className="text-ink-faint mt-2 text-[11px]">
          Industrial detections outnumber vegetation ones several times over. Plotted as raw counts on one axis they
          flatten the burn seasons, and a second y-axis would only hide the problem — so every class is indexed to its
          own annual total instead. A flat line means no seasonality, not a small class.
        </p>
      </Panel>

      <div className="grid gap-3 lg:grid-cols-2">
        <Panel title="What the shape says">
          <div className="text-ink-soft space-y-2 text-[12.5px]">
            <p>
              Crop residue burning rises sharply after harvest and collapses again within weeks. Forest fire climbs
              through the dry pre-monsoon months and stops when the rains arrive.
            </p>
            <p>
              Industrial heat does neither. A refinery flare or a kiln burns at much the same rate in February and in
              October, which is why a source that ignores the season is unlikely to be vegetation.
            </p>
            <p className="text-ink">
              Seasonality is corroboration, not proof: a kiln lit only in the dry season would follow the same curve as
              a forest fire, and the dual-band contrast is what tells them apart.
            </p>
          </div>
        </Panel>

        <Panel title="Reading this against your own feed">
          <div className="text-ink-soft space-y-2 text-[12.5px]">
            <p>
              The national fire feed counts every FIRMS detection in a district. During the crop window that count is
              dominated by residue burning, and the forest signal is buried inside it.
            </p>
            <p>
              Splitting the count by class before aggregating is what lets a genuine forest fire in November be seen at
              all, rather than being read as one more stubble pixel.
            </p>
          </div>
        </Panel>
      </div>
    </div>
  )
}
