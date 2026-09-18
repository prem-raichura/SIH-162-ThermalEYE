import type { CircleLayerSpecification, HeatmapLayerSpecification, LineLayerSpecification } from 'maplibre-gl'
import { CLASS_COLOR, RAMP } from '@/lib/thermal'

type Paint<T> = Omit<T, 'id' | 'source'>

const classMatch = (): (string | string[])[] => {
  const out: (string | string[])[] = []
  for (const [cls, color] of Object.entries(CLASS_COLOR)) out.push(cls, color)
  return out
}

export const heatLayer: Paint<HeatmapLayerSpecification> = {
  type: 'heatmap',
  paint: {
    'heatmap-weight': ['interpolate', ['linear'], ['get', 'frp'], 0, 0.05, 140, 1],
    'heatmap-intensity': ['interpolate', ['linear'], ['zoom'], 3, 0.7, 11, 2.6],
    // Low density fades out rather than sitting as indigo bruises over the land.
    'heatmap-color': [
      'interpolate',
      ['linear'],
      ['heatmap-density'],
      0,
      'rgba(106, 0, 168, 0)',
      0.15,
      'rgba(177, 42, 144, 0.35)',
      0.4,
      RAMP[3],
      0.68,
      RAMP[4],
      1,
      RAMP[5],
    ],
    'heatmap-radius': ['interpolate', ['linear'], ['zoom'], 3, 8, 7, 20, 12, 40],
    'heatmap-opacity': ['interpolate', ['linear'], ['zoom'], 3, 0.6, 12, 0.42],
  },
}

export const siteLayer: Paint<CircleLayerSpecification> = {
  type: 'circle',
  paint: {
    'circle-color': ['match', ['get', 'cls'], ...classMatch(), '#8a8577'] as unknown as string,
    'circle-radius': [
      'interpolate',
      ['linear'],
      ['zoom'],
      3,
      ['interpolate', ['linear'], ['get', 'persistence'], 0, 2.4, 2100, 5.6],
      10,
      ['interpolate', ['linear'], ['get', 'persistence'], 0, 5, 2100, 14],
    ],
    'circle-stroke-width': 1,
    'circle-stroke-color': 'rgba(255,255,255,0.9)',
    'circle-opacity': 0.92,
  },
}

export const abnormalRingLayer: Paint<CircleLayerSpecification> = {
  type: 'circle',
  filter: ['==', ['get', 'abnormal'], 1],
  paint: {
    'circle-color': 'rgba(0,0,0,0)',
    'circle-radius': ['interpolate', ['linear'], ['zoom'], 3, 7, 10, 20],
    'circle-stroke-width': 1.4,
    'circle-stroke-color': '#c14a33',
    'circle-opacity': 0,
  },
}

export const unmappedLayer: Paint<CircleLayerSpecification> = {
  type: 'circle',
  paint: {
    'circle-color': 'rgba(193, 74, 51, 0.12)',
    'circle-radius': ['interpolate', ['linear'], ['get', 'persistence'], 0, 3.4, 640, 9],
    'circle-stroke-width': 1.3,
    'circle-stroke-color': '#c14a33',
  },
}

export const alertLayer: Paint<CircleLayerSpecification> = {
  type: 'circle',
  paint: {
    'circle-color': ['match', ['get', 'severity'], 'high', '#c14a33', 'medium', '#c98416', '#2e5d4f'],
    'circle-radius': ['match', ['get', 'severity'], 'high', 9, 'medium', 7, 5.5],
    'circle-stroke-width': 2,
    'circle-stroke-color': 'rgba(255,255,255,0.92)',
  },
}

export const landcoverLayer: Paint<CircleLayerSpecification> = {
  type: 'circle',
  paint: {
    'circle-color': ['match', ['get', 'dominant'], 'forest', '#4f7a3f', 'cropland', '#c9a227', 'builtup', '#8a8577', 'bare', '#c2a887', 'grass', '#94a86a', '#3f5e7a'],
    'circle-radius': ['interpolate', ['linear'], ['zoom'], 3, 6, 10, 28],
    'circle-opacity': 0.42,
    'circle-blur': 0.4,
  },
}

export const aoiLayer: Paint<LineLayerSpecification> = {
  type: 'line',
  paint: { 'line-color': '#26261f', 'line-width': 1.2, 'line-dasharray': [2, 2] },
}
