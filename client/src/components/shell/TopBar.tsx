import { useEffect, useState } from 'react'
import { Moon, PanelLeft, Search, Sun } from 'lucide-react'
import type { Role } from '@/lib/roles'
import { useTheme } from '@/store/useTheme'
import { useRoleStore } from '@/store/useRole'
import { AccountMenu } from './AccountMenu'
import { CommandPalette } from './CommandPalette'

export function TopBar({
  role,
  section,
  onToggleRail,
}: {
  role: Role
  section: string
  onToggleRail: () => void
}) {
  const [paletteOpen, setPaletteOpen] = useState(false)
  const mode = useTheme((s) => s.mode)
  const toggleTheme = useTheme((s) => s.toggle)
  const email = useRoleStore((s) => s.email)

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setPaletteOpen((v) => !v)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  return (
    <header className="bg-card border-line flex h-16 items-center gap-4 border-b px-4">
      <button
        type="button"
        onClick={onToggleRail}
        aria-label="Toggle navigation"
        className="hover:bg-paper-deep text-ink-soft rounded-[8px] p-2 transition-colors"
      >
        <PanelLeft size={17} strokeWidth={1.8} />
      </button>

      <div className="min-w-0">
        <div className="flex items-baseline gap-2.5">
          <h1 className="truncate text-[15px] font-semibold">{section}</h1>
          <span className="bg-line hidden h-4 w-px sm:block" />
          <span className="text-ink-soft hidden truncate text-[13px] sm:block">{role.org}</span>
        </div>
        <p className="text-ink-faint hidden truncate text-[11.5px] lg:block">{role.strap}</p>
      </div>

      <button
        type="button"
        onClick={() => setPaletteOpen(true)}
        className="border-line bg-paper text-ink-faint hover:border-ink-faint/50 ml-auto flex h-9 w-[clamp(140px,26vw,320px)] items-center gap-2 rounded-full border px-3 text-[13px] transition-colors"
      >
        <Search size={15} strokeWidth={1.8} />
        <span className="truncate">Search sites, coordinates, sections</span>
        <kbd className="border-line text-ink-faint ml-auto hidden rounded border px-1.5 py-0.5 font-mono text-[10px] sm:block">
          ⌘K
        </kbd>
      </button>

      <button
        type="button"
        onClick={toggleTheme}
        aria-label={mode === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
        className="hover:bg-paper-deep text-ink-soft rounded-full p-2 transition-colors"
      >
        {mode === 'dark' ? <Sun size={17} strokeWidth={1.8} /> : <Moon size={17} strokeWidth={1.8} />}
      </button>

      <AccountMenu role={role} email={email ?? ""} />

      <CommandPalette role={role} open={paletteOpen} onOpenChange={setPaletteOpen} />
    </header>
  )
}
