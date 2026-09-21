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
import { type Role } from '@/lib/roles'
import { useRoleStore } from '@/store/useRole'
import { logLine } from '@/store/useConsole'

export function AccountMenu({ role, email }: { role: Role; email: string }) {
  const navigate = useNavigate()
  const signOut = useRoleStore((s) => s.signOut)

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="hover:bg-paper-deep flex max-w-[240px] items-center gap-2 rounded-full py-1 pr-2 pl-1 transition-colors">
        <span
          className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-[11px] font-semibold text-white"
          style={{ backgroundColor: role.accent }}
        >
          {role.short.slice(0, 2)}
        </span>
        <span className="hidden truncate text-[13px] md:inline">{email}</span>
        <ChevronDown size={15} className="text-ink-faint shrink-0" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-72">
        <DropdownMenuLabel className="text-ink-faint text-[11px] font-normal">
          Logged in as {email}
        </DropdownMenuLabel>
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
          Log out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
