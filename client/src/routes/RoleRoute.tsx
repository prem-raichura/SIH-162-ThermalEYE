import { Navigate, useParams } from 'react-router-dom'
import { AppShell } from '@/components/shell/AppShell'
import { ROLES, isRoleId } from '@/lib/roles'
import { useRoleStore } from '@/store/useRole'

/** Gates every dashboard on the session and pins the URL to the signed-in role. */
export function RoleRoute() {
  const { role: roleParam, section } = useParams()
  const roleId = useRoleStore((s) => s.roleId)

  if (!roleId) return <Navigate to="/login" replace />
  if (!isRoleId(roleParam) || roleParam !== roleId) return <Navigate to={`/${roleId}`} replace />

  const role = ROLES[roleId]
  const known = role.nav.some((n) => n.path === (section ?? ''))
  if (!known) return <Navigate to={`/${role.id}`} replace />

  return <AppShell role={role} />
}
