import type { ReactNode } from 'react'
import { AlertTriangle, Check, Flame, TreePine } from 'lucide-react'
import type { Alert } from '@/lib/types'
import { SEVERITY_COLOR } from '@/lib/thermal'
import { relativeTime } from '@/lib/format'
import { cn } from '@/lib/utils'
import { EmptyState } from './EmptyState'

const ICON = { high: AlertTriangle, medium: Flame, low: TreePine }

/**
 * The anomaly branch at response latency (section 19). Every row states the site's own normal
 * range next to what it is doing now — severity is deviation from a site's history, not a
 * global FRP threshold.
 */
export function AlertStream({
  alerts,
  onSelect,
  selectedId,
  onAcknowledge,
  renderActions,
  showConfidence = false,
  limit,
  maxHeight = 360,
  fill = false,
}: {
  alerts: Alert[]
  onSelect?: (alert: Alert) => void
  selectedId?: string | null
  onAcknowledge?: (alert: Alert) => void
  /** Replaces the acknowledge button, for feeds with more than one disposition. */
  renderActions?: (alert: Alert) => ReactNode
  /** Adds the classifier's confidence and a deviation chip to the row. */
  showConfidence?: boolean
  limit?: number
  /** Body height in px before the stream scrolls inside itself. */
  maxHeight?: number
  /** Take the panel's remaining height instead of a fixed one. */
  fill?: boolean
}) {
  const rows = limit ? alerts.slice(0, limit) : alerts

  if (rows.length === 0) {
    return (
      <EmptyState
        title="No alerts in this window"
        body="Nothing has deviated from its baseline here. Widen the time window or lower the severity threshold to see more."
      />
    )
  }

  return (
    <ul
      className={cn(
        'divide-line panel-scroll divide-y overflow-y-auto overscroll-contain',
        fill && 'h-full min-h-[220px] flex-1',
      )}
      style={fill ? undefined : { maxHeight }}
    >
      {rows.map((alert) => {
        const Icon = ICON[alert.severity]
        return (
          <li key={alert.id}>
            <div
              role={onSelect ? 'button' : undefined}
              tabIndex={onSelect ? 0 : undefined}
              onClick={() => onSelect?.(alert)}
              onKeyDown={(e) => {
                if (onSelect && (e.key === 'Enter' || e.key === ' ')) {
                  e.preventDefault()
                  onSelect(alert)
                }
              }}
              className={cn(
                'flex items-start gap-3 px-1 py-2.5',
                onSelect && 'hover:bg-paper-deep cursor-pointer',
                selectedId === alert.id && 'bg-paper-deep',
              )}
            >
              <Icon size={16} strokeWidth={1.9} className="mt-0.5 shrink-0" style={{ color: SEVERITY_COLOR[alert.severity] }} />

              <div className="min-w-0 flex-1">
                <p className="truncate text-[13px] font-medium">{alert.title}</p>
                <p className="text-ink-soft truncate text-[12px]">
                  {alert.siteName} · {alert.sourceLabel} · {alert.state}
                </p>
                <p className="text-ink-faint tnum mt-0.5 font-mono text-[11px]">
                  {alert.currentFrp} MW against a normal {alert.normalLow}–{alert.normalHigh} MW
                  {!showConfidence && alert.deviationPct > 0 && ` · +${alert.deviationPct}%`}
                  {showConfidence && ` · confidence ${alert.confidence.toFixed(2)}`}
                </p>
                {showConfidence && alert.deviationPct > 0 && (
                  <span
                    className="tnum mt-1 inline-flex rounded-full px-1.5 py-0.5 font-mono text-[10.5px]"
                    style={{
                      color: SEVERITY_COLOR[alert.severity],
                      backgroundColor: `${SEVERITY_COLOR[alert.severity]}1f`,
                    }}
                  >
                    +{alert.deviationPct}% over normal
                  </span>
                )}
              </div>

              <div className="flex shrink-0 flex-col items-end gap-1.5">
                <span className="text-ink-faint tnum font-mono text-[10.5px]">{relativeTime(alert.minutesAgo)}</span>
                {renderActions ? (
                  renderActions(alert)
                ) : alert.status === 'acknowledged' ? (
                  <span className="text-ink-faint inline-flex items-center gap-1 text-[10.5px]">
                    <Check size={11} /> acknowledged
                  </span>
                ) : (
                  onAcknowledge && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation()
                        onAcknowledge(alert)
                      }}
                      className="border-line hover:border-ink-faint rounded-full border px-2 py-0.5 text-[10.5px]"
                    >
                      Acknowledge
                    </button>
                  )
                )}
              </div>
            </div>
          </li>
        )
      })}
    </ul>
  )
}
