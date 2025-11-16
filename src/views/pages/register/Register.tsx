// src/views/pages/register/Register.tsx
import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  CAlert,
  CButton,
  CCard,
  CCardBody,
  CCol,
  CContainer,
  CForm,
  CFormInput,
  CInputGroup,
  CInputGroupText,
  CRow,
} from '@coreui/react'
import CIcon from '@coreui/icons-react'
import { cilLockLocked, cilUser } from '@coreui/icons'
import { supabase } from '@/lib/supabaseClient'

const Register: React.FC = () => {
  const navigate = useNavigate()

  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(null)

    // basic client-side checks
    if (!fullName.trim()) return setError('Please enter your name.')
    if (!email.trim()) return setError('Please enter an email.')
    if (password.length < 6) return setError('Password must be at least 6 characters.')
    if (password !== confirm) return setError('Passwords do not match.')

    setLoading(true)
    try {
      // include full_name in user metadata so our trigger can read it
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: { full_name: fullName.trim() },
          emailRedirectTo: `${window.location.origin}/#/login`, // for magic link confirmation (HashRouter)
        },
      })

      if (error) {
        setError(error.message)
        setLoading(false)
        return
      }

      // If your project requires email confirmation, Supabase won't start a session now.
      // We'll show a success message asking the user to check their email.
      if (!data.session) {
        setSuccess('Account created. Please check your email to confirm your address.')
        setLoading(false)
        return
      }

      // If email confirmation is OFF and we have a session, you *may* upsert profile here
      // in case you didn't add the on_auth_user_created trigger.
      // Comment out if you rely on the trigger exclusively.
      try {
        await supabase.from('profiles').upsert({
          id: data.user!.id,
          full_name: fullName.trim(),
          // role defaults to 'user' via DB if you set it; otherwise omit or set here
        })
      } catch {
        // ignore – RLS or trigger will handle it
      }

      setSuccess('Account created.')
      // Redirect to home (which will send user to /app or /admin based on role)
      navigate('/', { replace: true })
    } catch (err: any) {
      setError(err?.message ?? 'Registration failed.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-body-tertiary min-vh-100 d-flex flex-row align-items-center">
      <CContainer>
        <CRow className="justify-content-center">
          <CCol md={9} lg={7} xl={6}>
            <CCard className="mx-4">
              <CCardBody className="p-4">
                <CForm onSubmit={handleSubmit}>
                  <h1>Register</h1>
                  <p className="text-body-secondary">Create your account</p>

                  {error && (
                    <CAlert color="danger" className="mb-3">
                      {error}
                    </CAlert>
                  )}
                  {success && (
                    <CAlert color="success" className="mb-3">
                      {success}
                    </CAlert>
                  )}

                  <CInputGroup className="mb-3">
                    <CInputGroupText>
                      <CIcon icon={cilUser} />
                    </CInputGroupText>
                    <CFormInput
                      placeholder="Full name"
                      autoComplete="name"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      required
                    />
                  </CInputGroup>

                  <CInputGroup className="mb-3">
                    <CInputGroupText>@</CInputGroupText>
                    <CFormInput
                      type="email"
                      placeholder="Email"
                      autoComplete="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </CInputGroup>

                  <CInputGroup className="mb-3">
                    <CInputGroupText>
                      <CIcon icon={cilLockLocked} />
                    </CInputGroupText>
                    <CFormInput
                      type="password"
                      placeholder="Password"
                      autoComplete="new-password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                  </CInputGroup>

                  <CInputGroup className="mb-4">
                    <CInputGroupText>
                      <CIcon icon={cilLockLocked} />
                    </CInputGroupText>
                    <CFormInput
                      type="password"
                      placeholder="Repeat password"
                      autoComplete="new-password"
                      value={confirm}
                      onChange={(e) => setConfirm(e.target.value)}
                      required
                    />
                  </CInputGroup>

                  <div className="d-grid">
                    <CButton color="success" type="submit" disabled={loading}>
                      {loading ? 'Creating…' : 'Create Account'}
                    </CButton>
                  </div>

                  {/* Optional: link back to login */}
                  <div className="text-center mt-3">
                    <button
                      type="button"
                      className="btn btn-link p-0"
                      onClick={() => navigate('/login')}
                    >
                      Already have an account? Sign in
                    </button>
                  </div>
                </CForm>
              </CCardBody>
            </CCard>
          </CCol>
        </CRow>
      </CContainer>
    </div>
  )
}

export default Register
