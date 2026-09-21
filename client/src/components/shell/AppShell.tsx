import { useEffect, useMemo, useState } from 'react'
import { Outlet, useLocation, useParams } from 'react-router-dom'
import { Rail } from './Rail'
import { Sheet, SheetContent, SheetTitle } from '@/components/ui/sheet'
import { TopBar } from './TopBar'
import { Footer } from './Footer'
import { SplitConsole, useConsoleBoot } from '@/components/console/SplitConsole'
import { sectionTitle, type Role } from '@/lib/roles'
import { meta, model } from '@/lib/data'
import { useSettingsFor } from '@/store/useRoleSettings'
import { useFilters } from '@/store/useFilters'
import { LAYERS, useLayers, type LayerId } from '@/store/useLayers'
import { useConsole } from '@/store/useConsole'
import { nf } from '@/lib/format'
import { useIsCompact, useIsMobile } from '@/hooks/useMediaQuery'
import { useFullBleed } from '@/lib/layout'
import { cn } from '@/lib/utils'

export function AppShell({ role }: { role: Role }) {
  const { section } = useParams()
  const location = useLocation()
  const isMobile = useIsMobile()
  const isCompact = useIsCompact()
  const [railOpen, setRailOpen] = useState(() => window.innerWidth >= 1100)
  // Below md the rail is a sheet, so the top-bar button opens that instead of collapsing.
  const [railSheet, setRailSheet] = useState(false)
  // The map consoles fill the content area instead of scrolling, so the shell hands them a
  // uniform inset and takes the page scroll away.
  const fullBleed = useFullBleed(role.id, section)

  const boot = useMemo(
    () => [
      `Survey data loaded — ${nf(meta.counts.sites)} thermal sites, ${nf(meta.counts.detections)} detections`,
      `Class filter applied for ${role.short}`,
      `Site baselines restored — ${nf(meta.counts.series)} historical series`,
      `Classifier report attached — macro-F1 ${model.macroF1.toFixed(3)} across ${model.classes} classes`,
      'Map layers updated',
    ],
    [role],
  )
  useConsoleBoot(role, boot)

  // Saved defaults are a live binding: saving a new default window or layer set on the
  // settings page moves the map and the filters at once, rather than waiting for a reload.
  const { defaultWindow, defaultLayers } = useSettingsFor(role.id)
  const setWindow = useFilters((s) => s.setWindow)
  const setVisible = useLayers((s) => s.setVisible)

  useEffect(() => {
    setWindow(defaultWindow)
    const next = Object.fromEntries(LAYERS.map((l) => [l.id, defaultLayers.includes(l.id)])) as Record<LayerId, boolean>
    setVisible(next)
  }, [defaultWindow, defaultLayers, setWindow, setVisible])

  // On a narrow screen the console would eat most of the viewport, so it starts folded.
  const setCollapsed = useConsole((s) => s.setCollapsed)
  useEffect(() => {
    if (isCompact) setCollapsed(true)
  }, [isCompact, setCollapsed])

  // Navigating on a phone should close the nav, not leave it covering the page.
  useEffect(() => {
    setRailSheet(false)
  }, [location.pathname])

  useEffect(() => {
    document.documentElement.style.setProperty('--role-accent', role.accent)
    document.documentElement.style.setProperty('--role-accent-dim', role.accentDim)
  }, [role])

  return (
    <div className="bg-paper text-ink flex h-dvh w-full overflow-hidden">
      <a href="#main" className="skip-link">
        Skip to content
      </a>

      <div className="hidden md:block">
        <Rail role={role} compact={!railOpen} />
      </div>

      {/* Below md the rail rides in a sheet so the page keeps the full width. */}
      <Sheet open={railSheet} onOpenChange={setRailSheet}>
        <SheetContent side="left" className="w-[248px] p-0">
          <SheetTitle className="sr-only">{role.short} navigation</SheetTitle>
          <Rail role={role} compact={false} />
        </SheetContent>
      </Sheet>

      <div className="flex min-w-0 flex-1 flex-col">
        <TopBar
          role={role}
          section={sectionTitle(role, section)}
          onToggleRail={() => (isMobile ? setRailSheet(true) : setRailOpen((v) => !v))}
        />
        <main
          id="main"
          tabIndex={-1}
          className={cn(
            'min-h-0 flex-1',
            fullBleed ? 'overflow-hidden p-3 md:p-4' : 'overflow-y-auto px-3 py-3 md:px-6 md:py-5',
          )}
        >
          <Outlet />
        </main>
        <SplitConsole role={role} />
        <Footer />
      </div>
    </div>
  )
}
