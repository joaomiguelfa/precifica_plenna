import type { LawyerRole } from '../../types/legalPricing'
import { supabase } from '../supabase/client'

export interface EmployeeProfile {
  id: string
  name: string
  role: LawyerRole
  monthlyCost: number
}

export interface FixedCostProfile {
  id: string
  name: string
  monthlyCost: number
}

// --- Funcionários -----------------------------------------------------------

export async function listEmployeeProfiles(): Promise<EmployeeProfile[]> {
  const { data, error } = await supabase.from('bbcs_employees').select('*').order('name')
  if (error) throw error
  return data.map((row) => ({
    id: row.id,
    name: row.name,
    role: row.role as LawyerRole,
    monthlyCost: row.monthly_cost,
  }))
}

export async function upsertEmployeeProfile(profile: Partial<EmployeeProfile> & { name: string; role: LawyerRole }) {
  const { error } = await supabase.from('bbcs_employees').upsert(
    {
      id: profile.id,
      name: profile.name,
      role: profile.role,
      monthly_cost: profile.monthlyCost ?? 0,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'id' },
  )
  if (error) throw error
}

export async function deleteEmployeeProfile(id: string) {
  const { error } = await supabase.from('bbcs_employees').delete().eq('id', id)
  if (error) throw error
}

// --- Custos fixos -------------------------------------------------------------

export async function listFixedCostProfiles(): Promise<FixedCostProfile[]> {
  const { data, error } = await supabase.from('bbcs_fixed_costs').select('*').order('name')
  if (error) throw error
  return data.map((row) => ({
    id: row.id,
    name: row.name,
    monthlyCost: row.monthly_cost,
  }))
}

export async function upsertFixedCostProfile(profile: Partial<FixedCostProfile> & { name: string }) {
  const { error } = await supabase.from('bbcs_fixed_costs').upsert(
    {
      id: profile.id,
      name: profile.name,
      monthly_cost: profile.monthlyCost ?? 0,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'id' },
  )
  if (error) throw error
}

export async function deleteFixedCostProfile(id: string) {
  const { error } = await supabase.from('bbcs_fixed_costs').delete().eq('id', id)
  if (error) throw error
}
