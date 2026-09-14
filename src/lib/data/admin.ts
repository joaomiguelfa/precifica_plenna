import type { UserRole } from '../auth/AuthContext'
import { supabase } from '../supabase/client'

export interface UserAccount {
  id: string
  fullName: string
  document: string
  email: string
  role: UserRole
  createdAt: string
}

/** Só retorna dados de verdade quando quem chama é admin — a RLS cuida disso no banco. */
export async function listAllUsers(): Promise<UserAccount[]> {
  const { data, error } = await supabase
    .from('pricing3d_profiles')
    .select('id, full_name, document, email, role, created_at')
    .order('created_at')
  if (error) throw error
  return data.map((row) => ({
    id: row.id,
    fullName: row.full_name,
    document: row.document,
    email: row.email,
    role: row.role === 'admin' ? 'admin' : 'user',
    createdAt: row.created_at,
  }))
}

export async function updateUserRole(userId: string, role: UserRole) {
  const { error } = await supabase.from('pricing3d_profiles').update({ role }).eq('id', userId)
  if (error) throw error
}

export interface AdminPricedPieceSummary {
  id: string
  pieceName: string
  quantity: number
  totalProductionCost: number
  finalPrice: number | null
  createdAt: string
  ownerName: string
  ownerEmail: string
}

/** Todas as peças precificadas de todos os usuários — só funciona para admins (RLS). */
export async function listAllPricedPieces(search?: string): Promise<AdminPricedPieceSummary[]> {
  let query = supabase
    .from('pricing3d_priced_pieces')
    .select(
      'id, piece_name, quantity, total_production_cost, final_price, created_at, pricing3d_profiles(full_name, email)',
    )
    .order('created_at', { ascending: false })
    .limit(200)

  if (search && search.trim()) {
    query = query.ilike('piece_name', `%${search.trim()}%`)
  }

  const { data, error } = await query
  if (error) throw error

  return data.map((row) => {
    const owner = row.pricing3d_profiles as unknown as { full_name: string; email: string } | null
    return {
      id: row.id,
      pieceName: row.piece_name,
      quantity: row.quantity,
      totalProductionCost: row.total_production_cost,
      finalPrice: row.final_price,
      createdAt: row.created_at,
      ownerName: owner?.full_name ?? '—',
      ownerEmail: owner?.email ?? '—',
    }
  })
}
