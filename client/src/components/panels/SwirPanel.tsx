import { Flame } from 'lucide-react'
import { loadSpectral } from '@/lib/data'
import { useAsyncData } from '@/hooks/useAsyncData'
import { PanelLoader } from '@/components/shell/Loader'
import { EmptyState } from './EmptyState'
import { QualityChip } from './QualityChip'

/**
 * Sentinel-2 SWIR localisation (section 4). B11 and B12 respond to very hot surfaces at 20 m,
 * which resolves how many separate hot units sit inside one coarse FIRMS pixel — several
 * flare stacks read as a single detection otherwise. Daytime only, cloud-limited, and never
 * required: this corroborates the retrieval rather than driving it.
 */
export function SwirPanel({ siteId, siteName }: { siteId: string; siteName: string }) {
  const { data: spectral, error, retry } = useAsyncData(loadSpectral, 'Sentinel-2 indices')

  if (!spectral) return <PanelLoader height={150} error={error} onRetry={retry} />
  const entry = spectral[siteId]

  if (!entry?.available || entry.swirHotUnits === null) {
    return (
      <EmptyState
        title="No SWIR localisation for this site"
        body={
          entry?.available === false
            ? `${entry.unavailableReason}. SWIR needs a clear daytime acquisition; the classification does not depend on it.`
            : 'SWIR unit counting runs on refinery and flare sites with a clear daytime scene.'
        }
      />
    )
  }

  return (
    <div>
      <div className="flex items-center gap-3.5">
        <span className="bg-terra-dim text-terracotta grid h-11 w-11 shrink-0 place-items-center rounded-full">
          <Flame size={19} strokeWidth={1.8} />
        </span>
        <div>
          <p className="font-display tnum text-[27px] leading-none">{entry.swirHotUnits}</p>
          <p className="text-ink-soft text-[12.5px]">
            distinct hot unit{entry.swirHotUnits === 1 ? '' : 's'} resolved inside the FIRMS pixel
          </p>
        </div>
      </div>

      <p className="text-ink-soft mt-3 text-[12.5px]">
        B11 (~1.61 µm) and B12 (~2.19 µm) at 20 m separate {siteName}&rsquo;s stacks, which the 375 m thermal pixel
        merges into one detection.
      </p>

      <div className="border-line mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 border-t pt-2 text-[11.5px]">
        <QualityChip label="Optical quality" score={entry.opticalQualityScore} />
        <span className="text-ink-soft">
          Cloud fraction <span className="tnum font-mono">{entry.cloudFraction}</span>
        </span>
        <span className="text-ink-soft">
          Acquisition gap <span className="tnum font-mono">{entry.temporalGapDays} d</span>
        </span>
      </div>
    </div>
  )
}
