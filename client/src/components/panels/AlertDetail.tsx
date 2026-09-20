import type { ReactNode } from 'react'
import { Radio, ShieldAlert, Sigma } from 'lucide-react'
import { ThermalMap } from '@/components/map/ThermalMap'
import { EmptyState } from './EmptyState'
import { SEVERITY_COLOR } from '@/lib/thermal'
import { SEVERITY_LABEL, type Routing } from '@/lib/severity'
import { megawatt, relativeTime } from '@/lib/format'
import type { Alert, ThermalSite } from '@/lib/types'
import type { Role } from '@/lib/roles'

/**
 * Alert Location Details. The evidence is split the way section 29 asks for it: what the
 * thermal signal itself says, kept apart from what the surroundings say, so a reader can see
 * the verdict would survive without the context features.
 */
export function AlertDetail({
  role,
  alert,
  site,
  routing,
  showThumbnail = true,
  emptyBody = 'Pick an alert from the stream. Its location, what it is doing against its own normal, and the evidence behind the classification open here.',
  compactEmpty = false,
  actions,
  footer,
}: {
  role: Role
  alert: Alert | null
  site: ThermalSite | undefined
  routing?: Routing
  showThumbnail?: boolean
  /** What to say when nothing is picked — the map console reaches alerts differently. */
  emptyBody?: string
  /** Tighter empty state, for the floating docks on a map console. */
  compactEmpty?: boolean
  actions?: ReactNode
  footer?: ReactNode
}) {
  if (!alert) {
    return (
      <EmptyState title="No alert selected" body={emptyBody} compact={compactEmpty} />
    )
  }

  const color = SEVERITY_COLOR[alert.severity]

  return (
    <div className="flex min-w-0 flex-col gap-3">
      <div className="flex flex-wrap items-start gap-x-3 gap-y-1.5">
        <span
          className="mt-0.5 inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-medium"
          style={{ color, backgroundColor: `${color}1f` }}
        >
          <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: color }} />
          {SEVERITY_LABEL[alert.severity]} severity
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-[14px] font-medium">{alert.title}</p>
          <p className="text-ink-soft truncate text-[12.5px]">
            {alert.siteName} · {alert.state} · {relativeTime(alert.minutesAgo)}
          </p>
        </div>
      </div>

      {showThumbnail && site && (
        <ThermalMap
          role={role}
          sites={[site]}
          unmapped={[]}
          alerts={[alert]}
          shape="square"
          controls={false}
          className="max-h-[300px] min-h-[260px]"
          availableLayers={['thermal', 'sites', 'alerts', 'boundary']}
        />
      )}

      <dl className="border-line divide-line grid grid-cols-2 divide-x rounded-[10px] border">
        <Cell label="Classified as" value={alert.sourceLabel} sub={`confidence ${alert.confidence.toFixed(2)}`} />
        <Cell
          label="Current FRP"
          value={megawatt(alert.currentFrp)}
          sub={`normal ${alert.normalLow}–${alert.normalHigh} MW`}
          accent={color}
        />
      </dl>

      <p className="text-ink-soft text-[12px]">
        {alert.deviationPct > 0
          ? `This pass sits ${alert.deviationPct}% above this site's own normal ceiling.`
          : 'This pass sits inside the site’s own normal range.'}
        {site?.behaviour === 'normal' &&
          ' The site’s 30-day behaviour is still normal — this is a single-pass excursion, not a sustained change.'}
      </p>

      {routing && (
        <p className="text-ink-faint inline-flex items-center gap-1.5 text-[11.5px]">
          <Radio size={12} strokeWidth={1.9} />
          Routed to {routing.label}
        </p>
      )}

      <div className="grid gap-3 sm:grid-cols-2">
        <Evidence
          icon={<Sigma size={13} strokeWidth={1.9} />}
          title="Model evidence"
          note="From the thermal signal alone"
          items={alert.evidenceModel}
        />
        <Evidence
          icon={<ShieldAlert size={13} strokeWidth={1.9} />}
          title="Contextual evidence"
          note="From the surroundings, never the verdict on its own"
          items={alert.evidenceContext}
        />
      </div>

      {actions}
      {footer}
    </div>
  )
}

function Cell({ label, value, sub, accent }: { label: string; value: string; sub: string; accent?: string }) {
  return (
    <div className="px-3 py-2.5">
      <dt className="text-ink-faint text-[10px] tracking-[0.1em] uppercase">{label}</dt>
      <dd className="tnum mt-1 font-mono text-[14px]" style={accent ? { color: accent } : undefined}>
        {value}
      </dd>
      <p className="text-ink-soft tnum mt-0.5 font-mono text-[11px]">{sub}</p>
    </div>
  )
}

function Evidence({
  icon,
  title,
  note,
  items,
}: {
  icon: ReactNode
  title: string
  note: string
  items: { feature: string; note: string }[]
}) {
  return (
    <section className="border-line rounded-[10px] border px-3 py-2.5">
      <h4 className="flex items-center gap-1.5 text-[12.5px] font-semibold">
        {icon}
        {title}
      </h4>
      <p className="text-ink-faint mt-0.5 text-[11px]">{note}</p>
      <ul className="mt-2 space-y-2">
        {items.map((item) => (
          <li key={item.feature}>
            <p className="tnum font-mono text-[11px]">{item.feature}</p>
            <p className="text-ink-soft text-[12px]">{item.note}</p>
          </li>
        ))}
      </ul>
    </section>
  )
}
