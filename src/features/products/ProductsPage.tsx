import { FormEvent, useEffect, useState } from 'react'
import { DataTable } from '../../components/common/DataTable'
import { api } from '../../services/api'
import { Product } from '../../types/models'
import { useAuth } from '../auth/AuthContext'

const emptyProduct: Partial<Product> = { name: '', type: 'product', price: 0, vat_rate: 24, stock_quantity: 0, description: '' }

export function ProductsPage() {
  const { token } = useAuth()
  const [rows, setRows] = useState<Product[]>([])
  const [search, setSearch] = useState('')
  const [draft, setDraft] = useState<Partial<Product>>(emptyProduct)
  const [editingId, setEditingId] = useState<string | null>(null)

  const load = () => token && api.listProducts(token, search).then(setRows)
  useEffect(() => { load() }, [token, search])

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    if (!token) return
    if (editingId) await api.updateProduct(token, editingId, draft)
    else await api.createProduct(token, draft)
    setDraft(emptyProduct)
    setEditingId(null)
    load()
  }

  return (
    <section>
      <h1>Products / Services</h1>
      <div className="toolbar"><input placeholder="Search product" value={search} onChange={(e) => setSearch(e.target.value)} /></div>
      <form className="form-grid" onSubmit={submit}>
        <input required placeholder="Name" value={draft.name ?? ''} onChange={(e) => setDraft({ ...draft, name: e.target.value })} />
        <select value={draft.type} onChange={(e) => setDraft({ ...draft, type: e.target.value as Product['type'] })}><option value="product">Product</option><option value="service">Service</option></select>
        <input type="number" step="0.01" placeholder="Price" value={draft.price ?? 0} onChange={(e) => setDraft({ ...draft, price: Number(e.target.value) })} />
        <input type="number" step="0.01" placeholder="VAT" value={draft.vat_rate ?? 0} onChange={(e) => setDraft({ ...draft, vat_rate: Number(e.target.value) })} />
        <input type="number" placeholder="Stock" value={draft.stock_quantity ?? 0} onChange={(e) => setDraft({ ...draft, stock_quantity: Number(e.target.value) })} />
        <input placeholder="Description" value={draft.description ?? ''} onChange={(e) => setDraft({ ...draft, description: e.target.value })} />
        <button type="submit">{editingId ? 'Update' : 'Add'} item</button>
      </form>
      <DataTable headers={['Name', 'Type', 'Price', 'VAT', 'Stock', 'Actions']}>
        {rows.map((row) => (
          <tr key={row.id}>
            <td>{row.name}</td><td>{row.type}</td><td>{row.price}</td><td>{row.vat_rate}%</td><td>{row.stock_quantity}</td>
            <td>
              <button onClick={() => { setEditingId(row.id); setDraft(row) }}>Edit</button>
              <button onClick={() => token && api.deleteProduct(token, row.id).then(load)}>Delete</button>
            </td>
          </tr>
        ))}
      </DataTable>
    </section>
  )
}
