import { useMemo } from 'react'
import { DistributionDonut } from './DistributionDonut'
import { LANDCOVER_COLORS, LANDCOVER_LABEL } from '@/lib/chart'
import { landcover } from '@/lib/data'
import type { LandCover } from '@/lib/types'

/**
 * WorldCover context (section 12). Bare and grass are folded into one neutral slice so the
 * four meaningful covers stay separable — a sixth hue here would fail the CVD check.
 */
export function LandCoverDonut({ siteId, mix, height }: { siteId?: string; mix?: LandCover; height?: number }) {
  const cover = mix ?? (siteId ? landcover[siteId] : undefined)

  const slices = useMemo(() => {
    if (!cover) return []
    const other = Math.round((cover.bare + cover.grass) * 10) / 10
    return [
      { label: LANDCOVER_LABEL.forest, value: cover.forest, color: LANDCOVER_COLORS.forest },
      { label: LANDCOVER_LABEL.cropland, value: cover.cropland, color: LANDCOVER_COLORS.cropland },
      { label: LANDCOVER_LABEL.builtup, value: cover.builtup, color: LANDCOVER_COLORS.builtup },
      { label: LANDCOVER_LABEL.water, value: cover.water, color: LANDCOVER_COLORS.water },
      { label: LANDCOVER_LABEL.other, value: other, color: LANDCOVER_COLORS.other },
    ].filter((s) => s.value > 0)
  }, [cover])

  if (!cover) return null

  const dominant = slices.reduce((a, b) => (b.value > a.value ? b : a), slices[0])

  return (
    <div>
      <DistributionDonut
        slices={slices}
        centerLabel="dominant"
        centerValue={`${Math.round(dominant.value)}%`}
        height={height}
        unit="%"
      />
      <p className="text-ink-faint mt-2 text-[11px]">
        ESA WorldCover 10 m v200 (2021). Recent expansion may not appear.
      </p>
    </div>
  )
}
