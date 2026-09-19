import { useEffect, useMemo, useState } from 'react'
import { Outlet, useParams } from 'react-router-dom'
import { Rail } from './Rail'
import { TopBar } from './TopBar'
import { Footer } from './Footer'
import { SplitConsole, useConsoleBoot } from '@/components/console/SplitConsole'
import { sectionTitle, type Role } from '@/lib/roles'
import { meta, model } from '@/lib/data'
import { useSettings } from '@/store/useSettings'
import { useFilters } from '@/store/useFilters'
import { LAYERS, useLayers, type LayerId } from '@/store/useLayers'
import { nf } from '@/lib/format'

export function AppShell({ role }: { role: Role }) {
  const { section } = useParams()
  const [railOpen, setRailOpen] = useState(() => window.innerWidth >= 1100)

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

  // Settings defaults are applied once per session, before the first map paints.
  const defaultWindow = useSettings((s) => s.defaultWindow)
  const defaultLayers = useSettings((s) => s.defaultLayers)
  const setWindow = useFilters((s) => s.setWindow)
  const setVisible = useLayers((s) => s.setVisible)

  useEffect(() => {
    setWindow(defaultWindow)
    const next = Object.fromEntries(LAYERS.map((l) => [l.id, defaultLayers.includes(l.id)])) as Record<LayerId, boolean>
    setVisible(next)
    // Defaults are a session-start action, not a live binding to the settings page.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    document.documentElement.style.setProperty('--role-accent', role.accent)
    document.documentElement.style.setProperty('--role-accent-dim', role.accentDim)
  }, [role])

  return (
    <div className="bg-paper text-ink flex h-dvh w-full overflow-hidden">
      <div className="hidden md:block">
        <Rail role={role} compact={!railOpen} />
      </div>

      <div className="flex min-w-0 flex-1 flex-col">
        <TopBar role={role} section={sectionTitle(role, section)} onToggleRail={() => setRailOpen((v) => !v)} />
        <main className="min-h-0 flex-1 overflow-y-auto px-4 py-4 md:px-6 md:py-5">
          <Outlet />
        </main>
        <SplitConsole role={role} />
        <Footer />
      </div>
    </div>
  )
}
