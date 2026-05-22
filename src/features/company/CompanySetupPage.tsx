import { FormEvent, useState } from 'react'
import { useAuth } from '../auth/AuthContext'

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string

export function CompanySetupPage() {
  const { token, setCompanyDirect } = useAuth()

  const [name, setName] = useState('')
  const [taxNumber, setTaxNumber] = useState('')
  const [address, setAddress] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!token) return
    setLoading(true)
    setError(null)

    console.log('[CompanySetup] Calling edge function...', { SUPABASE_URL, name })

    const res = await fetch(`${SUPABASE_URL}/functions/v1/create-company`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ name, tax_number: taxNumber, address, phone, email }),
    })

    const json = await res.json().catch(() => ({}))
    console.log('[CompanySetup] Response:', res.status, json)

    if (!res.ok) {
      console.error('[CompanySetup] Error:', json)
      setError((json as any).error ?? 'Could not create company.')
      setLoading(false)
      return
    }

    const companyId = (json as any).company_id as string
    const companyNameVal = (json as any).company?.name as string | undefined
    console.log('[CompanySetup] Setting companyId directly:', companyId, companyNameVal)
    setCompanyDirect(companyId, companyNameVal)
  }

  return (
    <div style={{ maxWidth: 480, margin: '80px auto', padding: '0 16px' }}>
      <h1 style={{ marginBottom: 8 }}>Set up your company</h1>
      <p style={{ color: '#666', marginBottom: 24 }}>
        Your account has no company linked. Create one to continue.
      </p>
      <form onSubmit={handleSubmit} className="form-grid">
        <input
          required
          placeholder="Company name *"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <input
          placeholder="Tax number (AFM)"
          value={taxNumber}
          onChange={(e) => setTaxNumber(e.target.value)}
        />
        <input
          placeholder="Address"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
        />
        <input
          placeholder="Phone"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
        />
        <input
          placeholder="Email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        {error && <p style={{ color: 'red' }}>{error}</p>}
        <button type="submit" disabled={loading}>
          {loading ? 'Creating…' : 'Create company'}
        </button>
      </form>
    </div>
  )
}
