import { FormEvent, useEffect, useState } from 'react'
import { DataTable } from '../../components/common/DataTable'
import { useAuth } from '../auth/AuthContext'

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string

interface AdminUser {
  id: string
  email: string
  full_name: string
  created_at: string
  companies: { name: string } | null
}

export function SuperAdminPage() {
  const { token, user, logout } = useAuth()
  const [admins, setAdmins] = useState<AdminUser[]>([])
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<AdminUser | null>(null)

  const headers = { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }

  const load = async () => {
    if (!token) return
    const res = await fetch(`${SUPABASE_URL}/functions/v1/list-admins`, { headers })
    if (res.ok) setAdmins(await res.json())
  }

  useEffect(() => { load() }, [token])

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError(null)
    setSuccess(null)
    const res = await fetch(`${SUPABASE_URL}/functions/v1/create-admin`, {
      method: 'POST', headers,
      body: JSON.stringify({ email, password }),
    })
    const json = await res.json()
    if (!res.ok) { setError(json.error ?? 'Error'); setSaving(false); return }
    setSuccess(`Admin "${email}" created successfully`)
    setEmail('')
    setPassword('')
    setSaving(false)
    load()
  }

  const handleDelete = async (admin: AdminUser) => {
    if (!token) return
    const res = await fetch(`${SUPABASE_URL}/functions/v1/delete-admin`, {
      method: 'POST', headers,
      body: JSON.stringify({ id: admin.id }),
    })
    if (res.ok) { setDeleteTarget(null); load() }
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc' }}>
      <header style={topbar}>
        <span style={{ fontWeight: 700, fontSize: '1.1rem' }}>Super Admin Panel</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <span style={{ fontSize: '0.85rem', color: '#64748b' }}>{user?.email}</span>
          <button onClick={() => logout()} style={logoutBtn}>Logout</button>
        </div>
      </header>

      <main style={{ maxWidth: 860, margin: '2rem auto', padding: '0 1rem' }}>
        <h1 style={{ marginBottom: '1.5rem' }}>Admin Users</h1>

        <div style={card}>
          <h2 style={{ margin: '0 0 1rem', fontSize: '1rem' }}>Create new admin</h2>
          <form onSubmit={handleSubmit} style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'flex-end' }}>
            <label style={labelStyle}>
              Email *
              <input required type="email" value={email} onChange={(e) => setEmail(e.target.value)} style={inputStyle} />
            </label>
            <label style={labelStyle}>
              Password *
              <input required type="password" minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} style={inputStyle} />
            </label>
            <button type="submit" disabled={saving} style={primaryBtn}>
              {saving ? 'Creating…' : '+ Create admin'}
            </button>
          </form>
          {error && <p style={{ color: '#dc2626', marginTop: '0.5rem', fontSize: '0.875rem' }}>{error}</p>}
          {success && <p style={{ color: '#16a34a', marginTop: '0.5rem', fontSize: '0.875rem' }}>{success}</p>}
        </div>

        <div style={{ marginTop: '2rem' }}>
          <DataTable headers={['Email', 'Company', 'Created', '']}>
            {admins.map((admin) => (
              <tr key={admin.id}>
                <td>{admin.email}</td>
                <td>{admin.companies?.name ?? <span style={{ color: '#94a3b8' }}>No company yet</span>}</td>
                <td>{new Date(admin.created_at).toLocaleDateString('el-GR')}</td>
                <td>
                  <button
                    onClick={() => setDeleteTarget(admin)}
                    style={{ color: '#dc2626', borderColor: '#dc2626', background: 'none', border: '1px solid', padding: '.3rem .7rem', borderRadius: '.4rem', cursor: 'pointer' }}
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </DataTable>
          {admins.length === 0 && (
            <p style={{ textAlign: 'center', color: '#94a3b8', marginTop: '2rem' }}>No admin users yet.</p>
          )}
        </div>
      </main>

      {deleteTarget && (
        <div style={overlay} onClick={() => setDeleteTarget(null)}>
          <div style={modal} onClick={(e) => e.stopPropagation()}>
            <h2 style={{ margin: '0 0 .5rem' }}>Delete admin</h2>
            <p style={{ margin: '0 0 1.2rem', color: '#475569' }}>
              Are you sure you want to delete <strong>{deleteTarget.email}</strong>? This cannot be undone.
            </p>
            <div style={{ display: 'flex', gap: '.6rem', justifyContent: 'flex-end' }}>
              <button onClick={() => setDeleteTarget(null)} style={cancelBtn}>Cancel</button>
              <button onClick={() => handleDelete(deleteTarget)} style={dangerBtn}>Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

const topbar: React.CSSProperties = {
  background: '#0f172a', color: '#fff',
  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
  padding: '0.75rem 1.5rem',
}
const card: React.CSSProperties = {
  background: '#fff', borderRadius: '12px',
  padding: '1.5rem', boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
}
const labelStyle: React.CSSProperties = { display: 'flex', flexDirection: 'column', gap: '0.25rem', fontSize: '0.875rem', fontWeight: 500 }
const inputStyle: React.CSSProperties = { padding: '.45rem .7rem', border: '1px solid #cbd5e1', borderRadius: '.4rem', fontSize: '0.9rem', minWidth: 220 }
const primaryBtn: React.CSSProperties = { background: '#0f172a', color: '#fff', border: 'none', padding: '.5rem 1rem', borderRadius: '.45rem', cursor: 'pointer', fontWeight: 500 }
const logoutBtn: React.CSSProperties = { background: 'none', color: '#fff', border: '1px solid #475569', padding: '.3rem .75rem', borderRadius: '.4rem', cursor: 'pointer' }
const cancelBtn: React.CSSProperties = { background: '#fff', color: '#0f172a', border: '1px solid #cbd5e1', padding: '.5rem 1rem', borderRadius: '.45rem', cursor: 'pointer' }
const dangerBtn: React.CSSProperties = { background: '#dc2626', color: '#fff', border: 'none', padding: '.5rem 1rem', borderRadius: '.45rem', cursor: 'pointer' }
const overlay: React.CSSProperties = { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }
const modal: React.CSSProperties = { background: '#fff', borderRadius: '12px', padding: '1.5rem', width: '100%', maxWidth: 420, boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }
