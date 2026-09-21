import { lazy, type ComponentType } from 'react'
import type { Role, RoleId } from '@/lib/roles'

export type RolePage = ComponentType<{ role: Role }>

/**
 * Wraps a named export as a lazily-loaded route page.
 *
 * Every page used to be a static import, which put all 49 of them — and every chart library
 * they pull in — into one entry chunk. Splitting them means a role only downloads the
 * sections it opens, and gives the app a real boundary to show a loader against.
 */
const page = (load: () => Promise<Record<string, unknown>>, name: string): RolePage =>
  lazy(async () => ({ default: (await load())[name] as RolePage }))

/**
 * Role section -> page. A section with no entry falls back to the shared scaffold, so roles
 * can be finished one plan at a time without breaking navigation.
 */
const PAGES: Partial<Record<RoleId, Record<string, RolePage>>> = {
  cpcb: {
    '': page(() => import('./cpcb/CpcbOverview'), 'CpcbOverview'),
    sites: page(() => import('./cpcb/CpcbSites'), 'CpcbSites'),
    unmapped: page(() => import('./cpcb/CpcbUnmapped'), 'CpcbUnmapped'),
    coverage: page(() => import('./cpcb/CpcbCoverage'), 'CpcbCoverage'),
    reports: page(() => import('./cpcb/CpcbReports'), 'CpcbReports'),
    settings: page(() => import('./cpcb/CpcbSettings'), 'CpcbSettings'),
  },
  ppac: {
    '': page(() => import('./ppac/PpacOverview'), 'PpacOverview'),
    flares: page(() => import('./ppac/PpacFlares'), 'PpacFlares'),
    gas: page(() => import('./ppac/PpacGas'), 'PpacGas'),
    analysis: page(() => import('./ppac/PpacAnalysis'), 'PpacAnalysis'),
    alerts: page(() => import('./ppac/PpacAlerts'), 'PpacAlerts'),
    reports: page(() => import('./ppac/PpacReports'), 'PpacReports'),
    settings: page(() => import('./ppac/PpacSettings'), 'PpacSettings'),
  },
  cea: {
    '': page(() => import('./cea/CeaOverview'), 'CeaOverview'),
    plants: page(() => import('./cea/CeaPlants'), 'CeaPlants'),
    'coal-yards': page(() => import('./cea/CeaCoalYards'), 'CeaCoalYards'),
    baselines: page(() => import('./cea/CeaBaselines'), 'CeaBaselines'),
    alerts: page(() => import('./cea/CeaAlerts'), 'CeaAlerts'),
    historical: page(() => import('./cea/CeaHistorical'), 'CeaHistorical'),
    reports: page(() => import('./cea/CeaReports'), 'CeaReports'),
    settings: page(() => import('./cea/CeaSettings'), 'CeaSettings'),
  },
  ibm: {
    '': page(() => import('./ibm/IbmOverview'), 'IbmOverview'),
    sites: page(() => import('./ibm/IbmSites'), 'IbmSites'),
    unmapped: page(() => import('./ibm/IbmUnmapped'), 'IbmUnmapped'),
    landcover: page(() => import('./ibm/IbmLandCover'), 'IbmLandCover'),
    reports: page(() => import('./ibm/IbmReports'), 'IbmReports'),
    settings: page(() => import('./ibm/IbmSettings'), 'IbmSettings'),
  },
  fsi: {
    '': page(() => import('./fsi/FsiOverview'), 'FsiOverview'),
    events: page(() => import('./fsi/FsiAllEvents'), 'FsiAllEvents'),
    forest: page(() => import('./fsi/FsiEvents'), 'FsiForest'),
    crop: page(() => import('./fsi/FsiEvents'), 'FsiCrop'),
    alerts: page(() => import('./fsi/FsiAlerts'), 'FsiAlerts'),
    vegetation: page(() => import('./fsi/FsiVegetation'), 'FsiVegetation'),
    seasonal: page(() => import('./fsi/FsiSeasonal'), 'FsiSeasonal'),
    reports: page(() => import('./fsi/FsiReports'), 'FsiReports'),
    settings: page(() => import('./fsi/FsiSettings'), 'FsiSettings'),
  },
  ndma: {
    '': page(() => import('./ndma/NdmaLiveAlerts'), 'NdmaLiveAlerts'),
    queue: page(() => import('./ndma/NdmaQueue'), 'NdmaQueue'),
    incidents: page(() => import('./ndma/NdmaIncidents'), 'NdmaIncidents'),
    severity: page(() => import('./ndma/NdmaSeverity'), 'NdmaSeverity'),
    analytics: page(() => import('./ndma/NdmaAnalytics'), 'NdmaAnalytics'),
    reports: page(() => import('./ndma/NdmaReports'), 'NdmaReports'),
    settings: page(() => import('./ndma/NdmaSettings'), 'NdmaSettings'),
  },
  nrsc: {
    '': page(() => import('./nrsc/NrscLayer'), 'NrscLayer'),
    records: page(() => import('./nrsc/NrscRecords'), 'NrscRecords'),
    provenance: page(() => import('./nrsc/NrscProvenance'), 'NrscProvenance'),
    quality: page(() => import('./nrsc/NrscQuality'), 'NrscQuality'),
    export: page(() => import('./nrsc/NrscExport'), 'NrscExport'),
    reports: page(() => import('./nrsc/NrscReports'), 'NrscReports'),
    settings: page(() => import('./nrsc/NrscSettings'), 'NrscSettings'),
  },
  admin: {
    '': page(() => import('./admin/AdminPerformance'), 'AdminPerformance'),
    ablations: page(() => import('./admin/AdminAblations'), 'AdminAblations'),
    validation: page(() => import('./admin/AdminValidation'), 'AdminValidation'),
    sources: page(() => import('./admin/AdminSources'), 'AdminSources'),
    holdout: page(() => import('./admin/AdminHoldout'), 'AdminHoldout'),
    system: page(() => import('./admin/AdminSystem'), 'AdminSystem'),
    settings: page(() => import('./admin/AdminSettings'), 'AdminSettings'),
  },
}

export function pageFor(roleId: RoleId, section: string | undefined): RolePage | null {
  return PAGES[roleId]?.[section ?? ''] ?? null
}
