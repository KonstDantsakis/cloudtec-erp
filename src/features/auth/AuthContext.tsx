import { createContext, PropsWithChildren, useContext, useEffect, useMemo, useState } from 'react'
import { supabase } from '../../lib/supabaseClient'
import { SessionUser } from '../../types/models'

interface AuthContextValue {
  user: SessionUser | null
  token: string | null
  companyId: string | null
  companyName: string | null
  loading: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
  refreshCompanyId: () => Promise<void>
  setCompanyDirect: (id: string, name?: string) => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

async function fetchDbUser(userId: string) {
  const { data } = await supabase
    .from('users')
    .select('company_id, role, full_name, email, companies(name)')
    .eq('id', userId)
    .single()
  return data as { company_id: string | null; role: string; full_name: string; email: string; companies: { name: string } | null } | null
}

export function AuthProvider({ children }: PropsWithChildren) {
  const [user, setUser] = useState<SessionUser | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [companyId, setCompanyId] = useState<string | null>(null)
  const [companyName, setCompanyName] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  const applySession = async (sessionUser: { id: string; email?: string }, accessToken: string) => {
    // Always set the token first — DB lookup is best-effort
    setToken(accessToken)

    let dbUser: Awaited<ReturnType<typeof fetchDbUser>> = null
    try {
      dbUser = await fetchDbUser(sessionUser.id)
    } catch {
      // DB unreachable — user is still authenticated, just no companyId
    }

    const cid = dbUser?.company_id ?? null
    setCompanyId(cid)
    setCompanyName(dbUser?.companies?.name ?? null)
    setUser({
      id: sessionUser.id,
      email: sessionUser.email ?? '',
      company_id: cid,
      role: (dbUser?.role ?? 'employee') as SessionUser['role'],
      full_name: dbUser?.full_name ?? sessionUser.email ?? '',
    })
  }

  useEffect(() => {
    // Safety fallback: never stay stuck on loading
    const timeout = setTimeout(() => setLoading(false), 3000)

    supabase.auth.getSession()
      .then(async ({ data: { session } }) => {
        try {
          if (session?.user) {
            await applySession(session.user, session.access_token)
          }
        } finally {
          clearTimeout(timeout)
          setLoading(false)
        }
      })
      .catch(() => {
        clearTimeout(timeout)
        setLoading(false)
      })

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
        await applySession(session.user, session.access_token)
      } else {
        setToken(null)
        setUser(null)
        setCompanyId(null)
      }
    })

    return () => {
      clearTimeout(timeout)
      subscription.unsubscribe()
    }
  }, [])

  const login = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
    // applySession will be called by onAuthStateChange, but we also call it
    // directly so the state is ready before navigate() fires in LoginPage
    if (data.session?.user) {
      await applySession(data.session.user, data.session.access_token)
    }
  }

  const logout = async () => {
    await supabase.auth.signOut()
    setToken(null)
    setUser(null)
    setCompanyId(null)
    setCompanyName(null)
  }

  const refreshCompanyId = async () => {
    if (!user) return
    try {
      const dbUser = await fetchDbUser(user.id)
      const cid = dbUser?.company_id ?? null
      setCompanyId(cid)
      setUser((prev) => (prev ? { ...prev, company_id: cid } : null))
    } catch {
      // ignore
    }
  }

  const setCompanyDirect = (id: string, name?: string) => {
    setCompanyId(id)
    if (name) setCompanyName(name)
    setUser((prev) => (prev ? { ...prev, company_id: id } : null))
  }

  const value = useMemo(
    () => ({ user, token, companyId, companyName, loading, login, logout, refreshCompanyId, setCompanyDirect }),
    [user, token, companyId, companyName, loading],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used inside AuthProvider')
  return context
}
