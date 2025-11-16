// src/components/AppContent.tsx
import React, { Suspense } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import { CContainer, CSpinner } from '@coreui/react'

// routes config
import routes from '../routes'

// Minimal route type for your config. If you already export a type from routes.ts, import that instead.
type AppRoute = {
  path: string
  name?: string
  exact?: boolean // kept for compatibility with your config, but react-router v6 ignores it
  element?: React.ComponentType<any> // lazy components or regular components
  // allow extra fields without complaining
  [key: string]: unknown
}

const typedRoutes = routes as AppRoute[]

const AppContent: React.FC = () => {
  return (
    <CContainer className="px-4" lg>
      <Suspense
        fallback={
          <div className="py-5 text-center">
            <CSpinner color="primary" />
          </div>
        }
      >
        <Routes>
          {typedRoutes.map((route) => {
            if (!route.element) return null
            const Element = route.element
            return (
              <Route
                key={route.path}      // stable key
                path={route.path}     // e.g. "dashboard", "customers", etc. (relative)
                element={<Element />}
              />
            )
          })}

          {/* ✅ Default nested route under /admin/* or /app/* */}
          <Route index element={<Navigate to="dashboard" replace />} />

          {/* Optional: if you want unknown nested paths to go back to dashboard */}
          {/* <Route path="*" element={<Navigate to="dashboard" replace />} /> */}
        </Routes>
      </Suspense>
    </CContainer>
  )
}

export default React.memo(AppContent)
