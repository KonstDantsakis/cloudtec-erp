import { FormEvent, useEffect, useState } from 'react'
import { DataTable } from '../../components/common/DataTable'
import { api } from '../../services/api'
import { Expense } from '../../types/models'
import { useAuth } from '../auth/AuthContext'
import { useLocale } from '../../context/LocaleContext'
import { labels } from '../../locales/labels'

const today = new Date().toISOString().slice(0, 10)
const empty: Partial<Expense> = { supplier: '', category: '', amount: 0, vat: 24, date: today, notes: '' }

function ExpenseModal({
  title, draft, saving, onChange, onChangeNum, onSubmit, onClose,
}: {
  title: string
  draft: Partial<Expense>
  saving: boolean
  onChange: (field: keyof Expense, value: string) => void
  onChangeNum: (field: keyof Expense, value: number) => void
  onSubmit: (e: FormEvent) => void
  onClose: () => void
}) {
  const { locale } = useLocale()
  const l = labels[locale]

  return (
    <div style={overlay} onClick={onClose}>
      <div style={modal} onClick={(e) => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h2 style={{ margin: 0 }}>{title}</h2>
          <button onClick={onClose} style={closeBtn}>✕</button>
        </div>
        <form onSubmit={onSubmit} style={{ display: 'grid', gap: '.7rem' }}>
          <label style={labelStyle}>
            {l.supplier} *
            <input required value={draft.supplier ?? ''} onChange={(e) => onChange('supplier', e.target.value)} />
          </label>
          <label style={labelStyle}>
            {l.category} *
            <input required value={draft.category ?? ''} onChange={(e) => onChange('category', e.target.value)} />
          </label>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '.7rem' }}>
            <label style={labelStyle}>
              {l.amount}
              <input type="number" step="0.01" value={draft.amount ?? 0} onChange={(e) => onChangeNum('amount', Number(e.target.value))} />
            </label>
            <label style={labelStyle}>
              {l.vat}
              <input type="number" step="0.01" value={draft.vat ?? 24} onChange={(e) => onChangeNum('vat', Number(e.target.value))} />
            </label>
          </div>
          <label style={labelStyle}>
            {l.date}
            <input type="date" value={draft.date ?? today} onChange={(e) => onChange('date', e.target.value)} />
          </label>
          <label style={labelStyle}>
            {l.notes}
            <input value={draft.notes ?? ''} onChange={(e) => onChange('notes', e.target.value)} />
          </label>
          <div style={{ display: 'flex', gap: '.6rem', justifyContent: 'flex-end', marginTop: '.5rem' }}>
            <button type="button" onClick={onClose} disabled={saving} style={cancelBtn}>{l.cancel}</button>
            <button type="submit" disabled={saving} style={primaryBtn}>{saving ? l.saving : l.save}</button>
          </div>
        </form>
      </div>
    </div>
  )
}

function ConfirmModal({ supplier, onConfirm, onCancel }: { supplier: string; onConfirm: () => void; onCancel: () => void }) {
  const { locale } = useLocale()
  const l = labels[locale]

  return (
    <div style={overlay} onClick={onCancel}>
      <div style={{ ...modal, maxWidth: 400 }} onClick={(e) => e.stopPropagation()}>
        <h2 style={{ margin: '0 0 .5rem' }}>{l.deleteExpenseTitle}</h2>
        <p style={{ margin: '0 0 1.2rem', color: '#475569' }}>
          {l.deleteExpenseMsg(supplier)} {l.cannotUndo}
        </p>
        <div style={{ display: 'flex', gap: '.6rem', justifyContent: 'flex-end' }}>
          <button onClick={onCancel} style={cancelBtn}>{l.cancel}</button>
          <button onClick={onConfirm} style={dangerBtn}>{l.delete}</button>
        </div>
      </div>
    </div>
  )
}

