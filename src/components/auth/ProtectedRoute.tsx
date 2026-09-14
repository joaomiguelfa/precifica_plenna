import type { ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../lib/auth/AuthContext'

export function ProtectedRoute({ children }: { children: ReactNode }) {
  const { session, profile, loading } = useAuth()
  const location = useLocation()

  if (loading) {
    return <p className="p-6 text-sm text-slate-400 dark:text-slate-500">Carregando…</p>
  }

  if (!session) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />
  }

  // profile só é null enquanto ainda está carregando — o gatilho de cadastro
  // garante que toda conta autenticada tem uma linha em pricing3d_profiles.
  if (profile === null) {
    return <p className="p-6 text-sm text-slate-400 dark:text-slate-500">Carregando…</p>
  }

  if (profile.document === '' && location.pathname !== '/completar-cadastro') {
    return <Navigate to="/completar-cadastro" replace />
  }

  return <>{children}</>
}
