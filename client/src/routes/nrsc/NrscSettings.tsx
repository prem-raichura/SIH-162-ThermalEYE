import { SettingsPage } from '@/components/settings/SettingsPage'
import { ThresholdsSection } from '@/components/settings/ThresholdsSection'
import { AccountSection, DataSection, DisplaySection } from '@/components/settings/CommonSections'
import { SettingsSection, SettingRow } from '@/components/settings/controls'
import { ColumnChooser } from '@/components/panels/SiteTable'
import { Button } from '@/components/ui/button'
import { RotateCcw } from 'lucide-react'
import { DEFAULT_PROVENANCE, useNrsc } from '@/store/useNrsc'
import { useNrscData } from './useNrscData'
import { nf } from '@/lib/format'
import type { Role } from '@/lib/roles'

const FLOORS = [
  {
    key: 'minSarQuality' as const,
    label: 'Minimum SAR quality',
    hint: 'A record below this Sentinel-1 score is withheld from the published layer.',
    min: 0,
    max: 0.95,
    step: 0.05,
    digits: 2,
  },
  {
    key: 'minOpticalQuality' as const,
    label: 'Minimum optical quality',
    hint: 'The same floor for Sentinel-2. A site with no optical acquisition is excluded once this is above zero.',
    min: 0,
    max: 0.95,
    step: 0.05,
    digits: 2,
  },
  {
    key: 'maxCloudFraction' as const,
    label: 'Cloud fraction ceiling',
    hint: 'How much cloud an optical acquisition may carry and still be published.',
    min: 0,
    max: 1,
    step: 0.05,
    digits: 2,
  },
  {
    key: 'maxTemporalGap' as const,
    label: 'Temporal gap ceiling',
    hint: 'The largest acceptable gap since the last usable acquisition, in days.',
    min: 0,
    max: 90,
    step: 5,
    digits: 0,
  },
]

/**
 * NRSC republishes the site layer, so its settings are publication policy: what quality a
 * record must carry to go out, and which fields ride with it. These write straight to the
 * provenance store the layer already reads.
 */
export function NrscSettings({ role }: { role: Role }) {
  const { filtered, published } = useNrscData()
  const provenance = useNrsc((s) => s.provenance)
  const setProvenance = useNrsc((s) => s.setProvenance)
  const resetProvenance = useNrsc((s) => s.resetProvenance)
  const columns = useNrsc((s) => s.columns)
  const setColumns = useNrsc((s) => s.setColumns)

  return (
    <SettingsPage
      role={role}
      description="Publication policy for the site layer. Every floor here is checked against a stored provenance score, so tightening one withholds records immediately and the counts say how many."
      meta={[
        { label: 'Published', value: nf(published.length) },
        { label: 'Of', value: nf(filtered.length) },
        { label: 'Withheld', value: nf(filtered.length - published.length) },
      ]}
    >
      <SettingsSection
        title="Quality floors"
        subtitle="What a record must carry before it is republished"
        onReset={() => {
          resetProvenance()
        }}
      >
        {FLOORS.map((f) => (
          <SettingRow
            key={f.key}
            label={f.label}
            value={provenance[f.key].toFixed(f.digits)}
            hint={f.hint}
          >
            <input
              type="range"
              min={f.min}
              max={f.max}
              step={f.step}
              value={provenance[f.key]}
              onChange={(e) => setProvenance(f.key, Number(e.target.value))}
              aria-label={f.label}
              style={{ accentColor: 'var(--role-accent)' }}
              className="w-44"
            />
          </SettingRow>
        ))}
      </SettingsSection>

      <SettingsSection title="Published fields" subtitle="Which columns ride with every republished record">
        <SettingRow label="Columns" hint="The cross-publication table and every export open on this set.">
          <ColumnChooser value={columns} onChange={setColumns} />
        </SettingRow>
        <div className="mt-3">
          <Button
            size="sm"
            variant="outline"
            className="gap-1.5 rounded-[9px]"
            onClick={() => {
              setProvenance('register', DEFAULT_PROVENANCE.register)
              resetProvenance()
            }}
          >
            <RotateCcw size={13} strokeWidth={1.8} />
            Reset publication policy
          </Button>
        </div>
      </SettingsSection>

      <ThresholdsSection
        role={role}
        title="Quality reporting"
        subtitle="How the data-quality page reads the same records"
      />
      <DisplaySection role={role} />
      <DataSection role={role} />
      <AccountSection role={role} />
    </SettingsPage>
  )
}
