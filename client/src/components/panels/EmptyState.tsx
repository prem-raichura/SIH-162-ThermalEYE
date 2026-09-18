import type { ReactNode } from 'react'

/** Empty is an invitation to act, never an apology. */
export function EmptyState({ title, body, action }: { title: string; body: string; action?: ReactNode }) {
  return (
    <div className="grid place-items-center px-6 py-10 text-center">
      <div className="max-w-[46ch]">
        <p className="text-[13.5px] font-medium">{title}</p>
        <p className="text-ink-soft mt-1.5 text-[12.5px]">{body}</p>
        {action && <div className="mt-3">{action}</div>}
      </div>
    </div>
  )
}
