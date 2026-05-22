// src/pages/auth/Register.tsx
import React, { useState } from 'react'

const RegisterPage: React.FC = () => {
  const [fullName, setFullName] = useState<string>('');
  const [phone, setPhone] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');

  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

 const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
  e.preventDefault()
  setLoading(true)
  setError(null)
  setSuccess(null)

  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string
  const res = await fetch(`${supabaseUrl}/functions/v1/register-member`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password, full_name: fullName, phone }),
  })

  const json = await res.json().catch(() => ({}))

  if (!res.ok) {
    setError((json as any).error ?? 'Σφάλμα κατά την εγγραφή.')
    setLoading(false)
    return
  }

  setLoading(false)
  setSuccess(
    'Η αίτηση εγγραφής καταχωρήθηκε. Θα ενημερωθείτε όταν εγκριθεί από το ΔΣ.',
  )
  setFullName('')
  setPhone('')
  setEmail('')
  setPassword('')
}


  return (
    <div className="container py-5">
      <h1 className="mb-4">Εγγραφή Μέλους</h1>

      <form onSubmit={handleSubmit} style={{ maxWidth: 480 }}>
        <div className="mb-3">
          <label className="form-label">Ονοματεπώνυμο</label>
          <input
            type="text"
            className="form-control"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            required
          />
        </div>

        <div className="mb-3">
          <label className="form-label">Τηλέφωνο</label>
          <input
            type="tel"
            className="form-control"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />
        </div>

        <div className="mb-3">
          <label className="form-label">Email</label>
          <input
            type="email"
            className="form-control"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>

        <div className="mb-3">
          <label className="form-label">Κωδικός πρόσβασης</label>
          <input
            type="password"
            className="form-control"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
          />
        </div>

        {error && <div className="alert alert-danger">{error}</div>}
        {success && <div className="alert alert-success">{success}</div>}

        <button
          type="submit"
          className="btn btn-primary"
          disabled={loading}
        >
          {loading ? 'Γίνεται εγγραφή…' : 'Υποβολή αίτησης'}
        </button>
      </form>
    </div>
  );
};

export default RegisterPage;
