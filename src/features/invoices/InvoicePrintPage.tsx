import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { api } from '../../services/api'
import { useAuth } from '../auth/AuthContext'

export function InvoicePrintPage() {
  const { token } = useAuth()
  const { id } = useParams()
  const [data, setData] = useState<{ invoice: any; items: any[] } | null>(null)

  useEffect(() => {
    if (!token || !id) return
    api.getInvoice(token, id).then(setData)
  }, [token, id])

  if (!data) return <p>Loading...</p>

  return (
    <section className="print-layout">
      <h1>Invoice {data.invoice.invoice_number}</h1>
      <p>Status: {data.invoice.status}</p>
      <p>Issue date: {data.invoice.issue_date}</p>
      <table>
        <thead><tr><th>Description</th><th>Qty</th><th>Unit</th><th>VAT</th><th>Total</th></tr></thead>
        <tbody>{data.items.map((item, idx) => <tr key={idx}><td>{item.description}</td><td>{item.quantity}</td><td>{item.unit_price}</td><td>{item.vat_rate}%</td><td>{(item.quantity * item.unit_price * (1 + item.vat_rate / 100)).toFixed(2)}</td></tr>)}</tbody>
      </table>
      <h3>Grand total: €{data.invoice.grand_total}</h3>
    </section>
  )
}
