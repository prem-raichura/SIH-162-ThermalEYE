/**
 * Per-role settings, with an explicit save.
 *
 * Two copies are kept: `saved` is what every page reads, `draft` is what the settings form
 * edits. Nothing a user drags changes a dashboard until they press Save — a threshold is a
 * stated policy, and a half-dragged slider is not a policy.
 *
 * Each role's block is stored under its own key, so CPCB's coverage floor and NDMA's window
 * are genuinely separate settings rather than one global blob wearing eight hats.
 */
import { create } from 'zustand'
import {
  DEFAULT_ROLE_SETTINGS,
  type CommonSettings,
  type RoleSettingsMap,
  type SettingsFor,
} from '@/lib/roleSettings'
import { ROLE_ORDER, type RoleId } from '@/lib/roles'
import { useRoleStore } from './useRole'

const KEY = 'te.settings'

type Stored = { [K in RoleId]?: Partial<SettingsFor<K>> }

/** The shape this store replaced: one flat object every role shared. */
type LegacyStored = Partial<Pick<CommonSettings, 'units' | 'defaultWindow' | 'defaultLayers'>> & {
  minCoverageQuality?: number
}

const isLegacy = (raw: Stored | LegacyStored): raw is LegacyStored =>
  ROLE_ORDER.every((id) => !(id in raw)) && Object.keys(raw).length > 0

/**
 * Reads the stored blob, upgrading the old flat one on the way past. A value the old shape
 * held applied to whoever was signed in, so on migration it applies to everyone.
 */
function read(): Stored {
  let raw: Stored | LegacyStored
  try {
    raw = JSON.parse(localStorage.getItem(KEY) ?? '{}') as Stored | LegacyStored
  } catch {
    return {}
  }
  if (!isLegacy(raw)) return raw

  const { units, defaultWindow, defaultLayers, minCoverageQuality } = raw
  const common = { units, defaultWindow, defaultLayers }
  const next: Stored = {}
  for (const id of ROLE_ORDER) next[id] = { ...common } as Partial<SettingsFor<typeof id>>
  if (minCoverageQuality !== undefined) next.cpcb = { ...next.cpcb, minCoverageQuality }
  localStorage.setItem(KEY, JSON.stringify(next))
  return next
}

/** Defaults with whatever was stored laid over the top, so new fields arrive with defaults. */
function hydrate(): RoleSettingsMap {
  const stored = read()
  const out = {} as RoleSettingsMap
  for (const id of ROLE_ORDER) {
    // The index signature is lost once the key is a variable; the shapes line up by construction.
    ;(out as Record<RoleId, unknown>)[id] = {
      ...DEFAULT_ROLE_SETTINGS[id],
      ...(stored[id] ?? {}),
    }
  }
  return out
}

const clone = (all: RoleSettingsMap): RoleSettingsMap =>
  Object.fromEntries(ROLE_ORDER.map((id) => [id, { ...all[id] }])) as unknown as RoleSettingsMap

interface RoleSettingsState {
  saved: RoleSettingsMap
  draft: RoleSettingsMap
  /** Edits the draft only. The dashboards do not move until save(). */
  patch: <K extends RoleId>(role: K, patch: Partial<SettingsFor<K>>) => void
  save: (role: RoleId) => void
  discard: (role: RoleId) => void
  /** Puts the shipped defaults into the draft; it still takes a save to apply them. */
  resetDraft: (role: RoleId) => void
  resetAll: () => void
}

export const useRoleSettings = create<RoleSettingsState>((set, get) => {
  const initial = hydrate()

  const persist = () => {
    const { saved } = get()
    const out: Stored = {}
    for (const id of ROLE_ORDER) {
      // Only what differs from the shipped default is written, so a later change to a default
      // reaches anyone who never touched that field.
      const diff: Record<string, unknown> = {}
      const defaults = DEFAULT_ROLE_SETTINGS[id] as unknown as Record<string, unknown>
      const current = saved[id] as unknown as Record<string, unknown>
      for (const key of Object.keys(defaults)) {
        if (JSON.stringify(current[key]) !== JSON.stringify(defaults[key])) diff[key] = current[key]
      }
      if (Object.keys(diff).length > 0) out[id] = diff as Partial<SettingsFor<typeof id>>
    }
    localStorage.setItem(KEY, JSON.stringify(out))
  }

  return {
    saved: initial,
    draft: clone(initial),

    patch: (role, patch) =>
      set((s) => ({ draft: { ...s.draft, [role]: { ...s.draft[role], ...patch } } })),

    save: (role) => {
      set((s) => ({ saved: { ...s.saved, [role]: { ...s.draft[role] } } }))
      persist()
    },

    discard: (role) => set((s) => ({ draft: { ...s.draft, [role]: { ...s.saved[role] } } })),

    resetDraft: (role) => set((s) => ({ draft: { ...s.draft, [role]: { ...DEFAULT_ROLE_SETTINGS[role] } } })),

    resetAll: () => {
      const fresh = clone(DEFAULT_ROLE_SETTINGS as RoleSettingsMap)
      set({ saved: fresh, draft: clone(fresh) })
      localStorage.removeItem(KEY)
    },
  }
})

/** The saved block for one role — what every dashboard reads. */
export function useSettingsFor<K extends RoleId>(role: K): SettingsFor<K> {
  return useRoleSettings((s) => s.saved[role])
}

/** The draft block for one role — what the settings form edits. */
export function useDraftFor<K extends RoleId>(role: K): SettingsFor<K> {
  return useRoleSettings((s) => s.draft[role])
}

/**
 * The signed-in role's saved settings. Shared components use this so a table or a map
 * follows whoever is logged in without every caller threading a role through.
 */
export function useActiveSettings(): SettingsFor<RoleId> {
  const roleId = useRoleStore((s) => s.roleId)
  const saved = useRoleSettings((s) => s.saved)
  return saved[roleId ?? 'cpcb']
}

/** Which fields of a role's draft differ from what is saved. */
export function changedKeys(role: RoleId, saved: RoleSettingsMap, draft: RoleSettingsMap): string[] {
  const a = saved[role] as unknown as Record<string, unknown>
  const b = draft[role] as unknown as Record<string, unknown>
  return Object.keys(a).filter((key) => JSON.stringify(a[key]) !== JSON.stringify(b[key]))
}

export function useDirtyCount(role: RoleId): number {
  const saved = useRoleSettings((s) => s.saved)
  const draft = useRoleSettings((s) => s.draft)
  return changedKeys(role, saved, draft).length
}
