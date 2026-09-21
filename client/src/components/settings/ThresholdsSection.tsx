/**
 * A role's threshold panel, generated from FIELD_META.
 *
 * Each entry is a number some page compares a stored per-record value against, so every
 * slider here re-filters or re-bands real records rather than restyling a label.
 */
import { SettingsSection, NumberField } from './controls'
import { useRoleSettings, useDraftFor } from '@/store/useRoleSettings'
import { DEFAULT_ROLE_SETTINGS, FIELD_META, formatSetting, type FieldMeta } from '@/lib/roleSettings'
import { logLine } from '@/store/useConsole'
import type { Role } from '@/lib/roles'

export function ThresholdsSection({
  role,
  title = 'Thresholds',
  subtitle,
  className,
}: {
  role: Role
  title?: string
  subtitle?: string
  className?: string
}) {
  // The per-role field maps are keyed by that role's own numeric fields; erasing to a string
  // map is what lets one component render all eight.
  const draft = useDraftFor(role.id) as unknown as Record<string, number>
  const patch = useRoleSettings((s) => s.patch)
  const fields = Object.entries(FIELD_META[role.id] as unknown as Record<string, FieldMeta>)

  if (fields.length === 0) return null

  const reset = () => {
    const defaults = DEFAULT_ROLE_SETTINGS[role.id] as unknown as Record<string, unknown>
    patch(role.id, Object.fromEntries(fields.map(([key]) => [key, defaults[key]])) as never)
    logLine(role.id, 'Thresholds returned to the shipped defaults \u2014 not saved yet')
  }

  return (
    <SettingsSection title={title} subtitle={subtitle} onReset={reset} className={className}>
      {fields.map(([key, meta]) => (
        <NumberField
          key={key}
          meta={meta}
          value={draft[key]}
          onChange={(value) => patch(role.id, { [key]: value } as never)}
          onCommit={() => logLine(role.id, `${meta.label} set to ${formatSetting(draft[key], meta)}`)}
        />
      ))}
    </SettingsSection>
  )
}
