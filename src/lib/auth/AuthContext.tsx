import type { Session, User } from '@supabase/supabase-js'
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { supabase } from '../supabase/client'
import { onlyDigits } from '../validation/document'

export type UserRole = 'admin' | 'user'

export interface SellerProfile {
  fullName: string
  document: string
  email: string
  role: UserRole
}

interface AuthContextValue {
  session: Session | null
  user: User | null
  profile: SellerProfile | null
  loading: boolean
  isAdmin: boolean
  /** true depois que o usuário abre o link de "esqueci minha senha" (sessão de recuperação). */
  passwordRecovery: boolean
  signUp: (params: { fullName: string; document: string; email: string; password: string }) => Promise<{ needsEmailConfirmation: boolean }>
  signIn: (params: { email: string; password: string }) => Promise<void>
  signOut: () => Promise<void>
  resetPassword: (email: string) => Promise<void>
  updatePassword: (newPassword: string) => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [profile, setProfile] = useState<SellerProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [passwordRecovery, setPasswordRecovery] = useState(false)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      setLoading(false)
    })

    const { data: subscription } = supabase.auth.onAuthStateChange((event, newSession) => {
      setSession(newSession)
      if (event === 'PASSWORD_RECOVERY') setPasswordRecovery(true)
      if (event === 'SIGNED_OUT') setPasswordRecovery(false)
    })

    return () => subscription.subscription.unsubscribe()
  }, [])

  useEffect(() => {
    const userId = session?.user.id
    if (!userId) {
      setProfile(null)
      return
    }

    let cancelled = false
    supabase
      .from('pricing3d_profiles')
      .select('full_name, document, email, role')
      .eq('id', userId)
      .maybeSingle()
      .then(({ data }) => {
        if (cancelled) return
        setProfile(
          data
            ? {
                fullName: data.full_name,
                document: data.document,
                email: data.email,
                role: data.role === 'admin' ? 'admin' : 'user',
              }
            : null,
        )
      })
    return () => {
      cancelled = true
    }
  }, [session?.user.id])

  async function signUp({
    fullName,
    document,
    email,
    password,
  }: {
    fullName: string
    document: string
    email: string
    password: string
  }) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName.trim(), document: onlyDigits(document) },
      },
    })
    if (error) throw error
    return { needsEmailConfirmation: !data.session }
  }

  async function signIn({ email, password }: { email: string; password: string }) {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
  }

  async function signOut() {
    await supabase.auth.signOut()
  }

  async function resetPassword(email: string) {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/redefinir-senha`,
    })
    if (error) throw error
  }

  async function updatePassword(newPassword: string) {
    const { error } = await supabase.auth.updateUser({ password: newPassword })
    if (error) throw error
    setPasswordRecovery(false)
  }

  return (
    <AuthContext.Provider
      value={{
        session,
        user: session?.user ?? null,
        profile,
        loading,
        isAdmin: profile?.role === 'admin',
        passwordRecovery,
        signUp,
        signIn,
        signOut,
        resetPassword,
        updatePassword,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth precisa estar dentro de <AuthProvider>')
  return ctx
}
