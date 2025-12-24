// src/context/AuthContext.tsx
import React, {
  createContext,
  useContext,
  useEffect,
  useState,
} from 'react'
import { supabase } from '@/lib/supabaseClient'
import type { AuthError, User } from '@supabase/supabase-js'

type AppUserRole = 'admin' | 'user'

type AuthContextType = {
  user: User | null
  role: AppUserRole | null
  loading: boolean
  signIn: (
    email: string,
    password: string,
  ) => Promise<{ error: AuthError | null }>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

const extractRole = (u: User | null): AppUserRole | null => {
  if (!u) return null
  const metadata = (u.user_metadata ?? {}) as { role?: string }

  // Αν το metadata έχει role === 'admin', είναι admin.
  // Οτιδήποτε άλλο (ή undefined) το θεωρούμε user.
   if (metadata.role === 'admin') return 'admin'
  if (metadata.role === 'user') return 'user'
  return null   
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(null)
  const [role, setRole] = useState<AppUserRole | null>(null)
  const [loading, setLoading] = useState<boolean>(true)

  // Αρχικό load user από supabase
  useEffect(() => {
    const init = async () => {
      setLoading(true)
      const { data, error } = await supabase.auth.getUser()

      if (!error && data.user) {
        setUser(data.user)
        setRole(extractRole(data.user))
      } else {
        setUser(null)
        setRole(null)
      }

      setLoading(false)
    }

    void init()

    // Listener για αλλαγές login/logout
    const { data: authListener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        const u = session?.user ?? null
        setUser(u)
        setRole(extractRole(u))
      },
    )

    return () => {
      authListener?.subscription.unsubscribe()
    }
  }, [])

  const signIn = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (!error && data.user) {
      setUser(data.user)
      setRole(extractRole(data.user))
    }

    return { error }
  }

  const signOut = async () => {
    await supabase.auth.signOut()
    setUser(null)
    setRole(null)
  }

  const value: AuthContextType = {
    user,
    role,
    loading,
    signIn,
    signOut,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export const useAuth = (): AuthContextType => {
  const ctx = useContext(AuthContext)
  if (!ctx) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return ctx
}
