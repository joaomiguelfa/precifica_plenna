import { FunctionsHttpError, type Session, type User } from '@supabase/supabase-js'
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
  /** Admin-only: envia um convite por e-mail que já cria a conta e manda o link de acesso. */
  inviteUser: (params: { email: string; fullName?: string }) => Promise<void>
  /** Completa/atualiza nome e documento do próprio perfil (usado após aceitar um convite). */
  updateProfile: (params: { fullName: string; document: string }) => Promise<void>
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

  const userId = session?.user.id

  async function refreshProfile(id: string) {
    const { data } = await supabase
      .from('pricing3d_profiles')
      .select('full_name, document, email, role')
      .eq('id', id)
      .maybeSingle()
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
  }

  useEffect(() => {
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
  }, [userId])

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

  async function inviteUser({ email, fullName }: { email: string; fullName?: string }) {
    const { data, error } = await supabase.functions.invoke('invite-user', {
      body: {
        email,
        fullName: fullName ?? '',
        redirectTo: `${window.location.origin}/completar-cadastro`,
      },
    })
    if (error) {
      // A função responde com um corpo JSON { error: "mensagem em pt-BR" }
      // mesmo em erro, mas o supabase-js não lê esse corpo sozinho — sem
      // isso, o usuário só veria "Edge Function returned a non-2xx status
      // code" em vez do motivo real (e-mail já cadastrado, inválido, etc.).
      if (error instanceof FunctionsHttpError) {
        const body = await error.context.json().catch(() => null)
        throw new Error(body?.error || error.message)
      }
      throw error
    }
    if (data?.error) throw new Error(data.error)
  }

  async function updateProfile({ fullName, document }: { fullName: string; document: string }) {
    if (!userId) throw new Error('Sem sessão ativa.')
    const { error } = await supabase
      .from('pricing3d_profiles')
      .update({ full_name: fullName.trim(), document: onlyDigits(document) })
      .eq('id', userId)
    if (error) throw error
    await refreshProfile(userId)
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
        inviteUser,
        updateProfile,
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
