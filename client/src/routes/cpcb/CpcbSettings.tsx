import { SettingsPage } from '@/components/settings/SettingsPage'
import { ThresholdsSection } from '@/components/settings/ThresholdsSection'
import { AccountSection, DataSection, DisplaySection } from '@/components/settings/CommonSections'
import { useSettingsFor } from '@/store/useRoleSettings'
import { unmapped } from '@/lib/data'
import { nf } from '@/lib/format'
import type { Role } from '@/lib/roles'

/** Settings change what the other pages actually do — nothing here is decorative. */
export function CpcbSettings({ role }: { role: Role }) {
  const saved = useSettingsFor('cpcb')
  const listed = unmapped.filter((u) => u.coverageQualityScore >= saved.minCoverageQuality).length

  return (
    <SettingsPage
      role={role}
      description="Thresholds for the industrial branch. Every value here is compared against a stored per-site reading, so moving one re-counts the tables and tiles the moment it is saved."
      meta={[
        { label: 'Candidates listed', value: nf(listed) },
        { label: 'Of', value: nf(unmapped.length) },
      ]}
    >
      <ThresholdsSection
        role={role}
        subtitle="What counts as a gap in the register, and how hard a candidate has to work to be listed"
      />
      <DisplaySection role={role} />
      <DataSection role={role} />
      <AccountSection role={role} />
    </SettingsPage>
  )
}
