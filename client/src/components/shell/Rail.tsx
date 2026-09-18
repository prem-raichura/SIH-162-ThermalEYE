import { NavLink } from 'react-router-dom'
import { Brand } from './Brand'
import { cn } from '@/lib/utils'
import { rolePath, type Role } from '@/lib/roles'
import { logLine } from '@/store/useConsole'

export function Rail({ role, compact }: { role: Role; compact: boolean }) {
  return (
    <nav
      aria-label={`${role.short} navigation`}
      className={cn(
        'bg-card border-line flex h-full flex-col border-r',
        compact ? 'w-[68px] items-center' : 'w-[240px]',
      )}
    >
      <div className={cn('flex h-16 items-center', compact ? 'justify-center' : 'px-5')}>
        {compact ? <Brand size="md" className="[&>div]:hidden" /> : <Brand />}
      </div>

      <ul className={cn('flex flex-1 flex-col gap-1', compact ? 'px-2' : 'px-3')}>
        {role.nav.map((item) => (
          <li key={item.path}>
            <NavLink
              to={rolePath(role, item.path)}
              end={item.path === ''}
              title={compact ? item.label : undefined}
              onClick={() => logLine(role.id, `Opened ${item.label}`)}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 rounded-[10px] px-3 py-2.5 text-[13.5px] transition-colors',
                  compact && 'justify-center px-0',
                  isActive
                    ? 'text-white'
                    : 'text-ink-soft hover:bg-paper-deep hover:text-ink',
                )
              }
              style={({ isActive }) => (isActive ? { backgroundColor: role.accent } : undefined)}
            >
              <item.icon size={17} strokeWidth={1.8} className="shrink-0" />
              {!compact && <span className="truncate">{item.label}</span>}
            </NavLink>
          </li>
        ))}
      </ul>

      {!compact && (
        <div className="px-5 pb-6">
          <p className="font-hand text-ink-faint text-[17px] leading-tight">
            From signals
            <br />
            to safer tomorrows.
          </p>
          <div className="bg-line mt-3 h-px w-12" />
        </div>
      )}
    </nav>
  )
}
