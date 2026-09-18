import { useNavigate } from 'react-router-dom'
import { ChevronDown, LogOut } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { ROLE_LIST, type Role } from '@/lib/roles'
import { useRoleStore } from '@/store/useRole'
import { logLine } from '@/store/useConsole'

export function RoleSwitcher({ role, user }: { role: Role; user: string }) {
  const navigate = useNavigate()
  const setRole = useRoleStore((s) => s.setRole)
  const signOut = useRoleStore((s) => s.signOut)
  const initials = user
    .split(' ')
    .map((p) => p[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="hover:bg-paper-deep flex items-center gap-2 rounded-full py-1 pr-2 pl-1 transition-colors">
        <span
          className="grid h-8 w-8 place-items-center rounded-full text-[11px] font-semibold text-white"
          style={{ backgroundColor: role.accent }}
        >
          {initials}
        </span>
        <span className="hidden text-[13px] md:inline">{user}</span>
        <ChevronDown size={15} className="text-ink-faint" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-72">
        <DropdownMenuLabel className="text-ink-faint text-[11px] font-normal">
          Signed in as {user} · viewing as {role.short}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {ROLE_LIST.map((r) => (
          <DropdownMenuItem
            key={r.id}
            onSelect={() => {
              if (r.id === role.id) return
              setRole(r.id)
              navigate(`/${r.id}`)
              logLine('INFO', `Active role changed to ${r.short}`)
            }}
            className="gap-2.5"
          >
            <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: r.accent }} />
            <span className="flex-1 truncate">{r.org}</span>
            <span className="text-ink-faint text-[11px]">{r.short}</span>
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onSelect={() => {
            signOut()
            navigate('/login')
            logLine('INFO', 'Session ended')
          }}
          className="gap-2.5"
        >
          <LogOut size={14} />
          Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
