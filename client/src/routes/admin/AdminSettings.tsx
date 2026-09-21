import { useState } from 'react'
import { Trash2, TriangleAlert } from 'lucide-react'
import { SettingsPage } from '@/components/settings/SettingsPage'
import { ThresholdsSection } from '@/components/settings/ThresholdsSection'
import { AccountSection, DataSection, DisplaySection } from '@/components/settings/CommonSections'
import { SettingsSection } from '@/components/settings/controls'
import { Button } from '@/components/ui/button'
import { useRoleSettings } from '@/store/useRoleSettings'
import { ROLE_LIST } from '@/lib/roles'
import { model } from '@/lib/data'
import type { Role } from '@/lib/roles'

/** Every key this build writes. The danger zone clears the lot, session included. */
const STORAGE_KEYS = ['te.settings', 'te.ndma', 'te.nrsc', 'te.theme']

export function AdminSettings({ role }: { role: Role }) {
  const resetAll = useRoleSettings((s) => s.resetAll)
  const [armed, setArmed] = useState(false)

  return (
    <SettingsPage
      role={role}
      description="Workbench preferences and the banding the evaluation pages read. The model figures themselves are frozen build outputs — nothing here re-scores anything, it only decides where a number stops reading as healthy."
      meta={[
        { label: 'Macro-F1', value: model.macroF1.toFixed(3) },
        { label: 'Roles', value: String(ROLE_LIST.length) },
      ]}
    >
      <ThresholdsSection
        role={role}
        title="Score banding"
        subtitle="Where per-class F1 and regional accuracy change colour"
      />
      <DisplaySection role={role} />
      <DataSection role={role} />

      <SettingsSection title="Danger zone" subtitle="Applies across every role, not just this one">
        <div className="flex flex-col gap-3 py-1">
          <div className="flex items-start justify-between gap-6">
            <div className="min-w-0">
              <p className="text-[12.5px] font-medium">Reset every role to defaults</p>
              <p className="text-ink-faint mt-0.5 text-[11.5px]">
                Returns all eight settings blocks to the shipped values. Session and theme are left alone.
              </p>
            </div>
            <Button
              size="sm"
              variant="outline"
              className="shrink-0 gap-1.5 rounded-[9px]"
              onClick={() => {
                resetAll()
              }}
            >
              <TriangleAlert size={13} strokeWidth={1.8} />
              Reset all
            </Button>
          </div>

          <div className="border-line flex items-start justify-between gap-6 border-t pt-3">
            <div className="min-w-0">
              <p className="text-[12.5px] font-medium">Clear all stored state</p>
              <p className="text-ink-faint mt-0.5 text-[11.5px]">
                Removes every {'te.*'} key this build writes — settings, response policy, publication policy, theme and
                console layout. The page reloads to a fresh install.
              </p>
            </div>
            <Button
              size="sm"
              variant={armed ? 'destructive' : 'outline'}
              className="shrink-0 gap-1.5 rounded-[9px]"
              onClick={() => {
                if (!armed) {
                  setArmed(true)
                  return
                }
                for (const key of STORAGE_KEYS) localStorage.removeItem(key)
                window.location.reload()
              }}
            >
              <Trash2 size={13} strokeWidth={1.8} />
              {armed ? 'Confirm — clear' : 'Clear storage'}
            </Button>
          </div>
        </div>
      </SettingsSection>

      <AccountSection role={role} />
    </SettingsPage>
  )
}
