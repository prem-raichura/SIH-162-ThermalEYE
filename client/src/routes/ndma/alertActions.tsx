import { ArrowUpRight, Check, X } from 'lucide-react'
import { DISPOSITION_LABEL, type Disposition } from '@/store/useNdma'
import type { FeedAlert } from './useNdmaData'

/**
 * What a duty officer does with an alert: acknowledge it, send it up, or close it out.
 *
 * Shared by the alert queue, where it sits on every row, and the map console, where it sits
 * under whichever incident is selected — the same three verbs in both places, so the action
 * keeps its name wherever it is reached from.
 */
export function Actions({
  alert,
  onDispose,
  onClear,
  size = 'sm',
}: {
  alert: FeedAlert
  onDispose: (alert: FeedAlert, disposition: Disposition) => void
  onClear: (alert: FeedAlert) => void
  /** 'md' for the console dock, where these are the panel's primary controls. */
  size?: 'sm' | 'md'
}) {
  if (alert.disposition) {
    return (
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation()
          onClear(alert)
        }}
        className="text-ink-faint hover:text-ink inline-flex items-center gap-1 text-[10.5px] underline-offset-4 hover:underline"
      >
        <Check size={11} /> {DISPOSITION_LABEL[alert.disposition]} — undo
      </button>
    )
  }

  const md = size === 'md'
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <Action label="Acknowledge" onClick={() => onDispose(alert, 'acknowledged')} md={md}>
        <Check size={md ? 13 : 11} /> {md ? 'Acknowledge' : 'Ack'}
      </Action>
      <Action label="Escalate" onClick={() => onDispose(alert, 'escalated')} md={md}>
        <ArrowUpRight size={md ? 13 : 11} /> Escalate
      </Action>
      <Action label="Dismiss" onClick={() => onDispose(alert, 'dismissed')} md={md}>
        <X size={md ? 13 : 11} /> {md ? 'Dismiss' : ''}
      </Action>
    </div>
  )
}

function Action({
  label,
  onClick,
  md,
  children,
}: {
  label: string
  onClick: () => void
  md: boolean
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      onClick={(e) => {
        e.stopPropagation()
        onClick()
      }}
      className={
        md
          ? 'border-line hover:border-ink-faint hover:bg-paper-deep inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[12px] transition-colors'
          : 'border-line hover:border-ink-faint inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10.5px]'
      }
    >
      {children}
    </button>
  )
}
