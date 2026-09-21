/**
 * The shell every role's Settings page is built on.
 *
 * Edits land in a draft; this is where they are committed. The bar only appears once
 * something actually differs from what is saved, and it says how much — a settings page that
 * silently applies as you drag cannot be reviewed before it changes what a desk sees.
 */
import type { ReactNode } from 'react'
import { Check, RotateCcw, Undo2 } from 'lucide-react'
import { PageHeader, type MetaItem } from '@/components/shell/PageHeader'
import { Button } from '@/components/ui/button'
import { useRoleSettings, useDirtyCount } from '@/store/useRoleSettings'
import { logLine } from '@/store/useConsole'
import type { Role } from '@/lib/roles'

export function SettingsPage({
  role,
  eyebrow = 'Preferences',
  title = 'Settings',
  description,
  meta,
  children,
}: {
  role: Role
  eyebrow?: string
  title?: string
  description: string
  meta?: MetaItem[]
  children: ReactNode
}) {
  const dirty = useDirtyCount(role.id)
  const save = useRoleSettings((s) => s.save)
  const discard = useRoleSettings((s) => s.discard)
  const resetDraft = useRoleSettings((s) => s.resetDraft)

  return (
    <div className="flex flex-col gap-4 pb-16">
      <PageHeader role={role} eyebrow={eyebrow} title={title} description={description} meta={meta} />

      <div className="grid gap-3 lg:grid-cols-2">{children}</div>

      {dirty > 0 && (
        <div className="pointer-events-none sticky bottom-3 z-20 flex justify-center">
          <div className="bg-card border-line pointer-events-auto flex items-center gap-3 rounded-full border px-3 py-2 shadow-lg">
            <span className="text-ink-soft pl-1.5 text-[12.5px]">
              {dirty} unsaved {dirty === 1 ? 'change' : 'changes'}
            </span>
            <Button
              size="sm"
              variant="ghost"
              className="h-7 gap-1.5 rounded-full px-2.5 text-[12px]"
              onClick={() => {
                resetDraft(role.id)
                logLine(role.id, 'Settings draft returned to the shipped defaults')
              }}
            >
              <RotateCcw size={13} strokeWidth={1.8} />
              Defaults
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="h-7 gap-1.5 rounded-full px-3 text-[12px]"
              onClick={() => {
                discard(role.id)
                logLine(role.id, 'Settings changes discarded')
              }}
            >
              <Undo2 size={13} strokeWidth={1.8} />
              Discard
            </Button>
            <Button
              size="sm"
              className="h-7 gap-1.5 rounded-full px-3 text-[12px]"
              onClick={() => {
                save(role.id)
                logLine(
                  role.id,
                  `Settings saved — ${dirty} ${dirty === 1 ? 'value' : 'values'} applied to the ${role.short} view`,
                )
              }}
            >
              <Check size={13} strokeWidth={2} />
              Save
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
