import { useIsCompact } from '@/hooks/useMediaQuery'
import type { RoleId } from './roles'

/**
 * Roles whose landing page is a map console rather than a scrolling report. Admin is the
 * odd one out: its landing page is the model scorecard and has no map at all.
 */
export const FULL_BLEED_ROLES = new Set<RoleId>(['cpcb', 'ppac', 'cea', 'ibm', 'fsi', 'ndma', 'nrsc'])

/**
 * True when the current page should fill the content area instead of scrolling.
 *
 * Floating docks need room beside the map, so below the compact breakpoint the console
 * degrades to the ordinary stacked layout and the shell gives its padding and scroll back.
 * The shell and the page both call this, which is what keeps them from disagreeing.
 */
export function useFullBleed(roleId: RoleId, section: string | undefined) {
  const isCompact = useIsCompact()
  return !section && FULL_BLEED_ROLES.has(roleId) && !isCompact
}
