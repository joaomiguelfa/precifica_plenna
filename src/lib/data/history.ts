import type { PricingInput, PricingResult } from '../../types/pricing'
import type { Json } from '../../types/supabase'
import { supabase } from '../supabase/client'

export interface PricedPieceSummary {
  id: string
  pieceName: string
  quantity: number
  method: string
  totalProductionCost: number
  finalPrice: number | null
  batchTotal: number | null
  createdAt: string
}

export interface PricedPiece extends PricedPieceSummary {
  input: PricingInput
  result: PricingResult
}

export async function savePricedPiece(input: PricingInput, result: PricingResult): Promise<string> {
  const { data, error } = await supabase
    .from('pricing3d_priced_pieces')
    .insert({
      piece_name: input.pieceName || 'Peça sem nome',
      quantity: input.quantity || 1,
      method: input.margin.method,
      total_production_cost: result.costBreakdown.totalProductionCost,
      final_price: result.selected.finalPrice,
      batch_total: result.batchTotal,
      input: input as unknown as Json,
      result: result as unknown as Json,
    })
    .select('id')
    .single()
  if (error) throw error
  return data.id
}

export async function listPricedPieces(search?: string): Promise<PricedPieceSummary[]> {
  let query = supabase
    .from('pricing3d_priced_pieces')
    .select('id, piece_name, quantity, method, total_production_cost, final_price, batch_total, created_at')
    .order('created_at', { ascending: false })
    .limit(100)

  if (search && search.trim()) {
    query = query.ilike('piece_name', `%${search.trim()}%`)
  }

  const { data, error } = await query
  if (error) throw error
  return data.map((row) => ({
    id: row.id,
    pieceName: row.piece_name,
    quantity: row.quantity,
    method: row.method,
    totalProductionCost: row.total_production_cost,
    finalPrice: row.final_price,
    batchTotal: row.batch_total,
    createdAt: row.created_at,
  }))
}

export async function getPricedPiece(id: string): Promise<PricedPiece> {
  const { data, error } = await supabase
    .from('pricing3d_priced_pieces')
    .select('*')
    .eq('id', id)
    .single()
  if (error) throw error
  return {
    id: data.id,
    pieceName: data.piece_name,
    quantity: data.quantity,
    method: data.method,
    totalProductionCost: data.total_production_cost,
    finalPrice: data.final_price,
    batchTotal: data.batch_total,
    createdAt: data.created_at,
    input: data.input as unknown as PricingInput,
    result: data.result as unknown as PricingResult,
  }
}

export async function deletePricedPiece(id: string) {
  const { error } = await supabase.from('pricing3d_priced_pieces').delete().eq('id', id)
  if (error) throw error
}
