/**
 * The settings vocabulary, in one place.
 *
 * Every idiom here already existed three times over — the label/hint row in two settings
 * pages, the range slider in three, the pill group in four. They are lifted rather than
 * reinvented so a new knob looks like every knob that shipped before it.
 */
import type { ReactNode } from 'react'
import { RotateCcw } from 'lucide-react'
import { Panel } from '@/components/panels/Panel'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { formatSetting, type FieldMeta } from '@/lib/roleSettings'
import { cn } from '@/lib/utils'

/** A labelled row with an optional hint under it and the control on the right. */
export function SettingRow({
  label,
  value,
  hint,
  children,
}: {
  label: string
  /** A readout that belongs beside the label rather than under the control. */
  value?: string
  hint?: string
  children: ReactNode
}) {
  return (
    <div className="border-line flex items-start justify-between gap-6 border-b py-3 last:border-b-0">
      <div className="min-w-0">
        <p className="text-[12.5px] font-medium">
          {label}
          {value && <span className="text-ink-soft tnum ml-2 font-mono text-[12px]">{value}</span>}
        </p>
        {hint && <p className="text-ink-faint mt-0.5 text-[11.5px]">{hint}</p>}
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  )
}

/**
 * A threshold. The accent follows the role rather than being hardcoded terracotta, and the
 * console line is written on release — dragging is not a decision.
 */
export function NumberField({
  meta,
  value,
  onChange,
  onCommit,
  width = 'w-44',
}: {
  meta: FieldMeta
  value: number
  onChange: (value: number) => void
  onCommit?: () => void
  width?: string
}) {
  return (
    <SettingRow label={meta.label} value={formatSetting(value, meta)} hint={meta.hint}>
      <input
        type="range"
        min={meta.min}
        max={meta.max}
        step={meta.step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        onMouseUp={onCommit}
        onTouchEnd={onCommit}
        onKeyUp={onCommit}
        aria-label={meta.label}
        style={{ accentColor: 'var(--role-accent)' }}
        className={cn('mt-1', width)}
      />
    </SettingRow>
  )
}

/** A short exclusive choice, as the capsule used by the map's time picker. */
export function ChoiceRow<T extends string>({
  label,
  hint,
  options,
  value,
  onChange,
}: {
  label: string
  hint?: string
  options: { id: T; label: string }[]
  value: T
  onChange: (id: T) => void
}) {
  return (
    <SettingRow label={label} hint={hint}>
      <div className="border-line flex rounded-full border p-1">
        {options.map((o) => (
          <button
            key={o.id}
            type="button"
            onClick={() => onChange(o.id)}
            aria-pressed={value === o.id}
            className={cn(
              'rounded-full px-3 py-1 text-[12px] whitespace-nowrap transition-colors',
              value === o.id ? 'bg-ink text-paper' : 'text-ink-soft hover:text-ink',
            )}
          >
            {o.label}
          </button>
        ))}
      </div>
    </SettingRow>
  )
}

/** A longer exclusive choice, where a capsule would not fit. */
export function SelectRow<T extends string>({
  label,
  hint,
  options,
  value,
  onChange,
  width = 'w-[170px]',
}: {
  label: string
  hint?: string
  options: { id: T; label: string }[]
  value: T
  onChange: (id: T) => void
  width?: string
}) {
  return (
    <SettingRow label={label} hint={hint}>
      <Select value={value} onValueChange={(v) => onChange(v as T)}>
        <SelectTrigger className={cn('h-8 text-[12.5px]', width)}>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {options.map((o) => (
            <SelectItem key={o.id} value={o.id} className="text-[12.5px]">
              {o.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </SettingRow>
  )
}

export function ToggleRow({
  label,
  hint,
  checked,
  onChange,
}: {
  label: string
  hint?: string
  checked: boolean
  onChange: (checked: boolean) => void
}) {
  return (
    <SettingRow label={label} hint={hint}>
      <Switch checked={checked} onCheckedChange={onChange} aria-label={label} />
    </SettingRow>
  )
}

/** A multi-select as pills. An excluded member stays visible, struck through. */
export function ChipGroup<T extends string>({
  options,
  selected,
  onToggle,
}: {
  options: { id: T; label: string }[]
  selected: T[]
  onToggle: (id: T) => void
}) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {options.map((o) => {
        const on = selected.includes(o.id)
        return (
          <button
            key={o.id}
            type="button"
            onClick={() => onToggle(o.id)}
            aria-pressed={on}
            className={cn(
              'border-line rounded-full border px-2.5 py-1 text-[11.5px] transition-colors',
              on ? 'bg-paper-deep' : 'text-ink-faint line-through',
            )}
          >
            {o.label}
          </button>
        )
      })}
    </div>
  )
}

/** A panel of settings, with the section's own reset in the header. */
export function SettingsSection({
  title,
  subtitle,
  onReset,
  className,
  children,
}: {
  title: string
  subtitle?: string
  onReset?: () => void
  className?: string
  children: ReactNode
}) {
  return (
    <Panel
      title={title}
      subtitle={subtitle}
      className={className}
      action={
        onReset && (
          <Button size="sm" variant="outline" className="gap-1.5 rounded-[9px]" onClick={onReset}>
            <RotateCcw size={13} strokeWidth={1.8} />
            Reset
          </Button>
        )
      }
    >
      {children}
    </Panel>
  )
}
