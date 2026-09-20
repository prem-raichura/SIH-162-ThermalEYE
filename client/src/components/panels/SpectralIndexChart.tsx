import { TrendChart } from './TrendChart'
import { QualityChip } from './QualityChip'
import { EmptyState } from './EmptyState'
import { loadSpectral } from '@/lib/data'
import { useAsyncData } from '@/hooks/useAsyncData'
import { PanelLoader } from '@/components/shell/Loader'

/**
 * Sentinel-2 before/after evidence (section 9). Optical data is frequently missing, so the
 * quality metadata travels with the chart and an unavailable acquisition says so plainly
 * instead of drawing a flat line.
 */
export function SpectralIndexChart({ siteId, height = 190 }: { siteId: string; height?: number }) {
  const { data: spectral, error, retry } = useAsyncData(loadSpectral, 'Sentinel-2 indices')

  if (!spectral) return <PanelLoader height={190} error={error} onRetry={retry} />
  const entry = spectral[siteId]
  if (!entry) return null

  if (!entry.available) {
    return (
      <EmptyState
        title="No usable Sentinel-2 acquisition"
        body={`${entry.unavailableReason}. Cloud fraction ${entry.cloudFraction}, nearest pass ${entry.temporalGapDays} days away. The classification does not depend on optical evidence.`}
      />
    )
  }

  return (
    <div>
      <TrendChart
        data={entry.series}
        xKey="month"
        series={[
          { key: 'ndvi', label: 'NDVI' },
          { key: 'nbr', label: 'NBR' },
          { key: 'ndmi', label: 'NDMI' },
        ]}
        height={height}
        yDomain={[-1, 1]}
      />
      <div className="border-line mt-2 flex flex-wrap items-center gap-x-4 gap-y-1.5 border-t pt-2 text-[11.5px]">
        <QualityChip label="Optical quality" score={entry.opticalQualityScore} />
        <span className="text-ink-soft">
          Cloud fraction <span className="tnum font-mono">{entry.cloudFraction}</span>
        </span>
        <span className="text-ink-soft">
          Temporal gap <span className="tnum font-mono">{entry.temporalGapDays} d</span>
        </span>
        <span className="text-ink-soft">
          ΔNBR <span className="tnum font-mono">{entry.dNbr}</span>
        </span>
      </div>
    </div>
  )
}
