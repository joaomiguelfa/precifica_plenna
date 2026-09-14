import type { CombinedLegalResult, LegalFeeModel, LegalPricingInput } from '../../types/legalPricing'
import type { Json } from '../../types/supabase'
import { supabase } from '../supabase/client'

export interface PricedLegalCaseSummary {
  id: string
  caseName: string
  selectedModels: LegalFeeModel[]
  estimatedTotalRevenue: number | null
  createdAt: string
}

export interface PricedLegalCase extends PricedLegalCaseSummary {
  input: LegalPricingInput
  result: CombinedLegalResult
}

export async function saveLegalCase(input: LegalPricingInput, result: CombinedLegalResult): Promise<string> {
  const { data, error } = await supabase
    .from('bbcs_priced_cases')
    .insert({
      case_name: input.caseName || 'Caso sem nome',
      selected_models: input.selectedModels,
      estimated_total_revenue: result.estimatedTotalRevenue,
      input: input as unknown as Json,
      result: result as unknown as Json,
    })
    .select('id')
    .single()
  if (error) throw error
  return data.id
}

export async function listLegalCases(search?: string): Promise<PricedLegalCaseSummary[]> {
  let query = supabase
    .from('bbcs_priced_cases')
    .select('id, case_name, selected_models, estimated_total_revenue, created_at')
    .order('created_at', { ascending: false })
    .limit(100)

  if (search && search.trim()) {
    query = query.ilike('case_name', `%${search.trim()}%`)
  }

  const { data, error } = await query
  if (error) throw error
  return data.map((row) => ({
    id: row.id,
    caseName: row.case_name,
    selectedModels: row.selected_models as LegalFeeModel[],
    estimatedTotalRevenue: row.estimated_total_revenue,
    createdAt: row.created_at,
  }))
}

export async function getLegalCase(id: string): Promise<PricedLegalCase> {
  const { data, error } = await supabase.from('bbcs_priced_cases').select('*').eq('id', id).single()
  if (error) throw error
  return {
    id: data.id,
    caseName: data.case_name,
    selectedModels: data.selected_models as LegalFeeModel[],
    estimatedTotalRevenue: data.estimated_total_revenue,
    createdAt: data.created_at,
    input: data.input as unknown as LegalPricingInput,
    result: data.result as unknown as CombinedLegalResult,
  }
}

export async function deleteLegalCase(id: string) {
  const { error } = await supabase.from('bbcs_priced_cases').delete().eq('id', id)
  if (error) throw error
}
