/**
 * Chart tokens.
 *
 * The categorical set was validated with the dataviz palette checker against both the light
 * surface (#FFFFFF) and the dark one (#221F1A): lightness band, chroma floor, adjacent-pair
 * CVD separation, normal-vision floor and contrast all pass in both modes, so one set serves
 * both themes and a series keeps its colour when the theme flips.
 *
 * Hues are assigned in fixed order and never cycled. A chart that would need a seventh
 * series folds the tail into "Other" instead.
 */
export const CHART_CATEGORICAL = [
  '#127c53', // green
  '#c1432b', // terracotta
  '#2f6fb5', // blue
  '#c98416', // amber
  '#8a4fbf', // violet
  '#0e8fa0', // teal
] as const

/** Land cover: four validated hues plus a neutral for the aggregated tail. */
export const LANDCOVER_COLORS = {
  forest: '#127c53',
  cropland: '#c98416',
  builtup: '#c1432b',
  water: '#2f6fb5',
  other: '#b0a99a',
} as const

export const LANDCOVER_LABEL = {
  forest: 'Forest',
  cropland: 'Cropland',
  builtup: 'Built-up',
  water: 'Water',
  other: 'Bare & grass',
} as const

/**
 * Diverging pair for SHAP contributions: warm pushes the prediction toward the class,
 * cool pushes away, neutral gray at zero. Never a hue at the midpoint.
 */
export const DIVERGING = {
  positive: '#c1432b',
  negative: '#2f6fb5',
  midpoint: '#b8b1a2',
} as const

/** Reserved status colours. Always shipped with an icon or a written label, never alone. */
export const STATUS = {
  good: '#127c53',
  warning: '#c98416',
  critical: '#c1432b',
} as const

/** Recessive axis and grid furniture, shared by every chart. */
export const AXIS = {
  stroke: 'var(--color-line)',
  tick: { fill: 'var(--color-ink-faint)', fontSize: 10.5, fontFamily: 'var(--font-mono)' },
  grid: { stroke: 'var(--color-line-soft)', strokeDasharray: '2 4' },
} as const

export const TOOLTIP_STYLE = {
  contentStyle: {
    background: 'var(--color-card)',
    border: '1px solid var(--color-line)',
    borderRadius: 10,
    fontSize: 12,
    fontFamily: 'var(--font-sans)',
    color: 'var(--color-ink)',
    boxShadow: '0 6px 20px rgba(38,38,31,0.10)',
    padding: '8px 10px',
  },
  labelStyle: { color: 'var(--color-ink-soft)', fontSize: 11, marginBottom: 2 },
  itemStyle: { color: 'var(--color-ink)', fontSize: 12, padding: 0 },
  cursor: { stroke: 'var(--color-ink-faint)', strokeWidth: 1, strokeDasharray: '3 3' },
} as const

export const MARK = {
  lineWidth: 2,
  dotRadius: 4,
  activeDotRadius: 5,
  barRadius: [4, 4, 0, 0] as [number, number, number, number],
  barGap: 2,
} as const
