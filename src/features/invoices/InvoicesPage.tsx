import { FormEvent, useEffect, useMemo, useState } from 'react'
import { DataTable } from '../../components/common/DataTable'
import { api } from '../../services/api'
import { Customer, Invoice, InvoiceItemInput, Product } from '../../types/models'
import { useAuth } from '../auth/AuthContext'

const emptyItem: InvoiceItemInput = { product_id: '', description: '', quantity: 1, unit_price: 0, vat_rate: 24 }

export function InvoicesPage() {
  const { token } = useAuth()
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [customers, setCustomers] = useState<Customer[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [customerId, setCustomerId] = useState('')
  const [status, setStatus] = useState<Invoice['status']>('draft')
  const [issueDate, setIssueDate] = useState(new Date().toISOString().slice(0, 10))
  const [items, setItems] = useState<InvoiceItemInput[]>([emptyItem])

  const load = async () => {
    if (!token) return
    const [invoiceRows, customerRows, productRows] = await Promise.all([
      api.listInvoices(token),
      api.listCustomers(token),
      api.listProducts(token),
    ])
    setInvoices(invoiceRows)
    setCustomers(customerRows)
    setProducts(productRows)
  }

  useEffect(() => { load() }, [token])

  const totals = useMemo(() => items.reduce((acc, item) => {
    const line = item.quantity * item.unit_price
    const vat = line * (item.vat_rate / 100)
    return { subtotal: acc.subtotal + line, vat: acc.vat + vat, total: acc.total + line + vat }
  }, { subtotal: 0, vat: 0, total: 0 }), [items])

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    if (!token) return
    await api.createInvoice(token, { customer_id: customerId, issue_date: issueDate, status, items })
    setItems([emptyItem])
    load()
  }

  return (
    <section>
      <h1>Sales / Invoices</h1>
      <form className="stack" onSubmit={submit}>
        <div className="form-grid">
          <select required value={customerId} onChange={(e) => setCustomerId(e.target.value)}><option value="">Select customer</option>{customers.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select>
          <input type="date" value={issueDate} onChange={(e) => setIssueDate(e.target.value)} />
          <select value={status} onChange={(e) => setStatus(e.target.value as Invoice['status'])}><option>draft</option><option>unpaid</option><option>paid</option><option>cancelled</option></select>
        </div>
        {items.map((item, index) => (
          <div className="form-grid" key={index}>
            <select value={item.product_id} onChange={(e) => {
              const product = products.find((p) => p.id === e.target.value)
              const next = [...items]
              next[index] = {
                ...next[index],
                product_id: e.target.value,
                description: product?.name ?? '',
                unit_price: product?.price ?? 0,
                vat_rate: product?.vat_rate ?? 24,
              }
              setItems(next)
            }}>
              <option value="">Product/service</option>{products.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
            <input type="number" min={1} value={item.quantity} onChange={(e) => { const next = [...items]; next[index] = { ...item, quantity: Number(e.target.value) }; setItems(next) }} />
            <input type="number" step="0.01" value={item.unit_price} onChange={(e) => { const next = [...items]; next[index] = { ...item, unit_price: Number(e.target.value) }; setItems(next) }} />
            <input type="number" step="0.01" value={item.vat_rate} onChange={(e) => { const next = [...items]; next[index] = { ...item, vat_rate: Number(e.target.value) }; setItems(next) }} />
          </div>
        ))}
        <button type="button" onClick={() => setItems([...items, emptyItem])}>Add line</button>
        <p>Subtotal: €{totals.subtotal.toFixed(2)} | VAT: €{totals.vat.toFixed(2)} | Total: €{totals.total.toFixed(2)}</p>
        <button type="submit">Create invoice</button>
      </form>

      <DataTable headers={['Invoice #', 'Status', 'Issue Date', 'Total', 'Printable']}>
        {invoices.map((invoice) => (
          <tr key={invoice.id}>
            <td>{invoice.invoice_number}</td><td>{invoice.status}</td><td>{invoice.issue_date}</td><td>€{invoice.grand_total}</td>
            <td><a href={`/invoices/${invoice.id}/print`} target="_blank" rel="noreferrer">Print</a></td>
          </tr>
        ))}
      </DataTable>
    </section>
  )
}
