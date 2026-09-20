import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

/** Empty is an invitation to act, never an apology. */
export function EmptyState({
  title,
  body,
  action,
  compact = false,
}: {
  title: string
  body: string
  action?: ReactNode
  /** Tighter padding, for the floating docks on a map console where height is scarce. */
  compact?: boolean
}) {
  return (
    <div className={cn('grid place-items-center text-center', compact ? 'px-3 py-4' : 'px-6 py-10')}>
      <div className="max-w-[46ch]">
        <p className="text-[13.5px] font-medium">{title}</p>
        <p className="text-ink-soft mt-1.5 text-[12.5px]">{body}</p>
        {action && <div className="mt-3">{action}</div>}
      </div>
    </div>
  )
}
