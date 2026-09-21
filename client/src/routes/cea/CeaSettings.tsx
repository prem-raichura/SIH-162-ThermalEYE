import { SettingsPage } from '@/components/settings/SettingsPage'
import { ThresholdsSection } from '@/components/settings/ThresholdsSection'
import {
  AccountSection,
  AlertingSection,
  DataSection,
  DisplaySection,
} from '@/components/settings/CommonSections'
import { useSettingsFor } from '@/store/useRoleSettings'
import { useCeaSites } from './useCeaData'
import { nf } from '@/lib/format'
import type { Role } from '@/lib/roles'

export function CeaSettings({ role }: { role: Role }) {
  const { filtered } = useCeaSites()
  const saved = useSettingsFor('cea')
  const rising = filtered.filter((s) => s.frpSlope > saved.risingSlope).length
  const withHistory = filtered.filter((s) => s.detectionCount > saved.historyMinDetections).length

  return (
    <SettingsPage
      role={role}
      description="What counts as a station trending up, and how much record a baseline needs before it is trusted. Both were two different numbers on two pages; they are one number here."
      meta={[
        { label: 'Rising now', value: nf(rising) },
        { label: 'With history', value: nf(withHistory) },
      ]}
    >
      <ThresholdsSection
        role={role}
        title="Station thresholds"
        subtitle="Trend and baseline cutoffs applied across the power branch"
      />
      <DisplaySection role={role} />
      <AlertingSection role={role} />
      <DataSection role={role} />
      <AccountSection role={role} />
    </SettingsPage>
  )
}
