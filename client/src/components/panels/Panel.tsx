import type { CSSProperties, ReactNode } from 'react'
import { cn } from '@/lib/utils'

/** The white card every dashboard block sits in. Hairline border, no shadow, no hover lift. */
export function Panel({
  title,
  subtitle,
  action,
  children,
  className,
  bodyClassName,
  style,
}: {
  title?: string
  subtitle?: string
  action?: ReactNode
  children: ReactNode
  className?: string
  bodyClassName?: string
  /** A definite height here is what lets a `fill` table scroll inside the panel. */
  style?: CSSProperties
}) {
  return (
    <section
      className={cn('bg-card border-line flex min-w-0 flex-col rounded-[14px] border', className)}
      style={style}
    >
      {(title || action) && (
        <header className="border-line flex items-start gap-3 border-b px-4 py-3">
          <div className="min-w-0 flex-1">
            {title && <h3 className="truncate text-[13.5px] font-semibold">{title}</h3>}
            {subtitle && <p className="text-ink-soft mt-0.5 text-[12px]">{subtitle}</p>}
          </div>
          {action}
        </header>
      )}
      <div className={cn('flex min-h-0 flex-1 flex-col px-4 py-3', bodyClassName)}>{children}</div>
    </section>
  )
}

export function PanelLink({ children, onClick }: { children: ReactNode; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="text-ink-soft hover:text-ink shrink-0 text-[12px] underline-offset-4 hover:underline"
    >
      {children}
    </button>
  )
}
