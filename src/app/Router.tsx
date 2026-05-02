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
import { useAuth } from '../features/auth/AuthContext'

function ProtectedApp() {
  const { token } = useAuth()
  if (!token) return <Navigate to="/login" replace />

  return (
    <Routes>
      <Route element={<AppLayout locale="en" />}>
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
  const { token } = useAuth()

  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/*" element={token ? <ProtectedApp /> : <Navigate to="/login" replace />} />
    </Routes>
  )
}
