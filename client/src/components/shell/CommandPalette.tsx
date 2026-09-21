import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import { sites, unmapped } from '@/lib/data'
import { rolePath, type Role } from '@/lib/roles'
import { useFilters } from '@/store/useFilters'
import { coord } from '@/lib/format'

/** ⌘K search over sites, unmapped candidates and this role's own sections. */
export function CommandPalette({ role, open, onOpenChange }: { role: Role; open: boolean; onOpenChange: (v: boolean) => void }) {
  const [query, setQuery] = useState('')
  const navigate = useNavigate()
  const selectSite = useFilters((s) => s.selectSite)
  const selectUnmapped = useFilters((s) => s.selectUnmapped)

  useEffect(() => {
    if (!open) setQuery('')
  }, [open])

  const q = query.trim().toLowerCase()

  const siteHits = useMemo(() => {
    if (q.length < 2) return sites.slice(0, 6)
    return sites
      .filter(
        (s) =>
          s.name.toLowerCase().includes(q) ||
          s.state.toLowerCase().includes(q) ||
          s.classLabel.toLowerCase().includes(q) ||
          (s.operator ?? '').toLowerCase().includes(q),
      )
      .slice(0, 8)
  }, [q])

  const unmappedHits = useMemo(() => {
    if (q.length < 2) return []
    return unmapped.filter((u) => u.label.toLowerCase().includes(q) || u.state.toLowerCase().includes(q)).slice(0, 4)
  }, [q])

  const close = () => onOpenChange(false)

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange} title="Search" description="Find a site or a section">
      <CommandInput placeholder="Search sites, states, sections…" value={query} onValueChange={setQuery} />
      <CommandList>
        <CommandEmpty>Nothing matches that. Try a facility name, a state, or a class.</CommandEmpty>

        {siteHits.length > 0 && (
          <CommandGroup heading="Thermal sites">
            {siteHits.map((s) => (
              <CommandItem
                key={s.id}
                value={`${s.name} ${s.state} ${s.classLabel}`}
                onSelect={() => {
                  selectSite(s.id)
                  close()
                }}
              >
                <span className="flex-1 truncate">{s.name}</span>
                <span className="text-ink-faint text-xs">{s.classLabel}</span>
                <span className="text-ink-faint font-mono text-[11px]">{coord(s.lat, s.lon)}</span>
              </CommandItem>
            ))}
          </CommandGroup>
        )}

        {unmappedHits.length > 0 && (
          <CommandGroup heading="Unmapped candidates">
            {unmappedHits.map((u) => (
              <CommandItem
                key={u.id}
                value={`${u.label} ${u.state}`}
                onSelect={() => {
                  selectUnmapped(u.id)
                  close()
                }}
              >
                <span className="flex-1 truncate">
                  #{u.rank} {u.label}
                </span>
                <span className="text-ink-faint font-mono text-[11px]">{u.persistenceDays} d</span>
              </CommandItem>
            ))}
          </CommandGroup>
        )}

        <CommandGroup heading={`${role.short} sections`}>
          {role.nav.map((item) => (
            <CommandItem
              key={item.path}
              value={`go ${item.label}`}
              onSelect={() => {
                navigate(rolePath(role, item.path))
                close()
              }}
            >
              <item.icon size={15} strokeWidth={1.8} />
              <span>{item.label}</span>
            </CommandItem>
          ))}
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  )
}
