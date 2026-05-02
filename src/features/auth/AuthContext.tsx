import { createContext, PropsWithChildren, useContext, useMemo, useState } from 'react'
import { createClient } from '@supabase/supabase-js'
import { SessionUser } from '../../types/models'

const supabase = createClient(import.meta.env.VITE_SUPABASE_URL, import.meta.env.VITE_SUPABASE_ANON_KEY)

interface AuthContextValue {
  user: SessionUser | null
  token: string | null
  login: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: PropsWithChildren) {
  const [user, setUser] = useState<SessionUser | null>(null)
  const [token, setToken] = useState<string | null>(null)

  const login = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error

    const accessToken = data.session?.access_token
    if (!accessToken || !data.user) throw new Error('Missing auth session')

    setToken(accessToken)
    setUser({
      id: data.user.id,
      email: data.user.email ?? '',
      company_id: (data.user.user_metadata?.company_id as string | null) ?? null,
      role: (data.user.user_metadata?.role as SessionUser['role']) ?? 'employee',
      full_name: (data.user.user_metadata?.full_name as string) ?? data.user.email ?? '',
    })
  }

  const logout = async () => {
    await supabase.auth.signOut()
    setToken(null)
    setUser(null)
  }

  const value = useMemo(() => ({ user, token, login, logout }), [user, token])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used inside AuthProvider')
  return context
}
