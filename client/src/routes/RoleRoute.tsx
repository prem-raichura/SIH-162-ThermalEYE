import { Navigate, useParams } from 'react-router-dom'
import { AppShell } from '@/components/shell/AppShell'
import { ROLES, isRoleId } from '@/lib/roles'
import { useRoleStore } from '@/store/useRole'
import { useEffect } from 'react'

/** Resolves :role from the URL, keeps the store in step, and rejects unknown sections. */
export function RoleRoute() {
  const { role: roleParam, section } = useParams()
  const setRole = useRoleStore((s) => s.setRole)
  const valid = isRoleId(roleParam)

  useEffect(() => {
    if (valid) setRole(roleParam)
  }, [valid, roleParam, setRole])

  if (!valid) return <Navigate to="/login" replace />

  const role = ROLES[roleParam]
  const known = role.nav.some((n) => n.path === (section ?? ''))
  if (!known) return <Navigate to={`/${role.id}`} replace />

  return <AppShell role={role} />
}
