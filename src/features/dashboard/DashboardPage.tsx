import { useEffect, useState } from 'react'
import { CardStat } from '../../components/common/CardStat'
import { DashboardMetrics } from '../../types/models'
import { useAuth } from '../auth/AuthContext'
import { api } from '../../services/api'

export function DashboardPage() {
  const { token } = useAuth()
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null)

  useEffect(() => {
    if (!token) return
    api.getDashboard(token).then(setMetrics).catch(console.error)
  }, [token])

  return (
    <section>
      <h1>Dashboard</h1>
      <div className="grid grid-4">
        <CardStat label="Total customers" value={String(metrics?.totalCustomers ?? 0)} />
        <CardStat label="Total products" value={String(metrics?.totalProducts ?? 0)} />
        <CardStat label="Monthly sales" value={`€${metrics?.monthlySales ?? 0}`} />
        <CardStat label="Pending invoices" value={String(metrics?.pendingInvoices ?? 0)} />
      </div>
    </section>
  )
}
