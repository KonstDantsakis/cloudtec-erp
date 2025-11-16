import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { supabase } from '@/lib/supabaseClient'

type Role = 'admin' | 'user'
type Profile = { id: string; full_name?: string | null; role: Role }

type AuthState = {
  loading: boolean
  session: Awaited<ReturnType<typeof supabase.auth.getSession>>['data']['session'] | null
  profile: Profile | null
  signIn: (email: string, password: string) => Promise<{ error?: Error }>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthState | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [loading, setLoading] = useState(true)
  const [session, setSession] = useState<AuthState['session']>(null)
  const [profile, setProfile] = useState<Profile | null>(null)

  const loadProfile = async (userId: string) => {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, full_name, role')
      .eq('id', userId)
      .single()

    if (error) {
      console.error('Error loading profile:', error.message)
      setProfile(null)
      return
    }

    if (data) {
      setProfile(data as Profile)
    }
  }

  useEffect(() => {
    let mounted = true

    ;(async () => {
      const { data, error } = await supabase.auth.getSession()
      if (!mounted) return

      if (error) {
        console.error('getSession error:', error.message)
      }

      setSession(data.session ?? null)

      if (data.session?.user?.id) {
        await loadProfile(data.session.user.id)
      }

      setLoading(false)
    })()

    const { data: sub } = supabase.auth.onAuthStateChange(async (event, sess) => {
      console.log('Auth state change:', event, sess?.user?.email)
      setSession(sess ?? null)

      if (sess?.user?.id) {
        await loadProfile(sess.user.id)
      } else {
        setProfile(null)
      }
    })

    return () => {
      mounted = false
      sub?.subscription.unsubscribe()
    }
  }, [])

  const signIn: AuthState['signIn'] = async (email, password) => {
    console.log('Attempting signIn for email:', email)
  const { data, error } = await supabase.auth.signInWithPassword({ email, password })
  console.log('RESULT FROM SUPABASE:', { data, error })


  if (error) {
    console.error('signIn error:', error.message)
    return { error }
  }

  if (data.user?.id) {
    console.log('signIn successful for user ID:', data.user.id)
    try {
      await loadProfile(data.user.id)
    } catch (err) {
      console.error('loadProfile error:', err)
      // don't rethrow, just log
    }
  }

  return {}
}


  const signOut = async () => {
    await supabase.auth.signOut()
    setSession(null)
    setProfile(null)
  }

  return (
    <AuthContext.Provider value={{ loading, session, profile, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
