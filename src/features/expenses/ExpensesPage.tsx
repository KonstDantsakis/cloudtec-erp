import { FormEvent, useEffect, useState } from 'react'
import { DataTable } from '../../components/common/DataTable'
import { api } from '../../services/api'
import { Expense } from '../../types/models'
import { useAuth } from '../auth/AuthContext'

const emptyExpense: Partial<Expense> = { supplier: '', category: '', amount: 0, vat: 24, date: new Date().toISOString().slice(0, 10), notes: '' }

export function ExpensesPage() {
  const { token } = useAuth()
  const [rows, setRows] = useState<Expense[]>([])
  const [draft, setDraft] = useState<Partial<Expense>>(emptyExpense)
  const [editingId, setEditingId] = useState<string | null>(null)

  const load = () => token && api.listExpenses(token).then(setRows)
  useEffect(() => { load() }, [token])

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    if (!token) return
    if (editingId) await api.updateExpense(token, editingId, draft)
    else await api.createExpense(token, draft)
    setEditingId(null)
    setDraft(emptyExpense)
    load()
  }

  return (
    <section>
      <h1>Expenses</h1>
      <form className="form-grid" onSubmit={submit}>
        <input required placeholder="Supplier" value={draft.supplier ?? ''} onChange={(e) => setDraft({ ...draft, supplier: e.target.value })} />
        <input required placeholder="Category" value={draft.category ?? ''} onChange={(e) => setDraft({ ...draft, category: e.target.value })} />
        <input type="number" step="0.01" value={draft.amount ?? 0} onChange={(e) => setDraft({ ...draft, amount: Number(e.target.value) })} />
        <input type="number" step="0.01" value={draft.vat ?? 0} onChange={(e) => setDraft({ ...draft, vat: Number(e.target.value) })} />
        <input type="date" value={draft.date ?? ''} onChange={(e) => setDraft({ ...draft, date: e.target.value })} />
        <input placeholder="Notes" value={draft.notes ?? ''} onChange={(e) => setDraft({ ...draft, notes: e.target.value })} />
        <button type="submit">{editingId ? 'Update' : 'Add'} expense</button>
      </form>
      <DataTable headers={['Supplier', 'Category', 'Amount', 'Date', 'Actions']}>
        {rows.map((row) => <tr key={row.id}><td>{row.supplier}</td><td>{row.category}</td><td>{row.amount}</td><td>{row.date}</td><td><button onClick={() => { setEditingId(row.id); setDraft(row) }}>Edit</button><button onClick={() => token && api.deleteExpense(token, row.id).then(load)}>Delete</button></td></tr>)}
      </DataTable>
    </section>
  )
}
