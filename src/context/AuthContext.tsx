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

    console.log(data)
    if (data) {
      setProfile(data as Profile)
      console.log(data)
    }
  }

useEffect(() => {
  let mounted = true

  ;(async () => {
    try {
      const { data, error } = await supabase.auth.getSession()

      if (!mounted) return

      if (error) {
        console.error('getSession error:', error.message)
      }

      console.log('[AuthContext] initial session:', data.session)
      setSession(data.session ?? null)

      if (data.session?.user?.id) {
        await loadProfile(data.session.user.id)
      }
    } catch (e) {
      console.error('💥 getSession threw unexpectedly:', e)
    } finally {
      if (mounted) {
        setLoading(false)          // ✅ ALWAYS clear loading
      }
    }
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
  console.log('🟡 [AuthContext] signIn called with:', email)

  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    console.log('🟡 [AuthContext] signIn result:', { data, error })

    if (error) {
      console.error('❌ [AuthContext] signIn error:', error.message)
      return { error }
    }

    // ✅ update session immediately so ProtectedRoute sees it
    setSession(data.session ?? null)

    if (data.user?.id) {
      try {
        await loadProfile(data.user.id)
      } catch (err) {
        console.error('💥 [AuthContext] loadProfile error after signIn:', err)
      }
    }

    return {}
  } catch (e) {
    console.error('💥 [AuthContext] signIn threw unexpectedly:', e)
    return { error: e as Error }
  }
}




const signOut: AuthState['signOut'] = async () => {
  console.log('🟡 signOut() from AuthContext called')

  // Fire-and-forget, we don't depend on the result
  supabase.auth
    .signOut({ scope: 'local' })       // or just signOut() if you're on v1
    .then((res) => {
      console.log('ℹ️ supabase signOut finished:', res)
    })
    .catch((err) => {
      console.error('💥 supabase signOut error:', err)
    })

  // Clear our own auth state immediately
  setSession(null)
  setProfile(null)
  console.log('🧹 Auth state cleared (session & profile set to null)')

  // Force user to login (HashRouter)
  window.location.hash = '#/login'
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
