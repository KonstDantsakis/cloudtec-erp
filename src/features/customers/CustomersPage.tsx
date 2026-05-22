import { FormEvent, useEffect, useState } from 'react'
import { DataTable } from '../../components/common/DataTable'
import { api } from '../../services/api'
import { Customer } from '../../types/models'
import { useAuth } from '../auth/AuthContext'
import { useLocale } from '../../context/LocaleContext'
import { labels } from '../../locales/labels'

const empty: Partial<Customer> = { name: '', email: '', phone: '', address: '', tax_number: '', notes: '' }

function CustomerModal({
  title,
  draft,
  saving,
  onChange,
  onSubmit,
  onClose,
}: {
  title: string
  draft: Partial<Customer>
  saving: boolean
  onChange: (field: keyof Customer, value: string) => void
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
            {l.name} *
            <input required value={draft.name ?? ''} onChange={(e) => onChange('name', e.target.value)} />
          </label>
          <label style={labelStyle}>
            {l.email}
            <input value={draft.email ?? ''} onChange={(e) => onChange('email', e.target.value)} />
          </label>
          <label style={labelStyle}>
            {l.phone}
            <input value={draft.phone ?? ''} onChange={(e) => onChange('phone', e.target.value)} />
          </label>
          <label style={labelStyle}>
            {l.address}
            <input value={draft.address ?? ''} onChange={(e) => onChange('address', e.target.value)} />
          </label>
          <label style={labelStyle}>
            {l.taxNumber}
            <input value={draft.tax_number ?? ''} onChange={(e) => onChange('tax_number', e.target.value)} />
          </label>
          <label style={labelStyle}>
            {l.notes}
            <input value={draft.notes ?? ''} onChange={(e) => onChange('notes', e.target.value)} />
          </label>
          <div style={{ display: 'flex', gap: '.6rem', justifyContent: 'flex-end', marginTop: '.5rem' }}>
            <button type="button" onClick={onClose} disabled={saving} style={cancelBtn}>{l.cancel}</button>
            <button type="submit" disabled={saving} style={primaryBtn}>
              {saving ? l.saving : l.save}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function ConfirmModal({ name, onConfirm, onCancel }: { name: string; onConfirm: () => void; onCancel: () => void }) {
  const { locale } = useLocale()
  const l = labels[locale]

  return (
    <div style={overlay} onClick={onCancel}>
      <div style={{ ...modal, maxWidth: 400 }} onClick={(e) => e.stopPropagation()}>
        <h2 style={{ margin: '0 0 .5rem' }}>{l.deleteCustomerTitle}</h2>
        <p style={{ margin: '0 0 1.2rem', color: '#475569' }}>
          {l.deleteCustomerMsg(name)} {l.cannotUndo}
        </p>
        <div style={{ display: 'flex', gap: '.6rem', justifyContent: 'flex-end' }}>
          <button onClick={onCancel} style={cancelBtn}>{l.cancel}</button>
          <button onClick={onConfirm} style={dangerBtn}>{l.delete}</button>
        </div>
      </div>
    </div>
  )
}

export function CustomersPage() {
  const { token } = useAuth()
  const { locale } = useLocale()
  const l = labels[locale]

  const [search, setSearch] = useState('')
  const [rows, setRows] = useState<Customer[]>([])

  const [modalOpen, setModalOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [draft, setDraft] = useState<Partial<Customer>>(empty)
  const [saving, setSaving] = useState(false)

  const [deleteTarget, setDeleteTarget] = useState<Customer | null>(null)

  const load = () => token && api.listCustomers(token, search).then(setRows)
  useEffect(() => { load() }, [token, search])

  const openAdd = () => { setDraft(empty); setEditingId(null); setModalOpen(true) }
  const openEdit = (row: Customer) => { setDraft(row); setEditingId(row.id); setModalOpen(true) }
  const closeModal = () => { setModalOpen(false) }

  const handleChange = (field: keyof Customer, value: string) =>
    setDraft((prev) => ({ ...prev, [field]: value }))

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!token) return
    setSaving(true)
    if (editingId) await api.updateCustomer(token, editingId, draft)
    else await api.createCustomer(token, draft)
    setSaving(false)
    setModalOpen(false)
    load()
  }

  const handleDelete = async () => {
    if (!token || !deleteTarget) return
    await api.deleteCustomer(token, deleteTarget.id)
    setDeleteTarget(null)
    load()
  }

  return (
    <section>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <h1 style={{ margin: 0 }}>{l.customersTitle}</h1>
        <button onClick={openAdd} style={primaryBtn}>{l.addCustomer}</button>
      </div>

      <div className="toolbar">
        <input placeholder={l.searchCustomer} value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      <DataTable headers={[l.name, l.email, l.phone, l.taxNumber, '']}>
        {rows.map((row) => (
          <tr key={row.id}>
            <td>{row.name}</td>
            <td>{row.email}</td>
            <td>{row.phone}</td>
            <td>{row.tax_number}</td>
            <td>
              <button onClick={() => openEdit(row)}>{l.edit}</button>
              <button onClick={() => setDeleteTarget(row)} style={{ marginLeft: '.4rem', color: '#dc2626', borderColor: '#dc2626' }}>{l.delete}</button>
            </td>
          </tr>
        ))}
      </DataTable>

      {modalOpen && (
        <CustomerModal
          title={editingId ? l.editCustomer : l.newCustomer}
          draft={draft}
          saving={saving}
          onChange={handleChange}
          onSubmit={handleSubmit}
          onClose={closeModal}
        />
      )}

      {deleteTarget && (
        <ConfirmModal
          name={deleteTarget.name}
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
