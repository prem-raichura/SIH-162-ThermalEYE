import { SettingsPage } from '@/components/settings/SettingsPage'
import { ThresholdsSection } from '@/components/settings/ThresholdsSection'
import {
  AccountSection,
  AlertingSection,
  DataSection,
  DisplaySection,
} from '@/components/settings/CommonSections'
import { SettingsSection, ChipGroup } from '@/components/settings/controls'
import { useRoleSettings, useDraftFor, useSettingsFor } from '@/store/useRoleSettings'
import { useFsiSites } from './useFsiData'
import { CLASS_LABELS } from '@/lib/classes'
import { NON_INDUSTRIAL_CLASSES } from '@/lib/data'
import { nf } from '@/lib/format'
import type { Role } from '@/lib/roles'
import type { SourceClass } from '@/lib/types'

export function FsiSettings({ role }: { role: Role }) {
  const { vegetation, industrial } = useFsiSites()
  const saved = useSettingsFor('fsi')
  const draft = useDraftFor('fsi')
  const patch = useRoleSettings((s) => s.patch)

  // The boundary is the whole argument of section 7.1: how much industrial heat would land
  // in a fire alert feed that only looked at brightness.
  const above = industrial.filter((s) => (s.deltaT ?? 0) > saved.deltaTBoundary).length

  const toggleClass = (cls: SourceClass) =>
    patch('fsi', {
      vegetationClasses: draft.vegetationClasses.includes(cls)
        ? draft.vegetationClasses.filter((c) => c !== cls)
        : [...draft.vegetationClasses, cls],
    })

  return (
    <SettingsPage
      role={role}
      description="Where industrial heat stops and vegetation burning starts. The separation boundary is the number that keeps a fire alert feed clean, so it is stated here rather than buried in a chart."
      meta={[
        { label: 'Vegetation sites', value: nf(vegetation.length) },
        { label: 'Industrial above ΔT', value: nf(above) },
      ]}
    >
      <ThresholdsSection
        role={role}
        title="Separation"
        subtitle="The ΔT boundary the scatter and the counters both read"
      />

      <SettingsSection
        title="Alert branch"
        subtitle="Which classes belong to this role's feed at all"
      >
        <ChipGroup
          options={NON_INDUSTRIAL_CLASSES.map((c) => ({ id: c, label: CLASS_LABELS[c] }))}
          selected={draft.vegetationClasses}
          onToggle={toggleClass}
        />
        <p className="text-ink-faint mt-3 text-[11.5px]">
          A class switched off leaves the event lists and the seasonal chart. The predicted class itself is fixed by the
          build — this decides what the role looks at, not what the model said.
        </p>
      </SettingsSection>

      <DisplaySection role={role} />
      <AlertingSection role={role} />
      <DataSection role={role} />
      <AccountSection role={role} />
    </SettingsPage>
  )
}
