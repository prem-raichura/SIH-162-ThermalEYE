import {
  Activity,
  AlertTriangle,
  BarChart3,
  Factory,
  FileText,
  Flame,
  Gauge,
  Globe2,
  Layers,
  LayoutDashboard,
  Leaf,
  Map as MapIcon,
  Mountain,
  Pickaxe,
  Radar,
  Satellite,
  Settings,
  Sparkles,
  Table2,
  TreePine,
  TrendingUp,
  Zap,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import type { SourceClass } from './types'
import { INDUSTRIAL_CLASSES, NON_INDUSTRIAL_CLASSES } from './data'

export type RoleId = 'cpcb' | 'ppac' | 'cea' | 'ibm' | 'fsi' | 'ndma' | 'nrsc' | 'admin'

export interface NavItem {
  label: string
  path: string
  icon: LucideIcon
}

export interface Role {
  id: RoleId
  org: string
  short: string
  strap: string
  remit: string
  accent: string
  accentDim: string
  icon: LucideIcon
  nav: NavItem[]
  classFilter: SourceClass[] | 'all'
  mapFocus: [number, number, number]
}

const nav = (items: [string, string, LucideIcon][]): NavItem[] =>
  items.map(([label, path, icon]) => ({ label, path, icon }))

export const ROLES: Record<RoleId, Role> = {
  cpcb: {
    id: 'cpcb',
    org: 'Central Pollution Control Board',
    short: 'CPCB',
    strap: 'Industrial compliance · Unmapped polluting sources · National overview',
    remit: 'Tracks industrial thermal sites and finds polluting sources no register lists.',
    accent: '#2e5d4f',
    accentDim: '#e3ece7',
    icon: Leaf,
    nav: nav([
      ['Overview', '', LayoutDashboard],
      ['Industrial Sites', 'sites', Factory],
      ['Unmapped Sources', 'unmapped', Radar],
      ['Coverage Audit', 'coverage', Layers],
      ['Reports', 'reports', FileText],
      ['Settings', 'settings', Settings],
    ]),
    classFilter: INDUSTRIAL_CLASSES,
    mapFocus: [79.2, 22.6, 4.1],
  },
  ppac: {
    id: 'ppac',
    org: 'PPAC / MoPNG and PNGRB',
    short: 'PPAC',
    strap: 'Flaring activity · Refineries and gas infrastructure · Compliance check',
    remit: 'Watches refinery and flare behaviour against each site’s own normal range.',
    accent: '#3f5e7a',
    accentDim: '#e4eaf0',
    icon: Flame,
    nav: nav([
      ['Overview', '', LayoutDashboard],
      ['Refineries & Flares', 'flares', Flame],
      ['Gas Infrastructure', 'gas', Globe2],
      ['Flaring Analysis', 'analysis', TrendingUp],
      ['Alert Monitor', 'alerts', AlertTriangle],
      ['Reports', 'reports', FileText],
    ]),
    classFilter: ['refinery', 'gas_flare', 'lng_gas'],
    mapFocus: [74.5, 22.0, 5.0],
  },
  cea: {
    id: 'cea',
    org: 'Central Electricity Authority',
    short: 'CEA',
    strap: 'Thermal power monitoring · Deviation alerts · Operational intelligence',
    remit: 'Monitors thermal power stations and flags deviation from station baselines.',
    accent: '#c98416',
    accentDim: '#fbf0dc',
    icon: Zap,
    nav: nav([
      ['Overview', '', LayoutDashboard],
      ['Power Plants', 'plants', Zap],
      ['Coal Yards', 'coal-yards', Flame],
      ['Baselines', 'baselines', Gauge],
      ['Alerts', 'alerts', AlertTriangle],
      ['Historical Analysis', 'historical', TrendingUp],
      ['Reports', 'reports', FileText],
    ]),
    classFilter: ['power_thermal'],
    mapFocus: [80.0, 22.5, 4.2],
  },
  ibm: {
    id: 'ibm',
    org: 'Indian Bureau of Mines',
    short: 'IBM',
    strap: 'Mining activity · Unmapped mines · Persistent fire tracking',
    remit: 'Tracks mine-class thermal persistence and surfaces mines absent from the directory.',
    accent: '#6b5b95',
    accentDim: '#ece8f3',
    icon: Pickaxe,
    nav: nav([
      ['Overview', '', LayoutDashboard],
      ['Mining Sites', 'sites', Mountain],
      ['Unmapped Candidates', 'unmapped', Radar],
      ['Land Cover Analysis', 'landcover', Layers],
      ['Reports', 'reports', FileText],
    ]),
    classFilter: ['mining'],
    mapFocus: [84.5, 22.3, 5.2],
  },
  fsi: {
    id: 'fsi',
    org: 'Forest Survey of India',
    short: 'FSI',
    strap: 'Forest fire monitoring · Fewer false alarms · Vegetation damage',
    remit: 'Separates vegetation burns from industrial heat so fire alerts stay clean.',
    accent: '#4f7a3f',
    accentDim: '#e8efe3',
    icon: TreePine,
    nav: nav([
      ['Overview', '', LayoutDashboard],
      ['Forest Fires', 'forest', TreePine],
      ['Crop Burning', 'crop', Leaf],
      ['Alerts', 'alerts', AlertTriangle],
      ['Vegetation Analysis', 'vegetation', Activity],
      ['Seasonal Analysis', 'seasonal', BarChart3],
      ['Reports', 'reports', FileText],
    ]),
    classFilter: NON_INDUSTRIAL_CLASSES,
    mapFocus: [79.0, 23.5, 4.2],
  },
  ndma: {
    id: 'ndma',
    org: 'National Disaster Management Authority',
    short: 'NDMA',
    strap: 'Live alerts · Multi-hazard view · Emergency response',
    remit: 'Consumes the anomaly branch at response latency and routes alerts by severity.',
    accent: '#c14a33',
    accentDim: '#f6e5e0',
    icon: AlertTriangle,
    nav: nav([
      ['Live Alerts', '', AlertTriangle],
      ['Incident Map', 'incidents', MapIcon],
      ['Severity Settings', 'severity', Settings],
      ['Analytics', 'analytics', BarChart3],
      ['Reports', 'reports', FileText],
    ]),
    classFilter: 'all',
    mapFocus: [79.0, 22.5, 4.0],
  },
  nrsc: {
    id: 'nrsc',
    org: 'NRSC / Bhuvan, ISRO',
    short: 'NRSC',
    strap: 'Cross-publication · Provenance · Data quality',
    remit: 'Republishes the site layer, so every record carries its source and quality.',
    accent: '#2f6e7a',
    accentDim: '#e0eef0',
    icon: Satellite,
    nav: nav([
      ['Full Site Layer', '', Globe2],
      ['Provenance', 'provenance', Table2],
      ['Data Quality', 'quality', Gauge],
      ['Export', 'export', FileText],
      ['Reports', 'reports', FileText],
    ]),
    classFilter: 'all',
    mapFocus: [79.0, 22.5, 4.0],
  },
  admin: {
    id: 'admin',
    org: 'Analyst workbench',
    short: 'Admin',
    strap: 'Model performance · Ablations · Validation · Source health',
    remit: 'Internal view of how the model is evaluated and what data is still missing.',
    accent: '#4a4a44',
    accentDim: '#eceae4',
    icon: Sparkles,
    nav: nav([
      ['Model Performance', '', BarChart3],
      ['Ablations', 'ablations', TrendingUp],
      ['Validation', 'validation', Gauge],
      ['Data Sources', 'sources', Layers],
      ['Geographic Holdout', 'holdout', MapIcon],
      ['System', 'system', Settings],
    ]),
    classFilter: 'all',
    mapFocus: [79.0, 22.5, 4.0],
  },
}

export const ROLE_ORDER: RoleId[] = ['cpcb', 'ppac', 'cea', 'ibm', 'fsi', 'ndma', 'nrsc', 'admin']
export const ROLE_LIST = ROLE_ORDER.map((id) => ROLES[id])

export const isRoleId = (v: string | undefined): v is RoleId => !!v && v in ROLES

export function rolePath(role: Role, section: string) {
  return section ? `/${role.id}/${section}` : `/${role.id}`
}

export function sectionTitle(role: Role, section: string | undefined) {
  const item = role.nav.find((n) => n.path === (section ?? ''))
  return item?.label ?? role.nav[0].label
}
