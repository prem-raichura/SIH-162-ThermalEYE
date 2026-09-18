import type { StyleSpecification } from 'maplibre-gl'

/**
 * Base styles carry no vector sources on purpose: MapLibre resolves GeoJSON URLs inside a
 * blob worker, where a root-relative path has no origin to resolve against. Boundary data
 * is fetched by the app and handed to the map as objects instead.
 */
export function offlineStyle(): StyleSpecification {
  return {
    version: 8,
    sources: {},
    layers: [{ id: 'backdrop', type: 'background', paint: { 'background-color': '#e7e2d6' } }],
  }
}

/** Satellite imagery. Needs a connection; the map falls back to offline when tiles fail. */
export function satelliteStyle(): StyleSpecification {
  return {
    version: 8,
    sources: {
      imagery: {
        type: 'raster',
        tiles: ['https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'],
        tileSize: 256,
        maxzoom: 18,
        attribution: 'Imagery © Esri, Maxar, Earthstar Geographics',
      },
    },
    layers: [
      { id: 'backdrop', type: 'background', paint: { 'background-color': '#1b1a17' } },
      { id: 'imagery', type: 'raster', source: 'imagery', paint: { 'raster-opacity': 1 } },
    ],
  }
}

export const BOUNDARY_PAINT = {
  offline: {
    fill: '#efe9da',
    state: '#cdc3ae',
    district: '#e0d6c3',
  },
  satellite: {
    fill: 'rgba(0,0,0,0)',
    state: 'rgba(255,255,255,0.45)',
    district: 'rgba(255,255,255,0.22)',
  },
} as const

/** west, south, east, north — padded so the map cannot be panned off India. */
export const INDIA_BOUNDS: [number, number, number, number] = [64.0, 3.0, 101.0, 40.0]
