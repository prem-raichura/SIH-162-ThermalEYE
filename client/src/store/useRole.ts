import { create } from 'zustand'
import { ROLES, roleFromEmail, type RoleId } from '@/lib/roles'

/** Shared demo credential. The dataset is public; the gate only scopes the view. */
export const DEMO_PASSWORD = 'admin@123'

const EMAIL_KEY = 'te.email'
const ROLE_KEY = 'te.role'

export type SignInResult = { ok: true; roleId: RoleId } | { ok: false; error: string }

interface RoleState {
  email: string | null
  roleId: RoleId | null
  signIn: (email: string, password: string) => SignInResult
  signOut: () => void
}

/** The address is the session: a stored role that disagrees with it is discarded. */
const initial = (): { email: string | null; roleId: RoleId | null } => {
  const email = localStorage.getItem(EMAIL_KEY)
  const roleId = roleFromEmail(email)
  if (!email || !roleId) {
    localStorage.removeItem(EMAIL_KEY)
    localStorage.removeItem(ROLE_KEY)
    return { email: null, roleId: null }
  }
  localStorage.setItem(ROLE_KEY, roleId)
  return { email, roleId }
}

export const useRoleStore = create<RoleState>((set) => ({
  ...initial(),
  signIn: (email, password) => {
    const address = email.trim().toLowerCase()
    const roleId = roleFromEmail(address)
    if (!roleId) return { ok: false, error: 'No ThermalEye account for that address.' }
    if (password !== DEMO_PASSWORD) return { ok: false, error: 'Incorrect password.' }
    localStorage.setItem(EMAIL_KEY, address)
    localStorage.setItem(ROLE_KEY, roleId)
    set({ email: address, roleId })
    return { ok: true, roleId }
  },
  signOut: () => {
    localStorage.removeItem(EMAIL_KEY)
    localStorage.removeItem(ROLE_KEY)
    set({ email: null, roleId: null })
  },
}))

export const useRole = () => {
  const roleId = useRoleStore((s) => s.roleId)
  return roleId ? ROLES[roleId] : null
}
