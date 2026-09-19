import type { ComponentType } from 'react'
import type { Role, RoleId } from '@/lib/roles'
import { CpcbOverview } from './cpcb/CpcbOverview'
import { CpcbSites } from './cpcb/CpcbSites'
import { CpcbUnmapped } from './cpcb/CpcbUnmapped'
import { CpcbCoverage } from './cpcb/CpcbCoverage'
import { CpcbReports } from './cpcb/CpcbReports'
import { CpcbSettings } from './cpcb/CpcbSettings'

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
}

export function pageFor(roleId: RoleId, section: string | undefined): RolePage | null {
  return PAGES[roleId]?.[section ?? ''] ?? null
}
