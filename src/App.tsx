// src/App.tsx
import React, { Suspense, useEffect } from 'react'
import { HashRouter, Route, Routes, Navigate, Outlet } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { CSpinner, useColorModes } from '@coreui/react'
import './scss/style.scss'
import './scss/examples.scss'

// ⬇️ Auth context (from earlier steps)
import { AuthProvider, useAuth } from '@/context/AuthContext'

// Containers
const DefaultLayout = React.lazy(() => import('./layout/DefaultLayout'))

// Pages
const Login = React.lazy(() => import('./views/pages/login/Login'))
const Register = React.lazy(() => import('./views/pages/register/Register'))
const Page404 = React.lazy(() => import('./views/pages/page404/Page404'))
const Page500 = React.lazy(() => import('./views/pages/page500/Page500'))

// (Optional) simple Unauthorized page
const Unauthorized = () => (
  <div className="container py-5">
    <h4>Unauthorized</h4>
    <p>You don’t have permission to view this page.</p>
  </div>
)

/** ─────────────────────────────
 * Route guards
 * ────────────────────────────*/
function ProtectedRoute() {
  const { loading, session } = useAuth()
  if (loading) return null // or a centered spinner
  return session ? <Outlet /> : <Navigate to="/login" replace />
}

function RoleRoute({ allow }: { allow: Array<'admin' | 'user'> }) {
  const { loading, profile } = useAuth()
  if (loading) return null
  if (!profile) return <Navigate to="/login" replace />
  return allow.includes(profile.role) ? <Outlet /> : <Navigate to="/unauthorized" replace />
}

/** Send user to the proper dashboard based on profile.role */
function HomeRedirect() {
  const { loading, profile } = useAuth()
  if (loading) return null
  if (!profile) return <Navigate to="/login" replace />
  return profile.role === 'admin'
    ? <Navigate to="/admin/dashboard" replace /> // or `/admin` + index route
    : <Navigate to="/app/dashboard" replace />
}



const App = () => {
  const { isColorModeSet, setColorMode } = useColorModes('coreui-free-react-admin-template-theme')
  // @ts-ignore – keep your existing selector shape
  const storedTheme = useSelector((state) => state.theme)

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.href.split('?')[1])
    const theme = urlParams.get('theme') && urlParams.get('theme')!.match(/^[A-Za-z0-9\s]+/)! [0]
    if (theme) setColorMode(theme)

    if (isColorModeSet()) return
    setColorMode(storedTheme)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <AuthProvider>
      <HashRouter>
        <Suspense
          fallback={
            <div className="pt-3 text-center">
              <CSpinner color="primary" variant="grow" />
            </div>
          }
        >
          <Routes>
            {/* Public */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/404" element={<Page404 />} />
            <Route path="/500" element={<Page500 />} />
            <Route path="/unauthorized" element={<Unauthorized />} />

            {/* Protected root decides where to go */}
            <Route element={<ProtectedRoute />}>
              {/* Admin area (guarded) */}
              <Route element={<RoleRoute allow={['admin']} />}>
                {/* Your DefaultLayout should render admin routes under /admin/* */}
                <Route path="/admin/*" element={<DefaultLayout />} />
              </Route>

              {/* User area (users + admins can see) */}
              <Route element={<RoleRoute allow={['user', 'admin']} />}>
                {/* Your DefaultLayout should render user routes under /app/* */}
                <Route path="/app/*" element={<DefaultLayout />} />
              </Route>

              {/* Home redirect based on role */}
              <Route path="/" element={<HomeRedirect />} />
            </Route>

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </HashRouter>
    </AuthProvider>
  )
}

export default App
