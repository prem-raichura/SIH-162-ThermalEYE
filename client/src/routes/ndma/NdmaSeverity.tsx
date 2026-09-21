import { useMemo } from 'react'
import { RotateCcw } from 'lucide-react'
import { PageHeader } from '@/components/shell/PageHeader'
import { Panel } from '@/components/panels/Panel'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useNdmaFeed } from './useNdmaData'
import { useNdma } from '@/store/useNdma'
import {
  DEFAULT_SEVERITY_CONFIG,
  ROUTES,
  SEVERITY_LABEL,
  SEVERITY_ORDER,
  severityFor,
  type RouteId,
} from '@/lib/severity'
import { CLASS_LABELS } from '@/lib/classes'
import { SEVERITY_COLOR } from '@/lib/thermal'
import { alerts as allAlerts } from '@/lib/data'
import { nf } from '@/lib/format'
import { cn } from '@/lib/utils'
import type { Severity } from '@/lib/types'
import type { Role } from '@/lib/roles'

const HOURS = Array.from({ length: 24 }, (_, i) => i)

/**
 * Routing policy. Everything here changes the live feed the moment it moves — the counts on
 * this page are the same ones the duty officer is looking at, not a preview of them.
 */
export function NdmaSeverity({ role }: { role: Role }) {
  const feed = useNdmaFeed()
  const config = useNdma((s) => s.config)
  const setBand = useNdma((s) => s.setBand)
  const setMinConfidence = useNdma((s) => s.setMinConfidence)
  const toggleClass = useNdma((s) => s.toggleClass)
  const setQuietHours = useNdma((s) => s.setQuietHours)
  const setRoute = useNdma((s) => s.setRoute)
  const resetConfig = useNdma((s) => s.resetConfig)

  const routed = useMemo(() => {
    const out: Record<Severity, number> = { high: 0, medium: 0, low: 0 }
    for (const a of feed.binned) if (a.suppressed === null) out[a.severity] += 1
    return out
  }, [feed.binned])

  const shipped = useMemo(() => {
    const out: Record<Severity, number> = { high: 0, medium: 0, low: 0 }
    for (const a of allAlerts) out[severityFor(a.deviationPct, DEFAULT_SEVERITY_CONFIG)] += 1
    return out
  }, [])

  const total = Math.max(routed.high + routed.medium + routed.low, 1)

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        role={role}
        eyebrow="Policy"
        title="Severity settings"
        description="Severity is distance from a site's own normal ceiling. Move a band and the live list re-bins immediately — nothing on this page is decorative."
        meta={[
          { label: 'Alerts', value: nf(allAlerts.length) },
          { label: 'Routed', value: nf(total) },
          { label: 'Suppressed', value: nf(feed.suppressedCount) },
        ]}
      />

      <Panel
        title="Current binning"
        subtitle={`Shipped defaults bin these same alerts as ${shipped.high} high · ${shipped.medium} medium · ${shipped.low} low`}
        action={
          <Button
            size="sm"
            variant="outline"
            className="gap-1.5 rounded-[9px]"
            onClick={() => {
              resetConfig()
            }}
          >
            <RotateCcw size={13} strokeWidth={1.8} />
            Reset
          </Button>
        }
      >
        <div className="flex h-7 w-full overflow-hidden rounded-[8px]">
          {SEVERITY_ORDER.map((severity) => (
            <div
              key={severity}
              className="flex items-center justify-center text-[11px] font-medium text-white transition-[width] duration-300"
              style={{ width: `${(routed[severity] / total) * 100}%`, backgroundColor: SEVERITY_COLOR[severity] }}
            >
              {routed[severity] > 0 && nf(routed[severity])}
            </div>
          ))}
        </div>
        <div className="text-ink-soft mt-2 flex flex-wrap gap-x-5 gap-y-1 text-[12px]">
          {SEVERITY_ORDER.map((severity) => (
            <span key={severity} className="inline-flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full" style={{ backgroundColor: SEVERITY_COLOR[severity] }} />
              {SEVERITY_LABEL[severity]} <span className="tnum font-mono">{nf(routed[severity])}</span>
            </span>
          ))}
          <span>
            Suppressed <span className="tnum font-mono">{nf(feed.suppressedCount)}</span>
          </span>
        </div>
      </Panel>

      <div className="grid gap-3 lg:grid-cols-2">
        <Panel title="Deviation bands" subtitle="Percent above the site's own normal ceiling">
          <Row
            label="High severity at or above"
            hint="Pages the state EOC whatever the hour."
            value={`${config.highPct}%`}
          >
            <input
              type="range"
              min={60}
              max={320}
              step={5}
              value={config.highPct}
              onChange={(e) => setBand('highPct', Number(e.target.value))}
              className="accent-terracotta w-48"
            />
          </Row>
          <Row label="Medium severity at or above" hint="Everything below this band is logged as low." value={`${config.mediumPct}%`}>
            <input
              type="range"
              min={5}
              max={200}
              step={5}
              value={config.mediumPct}
              onChange={(e) => setBand('mediumPct', Number(e.target.value))}
              className="accent-terracotta w-48"
            />
          </Row>
          <Row
            label="Minimum confidence"
            hint="Below this, the classifier is not sure enough to page anyone; the alert stays in the record."
            value={config.minConfidence.toFixed(2)}
          >
            <input
              type="range"
              min={0}
              max={0.95}
              step={0.05}
              value={config.minConfidence}
              onChange={(e) => setMinConfidence(Number(e.target.value))}
              className="accent-terracotta w-48"
            />
          </Row>
        </Panel>

        <Panel title="Routing" subtitle="Where each tier goes when it fires">
          {SEVERITY_ORDER.map((severity) => (
            <Row
              key={severity}
              label={`${SEVERITY_LABEL[severity]} severity`}
              hint={ROUTES.find((r) => r.id === config.routing[severity])?.detail}
            >
              <Select
                value={config.routing[severity]}
                onValueChange={(value) => {
                  setRoute(severity, value as RouteId)
                }}
              >
                <SelectTrigger className="h-8 w-[200px] text-[12.5px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ROUTES.map((r) => (
                    <SelectItem key={r.id} value={r.id}>
                      {r.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Row>
          ))}

          <Row
            label="Quiet hours"
            hint="Medium and low are held to the log overnight. High severity always pages."
            value={feed.quiet ? 'active now' : undefined}
          >
            <div className="flex items-center gap-2">
              <Switch
                checked={config.quietHours.enabled}
                onCheckedChange={(on) => {
                  setQuietHours({ enabled: on })
                }}
              />
              <HourSelect
                value={config.quietHours.from}
                disabled={!config.quietHours.enabled}
                onChange={(from) => {
                  setQuietHours({ from })
                }}
              />
              <span className="text-ink-faint text-[12px]">to</span>
              <HourSelect
                value={config.quietHours.to}
                disabled={!config.quietHours.enabled}
                onChange={(to) => {
                  setQuietHours({ to })
                }}
              />
            </div>
          </Row>
        </Panel>

        <Panel
          title="Class inclusion"
          subtitle="Classes switched off never reach the response feed"
          className="lg:col-span-2"
        >
          <div className="flex flex-wrap gap-1.5">
            {feed.classes.map((cls) => {
              const on = !config.excludedClasses.includes(cls)
              const count = allAlerts.filter((a) => a.sourceClass === cls).length
              return (
                <button
                  key={cls}
                  type="button"
                  onClick={() => {
                    toggleClass(cls)
                  }}
                  className={cn(
                    'border-line rounded-full border px-2.5 py-1 text-[11.5px]',
                    on ? 'bg-paper-deep' : 'text-ink-faint line-through',
                  )}
                >
                  {CLASS_LABELS[cls]} <span className="tnum font-mono">{nf(count)}</span>
                </button>
              )
            })}
          </div>
          <p className="text-ink-faint mt-3 text-[11.5px]">
            Excluding a class hides it from the feed, not from the record. The alert is still counted as suppressed, so
            nobody can mistake a filtered view for an empty sky.
          </p>
        </Panel>
      </div>
    </div>
  )
}

function HourSelect({
  value,
  disabled,
  onChange,
}: {
  value: number
  disabled: boolean
  onChange: (hour: number) => void
}) {
  return (
    <Select value={String(value)} disabled={disabled} onValueChange={(v) => onChange(Number(v))}>
      <SelectTrigger className="h-8 w-[86px] text-[12.5px]">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {HOURS.map((h) => (
          <SelectItem key={h} value={String(h)}>
            {String(h).padStart(2, '0')}:00
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}

function Row({
  label,
  hint,
  value,
  children,
}: {
  label: string
  hint?: string
  value?: string
  children: React.ReactNode
}) {
  return (
    <div className="border-line flex items-start justify-between gap-6 border-b py-3 last:border-b-0">
      <div className="min-w-0">
        <p className="text-[12.5px] font-medium">
          {label}
          {value && <span className="text-ink-soft tnum ml-2 font-mono text-[12px]">{value}</span>}
        </p>
        {hint && <p className="text-ink-faint mt-0.5 text-[11.5px]">{hint}</p>}
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  )
}
