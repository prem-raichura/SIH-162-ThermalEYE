import { create } from 'zustand'
import { ROLES, isRoleId, type RoleId } from '@/lib/roles'

interface RoleState {
  roleId: RoleId | null
  setRole: (id: RoleId) => void
  signOut: () => void
}

const initial = (): RoleId | null => {
  const saved = localStorage.getItem('te.role')
  return isRoleId(saved ?? undefined) ? (saved as RoleId) : null
}

export const useRoleStore = create<RoleState>((set) => ({
  roleId: initial(),
  setRole: (id) => {
    localStorage.setItem('te.role', id)
    set({ roleId: id })
  },
  signOut: () => {
    localStorage.removeItem('te.role')
    set({ roleId: null })
  },
}))

export const useRole = () => {
  const roleId = useRoleStore((s) => s.roleId)
  return roleId ? ROLES[roleId] : null
}
