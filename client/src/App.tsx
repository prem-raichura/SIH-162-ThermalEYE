import { Suspense } from 'react'
import { Navigate, Route, BrowserRouter as Router, Routes, useParams } from 'react-router-dom'
import { LoadingOverlay } from '@/components/shell/Loader'
import { RouteTransition } from '@/components/shell/RouteTransition'
import { RoleRoute } from '@/routes/RoleRoute'
import { LoginPage } from '@/routes/login/LoginPage'
import { NotFound } from '@/routes/NotFound'
import { SectionScaffold } from '@/routes/SectionScaffold'
import { pageFor } from '@/routes/pages'
import { ROLES, isRoleId, sectionTitle } from '@/lib/roles'
import { useRoleStore } from '@/store/useRole'

const SECTION_NOTE =
  'This section is part of the role dashboards built in plans 07 to 14. The shell, routing, search and role switching are live; the panels land with their plan.'

function Section() {
  const { role: roleParam, section } = useParams()
  if (!isRoleId(roleParam)) return <Navigate to="/login" replace />
  const role = ROLES[roleParam]
  const Page = pageFor(role.id, section)
  // The boundary sits inside AppShell's <main>, so the rail, top bar and console stay put and
  // a navigation never reads as a full reload.
  if (Page)
    return (
      <RouteTransition key={`${role.id}/${section ?? ''}`}>
        <Suspense fallback={<LoadingOverlay />}>
          <Page role={role} />
        </Suspense>
      </RouteTransition>
    )

  return (
    <SectionScaffold
      role={role}
      section={sectionTitle(role, section)}
      note={SECTION_NOTE}
      withMap={!section}
    />
  )
}

function Entry() {
  const roleId = useRoleStore((s) => s.roleId)
  return <Navigate to={roleId ? `/${roleId}` : '/login'} replace />
}

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Entry />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/:role" element={<RoleRoute />}>
          <Route index element={<Section />} />
        </Route>
        <Route path="/:role/:section" element={<RoleRoute />}>
          <Route index element={<Section />} />
        </Route>
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Router>
  )
}
