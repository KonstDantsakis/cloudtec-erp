import { FormEvent, useEffect, useState } from 'react'
import { DataTable } from '../../components/common/DataTable'
import { api } from '../../services/api'
import { Customer } from '../../types/models'
import { useAuth } from '../auth/AuthContext'

const emptyCustomer: Partial<Customer> = { name: '', email: '', phone: '', address: '', tax_number: '', notes: '' }

export function CustomersPage() {
  const { token } = useAuth()
  const [search, setSearch] = useState('')
  const [rows, setRows] = useState<Customer[]>([])
  const [draft, setDraft] = useState<Partial<Customer>>(emptyCustomer)
  const [editingId, setEditingId] = useState<string | null>(null)

  const load = () => token && api.listCustomers(token, search).then(setRows)
  useEffect(() => { load() }, [token, search])

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    if (!token) return
    if (editingId) await api.updateCustomer(token, editingId, draft)
    else await api.createCustomer(token, draft)
    setDraft(emptyCustomer)
    setEditingId(null)
    load()
  }

  return (
    <section>
      <h1>Customers</h1>
      <div className="toolbar"><input placeholder="Search customer" value={search} onChange={(e) => setSearch(e.target.value)} /></div>
      <form className="form-grid" onSubmit={submit}>
        <input required placeholder="Name" value={draft.name ?? ''} onChange={(e) => setDraft({ ...draft, name: e.target.value })} />
        <input placeholder="Email" value={draft.email ?? ''} onChange={(e) => setDraft({ ...draft, email: e.target.value })} />
        <input placeholder="Phone" value={draft.phone ?? ''} onChange={(e) => setDraft({ ...draft, phone: e.target.value })} />
        <input placeholder="Address" value={draft.address ?? ''} onChange={(e) => setDraft({ ...draft, address: e.target.value })} />
        <input placeholder="Tax number" value={draft.tax_number ?? ''} onChange={(e) => setDraft({ ...draft, tax_number: e.target.value })} />
        <input placeholder="Notes" value={draft.notes ?? ''} onChange={(e) => setDraft({ ...draft, notes: e.target.value })} />
        <button type="submit">{editingId ? 'Update' : 'Add'} customer</button>
      </form>
      <DataTable headers={['Name', 'Email', 'Phone', 'Tax #', 'Actions']}>
        {rows.map((row) => (
          <tr key={row.id}>
            <td>{row.name}</td><td>{row.email}</td><td>{row.phone}</td><td>{row.tax_number}</td>
            <td>
              <button onClick={() => { setEditingId(row.id); setDraft(row) }}>Edit</button>
              <button onClick={() => token && api.deleteCustomer(token, row.id).then(load)}>Delete</button>
            </td>
          </tr>
        ))}
      </DataTable>
    </section>
  )
}