export function ExpensesPage() {
  const { token } = useAuth()
  const { locale } = useLocale()
  const l = labels[locale]

  const [rows, setRows] = useState<Expense[]>([])

  const [modalOpen, setModalOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [draft, setDraft] = useState<Partial<Expense>>(empty)
  const [saving, setSaving] = useState(false)

  const [deleteTarget, setDeleteTarget] = useState<Expense | null>(null)

  const load = () => token && api.listExpenses(token).then(setRows)
  useEffect(() => { load() }, [token])

  const openAdd = () => { setDraft({ ...empty, date: new Date().toISOString().slice(0, 10) }); setEditingId(null); setModalOpen(true) }
  const openEdit = (row: Expense) => { setDraft(row); setEditingId(row.id); setModalOpen(true) }

  const handleChange = (field: keyof Expense, value: string) =>
    setDraft((prev) => ({ ...prev, [field]: value }))
  const handleChangeNum = (field: keyof Expense, value: number) =>
    setDraft((prev) => ({ ...prev, [field]: value }))

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!token) return
    setSaving(true)
    if (editingId) await api.updateExpense(token, editingId, draft)
    else await api.createExpense(token, draft)
    setSaving(false)
    setModalOpen(false)
    load()
  }

  const handleDelete = async () => {
    if (!token || !deleteTarget) return
    await api.deleteExpense(token, deleteTarget.id)
    setDeleteTarget(null)
    load()
  }

  return (
    <section>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <h1 style={{ margin: 0 }}>{l.expensesTitle}</h1>
        <button onClick={openAdd} style={primaryBtn}>{l.addExpense}</button>
      </div>

      <DataTable headers={[l.supplier, l.category, l.amount, l.date, '']}>
        {rows.map((row) => (
          <tr key={row.id}>
            <td>{row.supplier}</td>
            <td>{row.category}</td>
            <td>{row.amount}</td>
            <td>{row.date}</td>
            <td>
              <button onClick={() => openEdit(row)}>{l.edit}</button>
              <button onClick={() => setDeleteTarget(row)} style={{ marginLeft: '.4rem', color: '#dc2626', borderColor: '#dc2626' }}>{l.delete}</button>
            </td>
          </tr>
        ))}
      </DataTable>

      {modalOpen && (
        <ExpenseModal
          title={editingId ? l.editExpense : l.newExpense}
          draft={draft}
          saving={saving}
          onChange={handleChange}
          onChangeNum={handleChangeNum}
          onSubmit={handleSubmit}
          onClose={() => setModalOpen(false)}
        />
      )}

      {deleteTarget && (
        <ConfirmModal
          supplier={deleteTarget.supplier}
          onConfirm={handleDelete}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </section>
  )
}

const overlay: React.CSSProperties = {
  position: 'fixed', inset: 0,
  background: 'rgba(0,0,0,0.4)',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  zIndex: 1000,
}
const modal: React.CSSProperties = {
  background: '#fff', borderRadius: '12px',
  padding: '1.5rem', width: '100%', maxWidth: 520,
  boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
}
const labelStyle: React.CSSProperties = { display: 'grid', gap: '.3rem', fontSize: '.9rem', fontWeight: 500 }
const closeBtn: React.CSSProperties = { background: 'none', border: 'none', fontSize: '1.2rem', cursor: 'pointer', color: '#64748b' }
const primaryBtn: React.CSSProperties = { background: '#0f172a', color: '#fff', border: 'none', padding: '.55rem 1rem', borderRadius: '.45rem', cursor: 'pointer' }
const cancelBtn: React.CSSProperties = { background: '#fff', color: '#0f172a', border: '1px solid #cbd5e1', padding: '.55rem 1rem', borderRadius: '.45rem', cursor: 'pointer' }
const dangerBtn: React.CSSProperties = { background: '#dc2626', color: '#fff', border: 'none', padding: '.55rem 1rem', borderRadius: '.45rem', cursor: 'pointer' }
