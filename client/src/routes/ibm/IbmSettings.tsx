import { SettingsPage } from '@/components/settings/SettingsPage'
import { ThresholdsSection } from '@/components/settings/ThresholdsSection'
import { AccountSection, DataSection, DisplaySection } from '@/components/settings/CommonSections'
import { useSettingsFor } from '@/store/useRoleSettings'
import { SUBTYPE_NOTE, fireSubtype, useIbmSites } from './useIbmData'
import { nf } from '@/lib/format'
import type { Role } from '@/lib/roles'

export function IbmSettings({ role }: { role: Role }) {
  const { filtered } = useIbmSites()
  const saved = useSettingsFor('ibm')
  const seam = filtered.filter((s) => fireSubtype(s, saved) === 'coal-seam-like').length
  const dump = filtered.filter((s) => fireSubtype(s, saved) === 'waste-dump-like').length

  return (
    <SettingsPage
      role={role}
      description="The subtype rule is stated, not assumed — and now it is editable. Move a bound and every mine site is re-read against the new rule."
      meta={[
        { label: 'Seam-like', value: nf(seam) },
        { label: 'Dump-like', value: nf(dump) },
        { label: 'Episodic', value: nf(filtered.length - seam - dump) },
      ]}
    >
      <ThresholdsSection role={role} title="Fire subtype and discovery" subtitle={SUBTYPE_NOTE} />
      <DisplaySection role={role} />
      <DataSection role={role} />
      <AccountSection role={role} />
    </SettingsPage>
  )
}
