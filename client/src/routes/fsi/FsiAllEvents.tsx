import { RecordListPage } from '@/components/panels/RecordListPage'
import { useFsiSites } from './useFsiData'
import { nf } from '@/lib/format'
import { useMemo } from 'react'
import type { Role } from '@/lib/roles'

/**
 * Every vegetation and waste event in one list, across all four classes — the text half of
 * the overview console, which shows the same rows as points on the map.
 */
export function FsiAllEvents({ role }: { role: Role }) {
  const { filtered, counts } = useFsiSites()

  const recent = useMemo(
    () => [...filtered].sort((a, b) => (b.lastDetection ?? '').localeCompare(a.lastDetection ?? '')),
    [filtered],
  )

  return (
    <RecordListPage
      role={role}
      eyebrow="Fire feed"
      title="All events"
      description="Every non-industrial event the pipeline classified, newest first. Forest, crop, waste and unclassified in one list."
      sites={recent}
      columns={['name', 'class', 'state', 'tHot', 'deltaT', 'persistence', 'lastDetection']}
      meta={[
        { label: 'Events', value: nf(filtered.length) },
        { label: 'Forest', value: nf(counts.get('forest_fire') ?? 0) },
        { label: 'Crop', value: nf(counts.get('crop_burning') ?? 0) },
        { label: 'Waste', value: nf(counts.get('waste_fire') ?? 0) },
      ]}
      emptyTitle="No events match these filters"
      emptyBody="Widen the time window or clear a class filter to bring events back."
    />
  )
}
