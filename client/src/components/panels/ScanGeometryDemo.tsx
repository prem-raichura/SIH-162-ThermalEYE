import type { ThermalSite } from '@/lib/types'
import { nf } from '@/lib/format'

/**
 * Section 7.2. Raw FRP conflates a large fire with a hot one, because a MODIS pixel grows
 * from roughly 1 km² at nadir to around 10 km² at the scan edge. The same radiant power
 * therefore looks very different depending only on where in the swath it was seen, so the
 * comparable quantity is FRP per unit area.
 */
export function ScanGeometryDemo({ site }: { site: ThermalSite }) {
  const frp = site.frpMean
  const rows = [
    { label: 'Near nadir', area: 1.0 },
    { label: 'Mid swath', area: site.pixelAreaKm2 },
    { label: 'Scan edge', area: 9.6 },
  ]
  const max = frp / rows[0].area

  return (
    <div>
      <p className="text-ink-soft text-[12.5px]">
        {site.name} radiates <span className="tnum font-mono">{nf(frp, 1)} MW</span>. Below is what that same power
        looks like as raw FRP and as density, depending only on where in the swath the pixel fell.
      </p>

      <ul className="mt-3 space-y-2.5">
        {rows.map((row) => {
          const density = frp / row.area
          const width = (density / max) * 100
          const isSite = Math.abs(row.area - site.pixelAreaKm2) < 0.01
          return (
            <li key={row.label}>
              <div className="flex items-baseline justify-between gap-3 text-[12px]">
                <span className={isSite ? 'font-medium' : 'text-ink-soft'}>
                  {row.label}
                  {isSite && <span className="text-ink-faint"> · this detection</span>}
                </span>
                <span className="text-ink-faint tnum font-mono text-[11px]">
                  {nf(row.area, 2)} km² · {nf(frp, 1)} MW raw
                </span>
              </div>
              <div className="mt-1 flex items-center gap-2">
                <span className="bg-paper-deep relative h-2.5 flex-1 overflow-hidden rounded-full">
                  <span
                    className="absolute inset-y-0 left-0 rounded-full"
                    style={{
                      width: `${width}%`,
                      backgroundColor: isSite ? 'var(--color-amber)' : 'var(--color-line)',
                    }}
                  />
                </span>
                <span className="tnum w-[104px] text-right font-mono text-[11.5px]">
                  {nf(density, 1)} MW/km²
                </span>
              </div>
            </li>
          )
        })}
      </ul>

      <p className="text-ink-faint mt-3 text-[11px]">
        Raw FRP is identical in all three rows. Without this normalisation a scan-edge pixel reads as a bigger event
        than the same plant seen at nadir.
      </p>
    </div>
  )
}
