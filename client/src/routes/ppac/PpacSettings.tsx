import { SettingsPage } from '@/components/settings/SettingsPage'
import { ThresholdsSection } from '@/components/settings/ThresholdsSection'
import {
  AccountSection,
  AlertingSection,
  DataSection,
  DisplaySection,
} from '@/components/settings/CommonSections'
import { useSettingsFor } from '@/store/useRoleSettings'
import { flareSignature, usePpacSites } from './usePpacData'
import { nf } from '@/lib/format'
import type { Role } from '@/lib/roles'

export function PpacSettings({ role }: { role: Role }) {
  const { flares } = usePpacSites()
  const saved = useSettingsFor('ppac')
  // The signature is five independent checks, so the honest readout is how many sites clear
  // all five under the values currently saved.
  const passing = flares.filter((s) => flareSignature(s, saved).every((c) => c.pass)).length

  return (
    <SettingsPage
      role={role}
      description="The flare signature of section 7.5, as five editable conditions. Each one is checked against the site's own retrieved values, so the verdict on every flare page follows what is set here."
      meta={[
        { label: 'Flares in view', value: nf(flares.length) },
        { label: 'Clearing all five', value: nf(passing) },
      ]}
    >
      <ThresholdsSection
        role={role}
        title="Flare signature"
        subtitle="A site has to clear every condition to read as a flare"
      />
      <DisplaySection role={role} />
      <AlertingSection
        role={role}
        note="Severity is assigned upstream from each site's own normal ceiling; this only decides what the refinery feed shows."
      />
      <DataSection role={role} />
      <AccountSection role={role} />
    </SettingsPage>
  )
}
