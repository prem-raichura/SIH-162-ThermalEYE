import type { Map as MapLibreMap } from 'maplibre-gl'
import { SEVERITY_COLOR } from '@/lib/thermal'
import type { Severity } from '@/lib/types'

/**
 * Severity triangles for the incident map, drawn on a canvas rather than shipped as sprites:
 * the offline style carries no sprite sheet and no glyphs, and the app must keep working
 * with no network at all.
 */
export const INCIDENT_ICON: Record<Severity, string> = {
  high: 'incident-high',
  medium: 'incident-medium',
  low: 'incident-low',
}

const SIZE = 36
const RATIO = 2

function triangle(color: string): ImageData | null {
  const canvas = document.createElement('canvas')
  canvas.width = SIZE
  canvas.height = SIZE
  const ctx = canvas.getContext('2d')
  if (!ctx) return null

  const inset = 3
  ctx.beginPath()
  ctx.moveTo(SIZE / 2, inset)
  ctx.lineTo(SIZE - inset, SIZE - inset)
  ctx.lineTo(inset, SIZE - inset)
  ctx.closePath()
  ctx.fillStyle = color
  ctx.fill()
  ctx.lineWidth = 3
  ctx.lineJoin = 'round'
  ctx.strokeStyle = 'rgba(255,255,255,0.92)'
  ctx.stroke()

  return ctx.getImageData(0, 0, SIZE, SIZE)
}

/** Idempotent — a basemap switch reloads the style and drops every registered image. */
export function ensureIncidentIcons(map: MapLibreMap) {
  for (const severity of Object.keys(INCIDENT_ICON) as Severity[]) {
    const name = INCIDENT_ICON[severity]
    if (map.hasImage(name)) continue
    const image = triangle(SEVERITY_COLOR[severity])
    if (image) map.addImage(name, image, { pixelRatio: RATIO })
  }
}
