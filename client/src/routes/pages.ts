import type { ComponentType } from 'react'
import type { Role, RoleId } from '@/lib/roles'
import { CpcbOverview } from './cpcb/CpcbOverview'
import { CpcbSites } from './cpcb/CpcbSites'
import { CpcbUnmapped } from './cpcb/CpcbUnmapped'
import { CpcbCoverage } from './cpcb/CpcbCoverage'
import { CpcbReports } from './cpcb/CpcbReports'
import { CpcbSettings } from './cpcb/CpcbSettings'
import { PpacOverview } from './ppac/PpacOverview'
import { PpacFlares } from './ppac/PpacFlares'
import { PpacGas } from './ppac/PpacGas'
import { PpacAnalysis } from './ppac/PpacAnalysis'
import { PpacAlerts } from './ppac/PpacAlerts'
import { PpacReports } from './ppac/PpacReports'
import { CeaOverview } from './cea/CeaOverview'
import { CeaPlants } from './cea/CeaPlants'
import { CeaCoalYards } from './cea/CeaCoalYards'
import { CeaBaselines } from './cea/CeaBaselines'
import { CeaAlerts } from './cea/CeaAlerts'
import { CeaHistorical } from './cea/CeaHistorical'
import { CeaReports } from './cea/CeaReports'
import { IbmOverview } from './ibm/IbmOverview'
import { IbmSites } from './ibm/IbmSites'
import { IbmUnmapped } from './ibm/IbmUnmapped'
import { IbmLandCover } from './ibm/IbmLandCover'
import { IbmReports } from './ibm/IbmReports'
import { FsiOverview } from './fsi/FsiOverview'
import { FsiCrop, FsiForest } from './fsi/FsiEvents'
import { FsiAlerts } from './fsi/FsiAlerts'
import { FsiVegetation } from './fsi/FsiVegetation'
import { FsiSeasonal } from './fsi/FsiSeasonal'
import { FsiReports } from './fsi/FsiReports'
import { NdmaLiveAlerts } from './ndma/NdmaLiveAlerts'
import { NdmaIncidents } from './ndma/NdmaIncidents'
import { NdmaSeverity } from './ndma/NdmaSeverity'
import { NdmaAnalytics } from './ndma/NdmaAnalytics'
import { NdmaReports } from './ndma/NdmaReports'

export type RolePage = ComponentType<{ role: Role }>

/**
 * Role section -> page. A section with no entry falls back to the shared scaffold, so roles
 * can be finished one plan at a time without breaking navigation.
 */
const PAGES: Partial<Record<RoleId, Record<string, RolePage>>> = {
  cpcb: {
    '': CpcbOverview,
    sites: CpcbSites,
    unmapped: CpcbUnmapped,
    coverage: CpcbCoverage,
    reports: CpcbReports,
    settings: CpcbSettings,
  },
  ppac: {
    '': PpacOverview,
    flares: PpacFlares,
    gas: PpacGas,
    analysis: PpacAnalysis,
    alerts: PpacAlerts,
    reports: PpacReports,
  },
  cea: {
    '': CeaOverview,
    plants: CeaPlants,
    'coal-yards': CeaCoalYards,
    baselines: CeaBaselines,
    alerts: CeaAlerts,
    historical: CeaHistorical,
    reports: CeaReports,
  },
  ibm: {
    '': IbmOverview,
    sites: IbmSites,
    unmapped: IbmUnmapped,
    landcover: IbmLandCover,
    reports: IbmReports,
  },
  fsi: {
    '': FsiOverview,
    forest: FsiForest,
    crop: FsiCrop,
    alerts: FsiAlerts,
    vegetation: FsiVegetation,
    seasonal: FsiSeasonal,
    reports: FsiReports,
  },
  ndma: {
    '': NdmaLiveAlerts,
    incidents: NdmaIncidents,
    severity: NdmaSeverity,
    analytics: NdmaAnalytics,
    reports: NdmaReports,
  },
}

export function pageFor(roleId: RoleId, section: string | undefined): RolePage | null {
  return PAGES[roleId]?.[section ?? ''] ?? null
}
