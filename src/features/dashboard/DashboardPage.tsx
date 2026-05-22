import { useEffect, useState } from 'react'
import { CardStat } from '../../components/common/CardStat'
import { DashboardMetrics } from '../../types/models'
import { useAuth } from '../auth/AuthContext'
import { api } from '../../services/api'
import { useLocale } from '../../context/LocaleContext'
import { labels } from '../../locales/labels'

export function DashboardPage() {
  const { token } = useAuth()
  const { locale } = useLocale()
  const l = labels[locale]
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null)

  useEffect(() => {
    if (!token) return
    api.getDashboard(token).then(setMetrics).catch(console.error)
  }, [token])

  return (
    <section>
      <h1>{l.dashboardTitle}</h1>
      <div className="grid grid-4">
        <CardStat label={l.totalCustomers} value={String(metrics?.totalCustomers ?? 0)} />
        <CardStat label={l.totalProducts} value={String(metrics?.totalProducts ?? 0)} />
        <CardStat label={l.monthlySales} value={`€${metrics?.monthlySales ?? 0}`} />
        <CardStat label={l.pendingInvoices} value={String(metrics?.pendingInvoices ?? 0)} />
      </div>
    </section>
  )
}
