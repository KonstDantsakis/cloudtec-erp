import { useEffect, useState } from 'react'
import { useAuth } from '../auth/AuthContext'
import { api } from '../../services/api'
import { useLocale } from '../../context/LocaleContext'
import { labels } from '../../locales/labels'

interface ReportSummary {
  month: string
  monthlyIncome: number
  monthlyExpenses: number
  profitEstimate: number
  salesPerCustomer: Array<{ customer: string; total: number }>
}

export function ReportsPage() {
  const { token } = useAuth()
  const { locale } = useLocale()
  const l = labels[locale]
  const [month, setMonth] = useState(new Date().toISOString().slice(0, 7))
  const [summary, setSummary] = useState<ReportSummary | null>(null)

  useEffect(() => {
    if (!token) return
    api.getReportSummary(token, month).then((r) => setSummary(r as ReportSummary))
  }, [token, month])

  const onExport = async () => {
    if (!token) return
    const blob = await api.downloadReportCsv(token, month)
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `report-${month}.csv`
    link.click()
    URL.revokeObjectURL(url)
  }

  return (
    <section>
      <h1>{l.reportsTitle}</h1>
      <div className="toolbar">
        <input type="month" value={month} onChange={(e) => setMonth(e.target.value)} />
        <button onClick={onExport}>{l.exportCsv}</button>
      </div>
      <div className="grid grid-3">
        <article className="card-stat"><p>{l.income}</p><h3>€{summary?.monthlyIncome ?? 0}</h3></article>
        <article className="card-stat"><p>{l.expenses}</p><h3>€{summary?.monthlyExpenses ?? 0}</h3></article>
        <article className="card-stat"><p>{l.profitEstimate}</p><h3>€{summary?.profitEstimate ?? 0}</h3></article>
      </div>
      <h3>{l.salesPerCustomer}</h3>
      <ul>{summary?.salesPerCustomer?.map((row) => <li key={row.customer}>{row.customer}: €{row.total}</li>)}</ul>
    </section>
  )
}
