import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { supabase } from '@/lib/supabaseClient'

type Role = 'admin' | 'user'
type Profile = { id: string; full_name?: string | null; role: Role | null }

type AuthState = {
  loading: boolean
  user: Awaited<ReturnType<typeof supabase.auth.getUser>>['data']['user'] | null
  profile: Profile | null
  signIn: (email: string, password: string) => Promise<{ error?: Error }>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthState | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<AuthState['user']>(null)
  const [profile, setProfile] = useState<Profile | null>(null)

  const loadProfile = async (userId: string) => {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, full_name, role')
      .eq('id', userId)
      .single()

    if (error) {
      console.error('[AuthContext] Error loading profile:', error.message)
      setProfile(null)
      return
    }

    if (!data) {
      setProfile(null)
      return
    }

    const safeProfile: Profile = {
      id: data.id,
      full_name: data.full_name,
      role: (data.role as Role | null) ?? null,
    }

    console.log('[AuthContext] loaded profile:', safeProfile)
    setProfile(safeProfile)
  }

  useEffect(() => {
    let cancelled = false

    const syncFromSession = async (
      session: Awaited<ReturnType<typeof supabase.auth.getSession>>['data']['session'],
    ) => {
      if (cancelled) return

      if (session?.user) {
        setUser(session.user)
        await loadProfile(session.user.id)
      } else {
        setUser(null)
        setProfile(null)
      }
    }

    const init = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession()
        await syncFromSession(session)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      // This keeps state in sync for SIGNED_IN / SIGNED_OUT / TOKEN_REFRESHED, etc.
      syncFromSession(session)
    })

    init()

    return () => {
      cancelled = true
      sub?.subscription.unsubscribe()
    }
  }, [])

  const signIn: AuthState['signIn'] = async (email, password) => {
    console.log('[AuthContext] signIn called with:', email)

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      console.log('[AuthContext] signIn result:', { data, error })

      if (error) {
        console.error('[AuthContext] signIn error:', error.message)
        return { error }
      }

      // We don't manually touch user/profile here:
      // getSession + onAuthStateChange will handle it.
      return {}
    } catch (e) {
      console.error('[AuthContext] signIn threw unexpectedly:', e)
      return { error: e as Error }
    }
  }

  const signOut: AuthState['signOut'] = async () => {
    console.log('🟡 [AuthContext] signOut called')

    try {
      const { error } = await supabase.auth.signOut({ scope: 'local' })
      if (error) {
        console.error('[AuthContext] supabase signOut error:', error.message)
      }
      // onAuthStateChange will sync user/profile to null
    } catch (e) {
      console.error('[AuthContext] signOut threw:', e)
    }
  }

  return (
    <AuthContext.Provider value={{ loading, user, profile, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
