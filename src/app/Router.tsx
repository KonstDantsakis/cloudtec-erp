import { Navigate, Route, Routes } from 'react-router-dom'
import { AppLayout } from '../components/layout/AppLayout'
import { LoginPage } from '../features/auth/LoginPage'
import { DashboardPage } from '../features/dashboard/DashboardPage'
import { CustomersPage } from '../features/customers/CustomersPage'
import { ProductsPage } from '../features/products/ProductsPage'
import { InvoicesPage } from '../features/invoices/InvoicesPage'
import { ExpensesPage } from '../features/expenses/ExpensesPage'
import { TasksPage } from '../features/tasks/TasksPage'
import { ReportsPage } from '../features/reports/ReportsPage'
import { InvoicePrintPage } from '../features/invoices/InvoicePrintPage'
import { CompanySetupPage } from '../features/company/CompanySetupPage'
import { SuperAdminPage } from '../features/super-admin/SuperAdminPage'
import { useAuth } from '../features/auth/AuthContext'

function ProtectedApp() {
  const { token, companyId, user } = useAuth()
  if (!token) return <Navigate to="/login" replace />
  if (user?.role === 'super_admin') return <Navigate to="/super-admin" replace />
  if (!companyId) return <Navigate to="/setup-company" replace />

  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route path="/" element={<DashboardPage />} />
        <Route path="/customers" element={<CustomersPage />} />
        <Route path="/products" element={<ProductsPage />} />
        <Route path="/invoices" element={<InvoicesPage />} />
        <Route path="/expenses" element={<ExpensesPage />} />
        <Route path="/tasks" element={<TasksPage />} />
        <Route path="/reports" element={<ReportsPage />} />
        <Route path="/invoices/:id/print" element={<InvoicePrintPage />} />
      </Route>
    </Routes>
  )
}

export function AppRouter() {
  const { token, companyId, user, loading } = useAuth()
  const isSuperAdmin = user?.role === 'super_admin'

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
      Loading…
    </div>
  )

  return (
    <Routes>
      <Route path="/login" element={token ? <Navigate to="/" replace /> : <LoginPage />} />
      <Route
        path="/super-admin"
        element={!token ? <Navigate to="/login" replace /> : isSuperAdmin ? <SuperAdminPage /> : <Navigate to="/" replace />}
      />
      <Route
        path="/setup-company"
        element={
          !token ? <Navigate to="/login" replace />
          : isSuperAdmin ? <Navigate to="/super-admin" replace />
          : companyId ? <Navigate to="/" replace />
          : <CompanySetupPage />
        }
      />
      <Route path="/*" element={token ? <ProtectedApp /> : <Navigate to="/login" replace />} />
    </Routes>
  )
}
