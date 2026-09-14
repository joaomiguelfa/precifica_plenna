import type { ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../../lib/auth/AuthContext'

export function AdminRoute({ children }: { children: ReactNode }) {
  const { loading, isAdmin } = useAuth()

  if (loading) {
    return <p className="p-6 text-sm text-slate-400">Carregando…</p>
  }

  if (!isAdmin) {
    return <Navigate to="/" replace />
  }

  return <>{children}</>
}
