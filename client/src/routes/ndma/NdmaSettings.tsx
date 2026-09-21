import { SettingsPage } from '@/components/settings/SettingsPage'
import { AccountSection, DataSection, DisplaySection } from '@/components/settings/CommonSections'
import { SettingsSection, SettingRow, ChipGroup } from '@/components/settings/controls'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Button } from '@/components/ui/button'
import { RotateCcw } from 'lucide-react'
import { useNdma } from '@/store/useNdma'
import { useNdmaFeed } from './useNdmaData'
import { ROUTES, SEVERITY_LABEL, SEVERITY_ORDER, type RouteId } from '@/lib/severity'
import { CLASS_LABELS } from '@/lib/classes'
import { nf } from '@/lib/format'
import type { Role } from '@/lib/roles'

const HOURS = Array.from({ length: 24 }, (_, i) => i)

/**
 * NDMA's thresholds already live in useNdma, where they are persisted and re-bin the live
 * feed on every render. This page is the settings-shaped view of that same config — it does
 * not keep a second copy, which is why it saves as you go rather than through the draft bar.
 */
export function NdmaSettings({ role }: { role: Role }) {
  const feed = useNdmaFeed()
  const config = useNdma((s) => s.config)
  const setBand = useNdma((s) => s.setBand)
  const setMinConfidence = useNdma((s) => s.setMinConfidence)
  const toggleClass = useNdma((s) => s.toggleClass)
  const setQuietHours = useNdma((s) => s.setQuietHours)
  const setRoute = useNdma((s) => s.setRoute)
  const resetConfig = useNdma((s) => s.resetConfig)

  const included = feed.classes.filter((c) => !config.excludedClasses.includes(c))

  return (
    <SettingsPage
      role={role}
      description="Response policy. Severity is distance from a site's own normal ceiling, never a global FRP threshold — move a band and the live queue re-bins at once, because this page writes straight to the policy the feed reads."
      meta={[
        { label: 'Routed', value: nf(feed.visible.length) },
        { label: 'Suppressed', value: nf(feed.suppressedCount) },
      ]}
    >
      <SettingsSection
        title="Deviation bands"
        subtitle="Percent above the site's own normal ceiling"
        onReset={() => {
          resetConfig()
        }}
      >
        <SettingRow
          label="High severity at or above"
          value={`${config.highPct}%`}
          hint="Pages the state EOC whatever the hour."
        >
          <input
            type="range"
            min={60}
            max={320}
            step={5}
            value={config.highPct}
            onChange={(e) => setBand('highPct', Number(e.target.value))}
            aria-label="High severity band"
            style={{ accentColor: 'var(--role-accent)' }}
            className="w-44"
          />
        </SettingRow>

        <SettingRow
          label="Medium severity at or above"
          value={`${config.mediumPct}%`}
          hint="Everything below this band is logged as low. The bands cannot cross."
        >
          <input
            type="range"
            min={5}
            max={200}
            step={5}
            value={config.mediumPct}
            onChange={(e) => setBand('mediumPct', Number(e.target.value))}
            aria-label="Medium severity band"
            style={{ accentColor: 'var(--role-accent)' }}
            className="w-44"
          />
        </SettingRow>

        <SettingRow
          label="Minimum confidence"
          value={config.minConfidence.toFixed(2)}
          hint="Below this the classifier is not sure enough to page anyone; the alert stays in the record."
        >
          <input
            type="range"
            min={0}
            max={0.95}
            step={0.05}
            value={config.minConfidence}
            onChange={(e) => setMinConfidence(Number(e.target.value))}
            aria-label="Minimum confidence"
            style={{ accentColor: 'var(--role-accent)' }}
            className="w-44"
          />
        </SettingRow>
      </SettingsSection>

      <SettingsSection title="Routing" subtitle="Where each tier goes when it fires">
        {SEVERITY_ORDER.map((severity) => (
          <SettingRow
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
              <SelectTrigger className="h-8 w-[190px] text-[12.5px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ROUTES.map((r) => (
                  <SelectItem key={r.id} value={r.id} className="text-[12.5px]">
                    {r.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </SettingRow>
        ))}

        <SettingRow label="Quiet hours" hint="Holds medium and low pages overnight. A high alert always pages.">
          <Switch
            checked={config.quietHours.enabled}
            onCheckedChange={(enabled) => {
              setQuietHours({ enabled })
            }}
            aria-label="Quiet hours"
          />
        </SettingRow>

        <SettingRow label="Quiet window" hint="IST, opening inclusive and closing exclusive. Wraps past midnight.">
          <div className="flex items-center gap-2">
            <HourSelect
              value={config.quietHours.from}
              disabled={!config.quietHours.enabled}
              onChange={(from) => setQuietHours({ from })}
            />
            <span className="text-ink-faint text-[12px]">to</span>
            <HourSelect
              value={config.quietHours.to}
              disabled={!config.quietHours.enabled}
              onChange={(to) => setQuietHours({ to })}
            />
          </div>
        </SettingRow>
      </SettingsSection>

      <SettingsSection
        title="Feed membership"
        subtitle="Classes NDMA does not want in the response queue"
        className="lg:col-span-2"
      >
        <ChipGroup
          options={feed.classes.map((c) => ({ id: c, label: CLASS_LABELS[c] }))}
          selected={included}
          onToggle={(cls) => {
            toggleClass(cls)
          }}
        />
        <p className="text-ink-faint mt-3 text-[11.5px]">
          A struck-through class is suppressed: the alert stays in the record with its reason, it just never pages.
        </p>
      </SettingsSection>

      <DisplaySection role={role} />
      <DataSection role={role} />
      <AccountSection role={role}>
        <div className="mt-3">
          <Button
            size="sm"
            variant="outline"
            className="gap-1.5 rounded-[9px]"
            onClick={() => {
              resetConfig()
            }}
          >
            <RotateCcw size={13} strokeWidth={1.8} />
            Reset response policy
          </Button>
        </div>
      </AccountSection>
    </SettingsPage>
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
