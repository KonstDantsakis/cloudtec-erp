// src/App.tsx
import React, { Suspense, useEffect } from 'react'
import { HashRouter, Route, Routes, Navigate, Outlet } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { CSpinner, useColorModes } from '@coreui/react'
import './scss/style.scss'
import './scss/examples.scss'

import { useAuth } from '@/context/AuthContext'

// Containers
const DefaultLayout = React.lazy(() => import('./layout/DefaultLayout'))

// 🔹 ΝΕΟ: layout για τους απλούς χρήστες (μέλη)
const UserLayout = React.lazy(() => import('./layout/UserLayout'))


// Pages
const Login = React.lazy(() => import('./views/pages/login/Login'))
const Register = React.lazy(() => import('./views/pages/register/Register'))
const Page404 = React.lazy(() => import('./views/pages/page404/Page404'))
const Page500 = React.lazy(() => import('./views/pages/page500/Page500'))

const Unauthorized: React.FC = () => (
  <div className="container py-5">
    <h4>Unauthorized</h4>
    <p>You don’t have permission to view this page.</p>
  </div>
)

function FullScreenSpinner() {
  return (
    <div className="pt-3 text-center">
      <CSpinner color="primary" variant="grow" />
    </div>
  )
}

// ─────────────────────────────
// Route guards
// ─────────────────────────────

function ProtectedRoute() {
  const { loading, user } = useAuth()
  console.log('[ProtectedRoute] loading:', loading, 'user:', !!user)

  if (loading) return <FullScreenSpinner />
  return user ? <Outlet /> : <Navigate to="/login" replace />
}

function RoleRoute({ allow }: { allow: Array<'admin' | 'user'> }) {
  const { loading, role, user } = useAuth()
  console.log('[RoleRoute] loading:', loading, 'user:', !!user, 'role:', role)

  if (loading) return <FullScreenSpinner />

  if (!user) return <Navigate to="/login" replace />

  // Μην μπλοκάρεις σκληρά αν το profile δεν έχει φορτώσει ακόμα
  if (!role) return <Outlet />

  // Έλεγχος role
  return role != null && allow.includes(role)
    ? <Outlet />
    : <Navigate to="/unauthorized" replace />
}

function HomeRedirect() {
  const { loading, role, user } = useAuth()
  console.log('[HomeRedirect] loading:', loading, 'user:', !!user, 'role:', role)

  if (loading) return <FullScreenSpinner />

  if (!user) return <Navigate to="/login" replace />

  if (!role) {
    // Αν (πολύ σπάνια) δεν έχει φορτώσει ακόμη profile, στείλτον προσωρινά admin-dashboard
    return <Navigate to="/app/dashboard" replace />
  }

  // 🔹 Admin → /admin/dashboard
  // 🔹 User  → /app/dashboard
  return role === 'admin'
    ? <Navigate to="/admin/dashboard" replace />
    : <Navigate to="/app/userdashboard" replace />
}

// ─────────────────────────────
// App component
// ─────────────────────────────

const App: React.FC = () => {
  const { isColorModeSet, setColorMode } = useColorModes(
    'coreui-free-react-admin-template-theme',
  )
  // @ts-ignore
  const storedTheme = useSelector((state) => state.theme)

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.href.split('?')[1])
    const theme =
      urlParams.get('theme') && urlParams.get('theme')!.match(/^[A-Za-z0-9\s]+/)! [0]
    if (theme) setColorMode(theme)

    if (isColorModeSet()) return
    setColorMode(storedTheme)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <HashRouter>
      <Suspense fallback={<FullScreenSpinner />}>
        <Routes>
          {/* Public */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/404" element={<Page404 />} />
          <Route path="/500" element={<Page500 />} />
          <Route path="/unauthorized" element={<Unauthorized />} />

          {/* Protected */}
          <Route element={<ProtectedRoute />}>
            {/* Admin area – admin panel όπως το έχουμε χτίσει */}
            <Route element={<RoleRoute allow={['admin']} />}>
              <Route path="/admin/*" element={<DefaultLayout />} />
            </Route>

            {/* User area – διαφορετικό layout για τα μέλη */}
            <Route element={<RoleRoute allow={['user']} />}>
              <Route path="/app/*" element={<UserLayout />} />
            </Route>

            {/* Home redirect */}
            <Route path="/" element={<HomeRedirect />} />
          </Route>

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </HashRouter>
  )
}

export default App
