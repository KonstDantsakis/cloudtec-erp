import { FormEvent, useEffect, useState } from 'react'
import { DataTable } from '../../components/common/DataTable'
import { api } from '../../services/api'
import { Product } from '../../types/models'
import { useAuth } from '../auth/AuthContext'
import { useLocale } from '../../context/LocaleContext'
import { labels } from '../../locales/labels'

const empty: Partial<Product> = { name: '', type: 'product', price: 0, vat_rate: 24, stock_quantity: 0, description: '' }

function ProductModal({
  title, draft, saving,
  onChange, onChangeNum, onChangeType,
  onSubmit, onClose,
}: {
  title: string
  draft: Partial<Product>
  saving: boolean
  onChange: (field: keyof Product, value: string) => void
  onChangeNum: (field: keyof Product, value: number) => void
  onChangeType: (value: Product['type']) => void
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
            {l.type}
            <select value={draft.type} onChange={(e) => onChangeType(e.target.value as Product['type'])}>
              <option value="product">{l.productType}</option>
              <option value="service">{l.serviceType}</option>
            </select>
          </label>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '.7rem' }}>
            <label style={labelStyle}>
              {l.price}
              <input type="number" step="0.01" value={draft.price ?? 0} onChange={(e) => onChangeNum('price', Number(e.target.value))} />
            </label>
            <label style={labelStyle}>
              {l.vat}
              <input type="number" step="0.01" value={draft.vat_rate ?? 24} onChange={(e) => onChangeNum('vat_rate', Number(e.target.value))} />
            </label>
          </div>
          <label style={labelStyle}>
            {l.stock}
            <input type="number" value={draft.stock_quantity ?? 0} onChange={(e) => onChangeNum('stock_quantity', Number(e.target.value))} />
          </label>
          <label style={labelStyle}>
            {l.description}
            <input value={draft.description ?? ''} onChange={(e) => onChange('description', e.target.value)} />
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

function ConfirmModal({ name, onConfirm, onCancel }: { name: string; onConfirm: () => void; onCancel: () => void }) {
  const { locale } = useLocale()
  const l = labels[locale]

  return (
    <div style={overlay} onClick={onCancel}>
      <div style={{ ...modal, maxWidth: 400 }} onClick={(e) => e.stopPropagation()}>
        <h2 style={{ margin: '0 0 .5rem' }}>{l.deleteProductTitle}</h2>
        <p style={{ margin: '0 0 1.2rem', color: '#475569' }}>
          {l.deleteProductMsg(name)} {l.cannotUndo}
        </p>
        <div style={{ display: 'flex', gap: '.6rem', justifyContent: 'flex-end' }}>
          <button onClick={onCancel} style={cancelBtn}>{l.cancel}</button>
          <button onClick={onConfirm} style={dangerBtn}>{l.delete}</button>
        </div>
      </div>
    </div>
  )
}

export function ProductsPage() {
  const { token } = useAuth()
  const { locale } = useLocale()
  const l = labels[locale]

  const [rows, setRows] = useState<Product[]>([])
  const [search, setSearch] = useState('')

  const [modalOpen, setModalOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [draft, setDraft] = useState<Partial<Product>>(empty)
  const [saving, setSaving] = useState(false)

  const [deleteTarget, setDeleteTarget] = useState<Product | null>(null)

  const load = () => token && api.listProducts(token, search).then(setRows)
  useEffect(() => { load() }, [token, search])

  const openAdd = () => { setDraft(empty); setEditingId(null); setModalOpen(true) }
  const openEdit = (row: Product) => { setDraft(row); setEditingId(row.id); setModalOpen(true) }

  const handleChange = (field: keyof Product, value: string) =>
    setDraft((prev) => ({ ...prev, [field]: value }))
  const handleChangeNum = (field: keyof Product, value: number) =>
    setDraft((prev) => ({ ...prev, [field]: value }))
  const handleChangeType = (value: Product['type']) =>
    setDraft((prev) => ({ ...prev, type: value }))

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!token) return
    setSaving(true)
    if (editingId) await api.updateProduct(token, editingId, draft)
    else await api.createProduct(token, draft)
    setSaving(false)
    setModalOpen(false)
    load()
  }

  const handleDelete = async () => {
    if (!token || !deleteTarget) return
    await api.deleteProduct(token, deleteTarget.id)
    setDeleteTarget(null)
    load()
  }

  return (
    <section>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <h1 style={{ margin: 0 }}>{l.productsTitle}</h1>
        <button onClick={openAdd} style={primaryBtn}>{l.addItem}</button>
      </div>

      <div className="toolbar">
        <input placeholder={l.searchProduct} value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      <DataTable headers={[l.name, l.type, l.price, l.vat, l.stock, '']}>
        {rows.map((row) => (
          <tr key={row.id}>
            <td>{row.name}</td>
            <td>{row.type === 'product' ? l.productType : l.serviceType}</td>
            <td>{row.price}</td>
            <td>{row.vat_rate}%</td>
            <td>{row.stock_quantity}</td>
            <td>
              <button onClick={() => openEdit(row)}>{l.edit}</button>
              <button onClick={() => setDeleteTarget(row)} style={{ marginLeft: '.4rem', color: '#dc2626', borderColor: '#dc2626' }}>{l.delete}</button>
            </td>
          </tr>
        ))}
      </DataTable>

      {modalOpen && (
        <ProductModal
          title={editingId ? l.editItem : l.newItem}
          draft={draft}
          saving={saving}
          onChange={handleChange}
          onChangeNum={handleChangeNum}
          onChangeType={handleChangeType}
          onSubmit={handleSubmit}
          onClose={() => setModalOpen(false)}
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
