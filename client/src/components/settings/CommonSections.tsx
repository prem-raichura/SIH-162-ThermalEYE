/**
 * The sections every role shares: how readings are shown, how data leaves, which alerts get
 * through, and who is signed in.
 *
 * These read and write the draft, so nothing here moves a dashboard until Save is pressed.
 */
import { LogOut } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { SettingsSection, ChoiceRow, NumberField, SelectRow, SettingRow } from './controls'
import { LAYERS, type LayerId } from '@/store/useLayers'
import { useRoleStore } from '@/store/useRole'
import { useRoleSettings, useDraftFor } from '@/store/useRoleSettings'
import { useTheme } from '@/store/useTheme'
import { DEFAULT_ROLE_SETTINGS, type FieldMeta } from '@/lib/roleSettings'
import { HISTORY, RECENT } from '@/lib/timeWindows'
import type { Role } from '@/lib/roles'
import type { TimeWindow } from '@/lib/types'

const WINDOWS = [...RECENT, ...HISTORY].map((o) => ({ id: o.id as TimeWindow, label: o.full }))

const TABLE_ROWS: FieldMeta = {
  label: 'Rows per table',
  hint: 'How many records a list shows before it scrolls.',
  min: 10,
  max: 200,
  step: 5,
}

/** Reset helper: puts one role's common fields back without touching its thresholds. */
function useResetCommon(role: Role) {
  const patch = useRoleSettings((s) => s.patch)
  return (keys: string[]) => {
    const defaults = DEFAULT_ROLE_SETTINGS[role.id] as unknown as Record<string, unknown>
    patch(role.id, Object.fromEntries(keys.map((k) => [k, defaults[k]])) as never)
  }
}

export function DisplaySection({ role }: { role: Role }) {
  const draft = useDraftFor(role.id)
  const patch = useRoleSettings((s) => s.patch)
  const reset = useResetCommon(role)
  const mode = useTheme((s) => s.mode)
  const toggleTheme = useTheme((s) => s.toggle)

  const toggleLayer = (id: LayerId) => {
    const on = draft.defaultLayers.includes(id)
    patch(role.id, {
      defaultLayers: on ? draft.defaultLayers.filter((l) => l !== id) : [...draft.defaultLayers, id],
    })
  }

  return (
    <SettingsSection
      title="Display"
      subtitle="How readings are shown across this role"
      onReset={() => reset(['units', 'defaultWindow', 'defaultLayers', 'density'])}
    >
      <ChoiceRow
        label="Temperature unit"
        hint="Retrieval is in kelvin; Celsius is a display conversion."
        options={[
          { id: 'K', label: 'Kelvin' },
          { id: 'C', label: 'Celsius' },
        ]}
        value={draft.units}
        onChange={(units) => patch(role.id, { units })}
      />

      <SelectRow
        label="Default time window"
        hint="What the filters open on when this role is loaded."
        options={WINDOWS}
        value={draft.defaultWindow}
        onChange={(defaultWindow) => patch(role.id, { defaultWindow })}
        width="w-[178px]"
      />

      <ChoiceRow
        label="Row density"
        hint="Compact fits more records on screen at a smaller type size."
        options={[
          { id: 'comfortable', label: 'Comfortable' },
          { id: 'compact', label: 'Compact' },
        ]}
        value={draft.density}
        onChange={(density) => patch(role.id, { density })}
      />

      {/* The theme is a property of the browser, not of the role, so it applies at once and
          deliberately sits outside the draft. */}
      <SettingRow label="Dark theme" hint="Applies immediately; it is a browser preference, not a saved setting.">
        <Switch checked={mode === 'dark'} onCheckedChange={toggleTheme} aria-label="Dark theme" />
      </SettingRow>

      <div className="border-line mt-1 border-t pt-3">
        <p className="text-[12.5px] font-medium">Default map layers</p>
        <p className="text-ink-faint mt-0.5 text-[11.5px]">What is switched on when a map first loads.</p>
        <ul className="divide-line mt-1.5 divide-y">
          {LAYERS.map((layer) => (
            <li key={layer.id} className="flex items-center justify-between gap-4 py-2">
              <span className="text-[12.5px]">{layer.label}</span>
              <Switch
                checked={draft.defaultLayers.includes(layer.id)}
                onCheckedChange={() => toggleLayer(layer.id)}
                aria-label={layer.label}
              />
            </li>
          ))}
        </ul>
      </div>
    </SettingsSection>
  )
}

export function DataSection({ role }: { role: Role }) {
  const draft = useDraftFor(role.id)
  const patch = useRoleSettings((s) => s.patch)
  const reset = useResetCommon(role)

  return (
    <SettingsSection
      title="Data and export"
      subtitle="How much is listed, and what leaves in a download"
      onReset={() => reset(['tableRows', 'exportFormat'])}
    >
      <NumberField
        meta={TABLE_ROWS}
        value={draft.tableRows}
        onChange={(tableRows) => patch(role.id, { tableRows })}
      />

      <ChoiceRow
        label="Export format"
        hint="What an export writes. Both carry the same fields."
        options={[
          { id: 'csv', label: 'CSV' },
          { id: 'json', label: 'JSON' },
        ]}
        value={draft.exportFormat}
        onChange={(exportFormat) => patch(role.id, { exportFormat })}
      />
    </SettingsSection>
  )
}

/** Only for roles that actually carry an alert list. */
export function AlertingSection({ role, note }: { role: Role; note?: string }) {
  const draft = useDraftFor(role.id)
  const patch = useRoleSettings((s) => s.patch)
  const reset = useResetCommon(role)

  return (
    <SettingsSection
      title="Alerting"
      subtitle="Which alerts reach this role's feed"
      onReset={() => reset(['alertMinSeverity'])}
    >
      <ChoiceRow
        label="Severity floor"
        hint="Alerts below this tier stay out of the list. Severity itself is set upstream."
        options={[
          { id: 'all', label: 'All' },
          { id: 'medium', label: 'Medium and up' },
          { id: 'high', label: 'High only' },
        ]}
        value={draft.alertMinSeverity}
        onChange={(alertMinSeverity) => patch(role.id, { alertMinSeverity })}
      />
      {note && <p className="text-ink-faint mt-3 text-[11.5px]">{note}</p>}
    </SettingsSection>
  )
}

export function AccountSection({ role, children }: { role: Role; children?: React.ReactNode }) {
  const navigate = useNavigate()
  const email = useRoleStore((s) => s.email)
  const signOut = useRoleStore((s) => s.signOut)

  const rows: [string, string][] = [
    ['Signed in as', email ?? '—'],
    ['Organisation', role.org],
    ['Role code', role.short],
  ]

  return (
    <SettingsSection title="Account" subtitle="This session, and where its settings live">
      <dl className="divide-line divide-y">
        {rows.map(([label, value]) => (
          <div key={label} className="flex items-center justify-between gap-6 py-2.5">
            <dt className="text-ink-soft text-[12.5px]">{label}</dt>
            <dd className="truncate text-[12.5px] font-medium">{value}</dd>
          </div>
        ))}
      </dl>

      <p className="text-ink-faint mt-3 text-[11.5px]">
        Settings are stored in this browser under this role only, and nothing here leaves the machine. Every figure in
        the dashboards is pre-computed from the collected dataset.
      </p>

      {children}

      <div className="mt-4">
        <Button
          size="sm"
          variant="outline"
          className="gap-1.5 rounded-[9px]"
          onClick={() => {
            signOut()
            navigate('/login')
          }}
        >
          <LogOut size={13} strokeWidth={1.8} />
          Log out
        </Button>
      </div>
    </SettingsSection>
  )
}
