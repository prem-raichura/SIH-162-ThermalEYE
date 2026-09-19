import type { ReactNode } from 'react'
import { FileText } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { Role } from '@/lib/roles'

export interface MetaItem {
  label: string
  value: ReactNode
}

/**
 * The survey-sheet header: eyebrow, title, one-line description, a meta strip of readings,
 * and the primary action.
 */
export function PageHeader({
  role,
  eyebrow,
  title,
  description,
  meta,
  action,
  onAction,
}: {
  role: Role
  eyebrow: string
  title: string
  description: string
  meta?: MetaItem[]
  action?: string
  onAction?: () => void
}) {
  return (
    <section className="bg-card border-line rounded-[14px] border px-4 py-4 sm:px-6 sm:py-5">
      <div className="flex flex-wrap items-start gap-x-8 gap-y-5">
        <div className="min-w-0 flex-1 sm:min-w-[260px]">
          <p className="text-[11px] font-semibold tracking-[0.14em] uppercase" style={{ color: role.accent }}>
            {eyebrow}
          </p>
          <h2 className="font-display mt-1.5 text-[26px] leading-[1.12] sm:text-[34px] sm:leading-[1.1]">{title}</h2>
          <p className="text-ink-soft mt-1.5 max-w-[62ch] text-[13.5px]">{description}</p>
        </div>

        {meta && meta.length > 0 && (
          // Wraps rather than overflows: on a narrow screen the readings stack into rows
          // instead of pushing the header sideways.
          <dl className="divide-line flex flex-wrap gap-y-3 sm:divide-x">
            {meta.map((m) => (
              <div key={m.label} className="pr-5 sm:px-5 sm:first:pl-0 sm:last:pr-0">
                <dt className="text-ink-faint text-[10px] tracking-[0.1em] uppercase">{m.label}</dt>
                <dd className="tnum mt-1 font-mono text-[14px]">{m.value}</dd>
              </div>
            ))}
          </dl>
        )}

        {action && (
          <Button onClick={onAction} className="gap-2 self-center rounded-[10px] px-5">
            <FileText size={15} strokeWidth={1.8} />
            {action}
          </Button>
        )}
      </div>
    </section>
  )
}
