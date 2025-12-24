// src/pages/auth/Register.tsx
import React, { useState } from 'react';
import { supabase } from '@/lib/supabaseClient';

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

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        role: 'user',
        full_name: fullName,
      },
    },
  })

  if (error) {
    console.error('Supabase signUp error', error)
    setError(error.message)
    setLoading(false)
    return
  }

  const user = data.user
  if (!user) {
    setError('Κάτι πήγε στραβά, προσπαθήστε ξανά.')
    setLoading(false)
    return
  }

  const { error: insertError } = await supabase.from('customers').insert({
    auth_user_id: user.id,
    full_name: fullName,
    email,
    phone,
    registration_status: 'pending',
  })

  if (insertError) {
    console.error(insertError)
    setError(
      'Η δημιουργία του λογαριασμού ολοκληρώθηκε, αλλά υπήρξε σφάλμα στην καταχώρηση των στοιχείων. Επικοινωνήστε με τον σύλλογο.',
    )
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
