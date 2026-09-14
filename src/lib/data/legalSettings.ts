import { createDefaultPracticeAssumptions } from '../legalPricing/calculate'
import type { LawyerRole, PracticeAssumptions } from '../../types/legalPricing'
import { supabase } from '../supabase/client'

export async function getLegalSettings(): Promise<PracticeAssumptions> {
  const { data, error } = await supabase.from('bbcs_settings').select('*').maybeSingle()
  if (error) throw error
  if (!data) return createDefaultPracticeAssumptions()
  return {
    monthlyCostByRole: data.monthly_cost_by_role as unknown as Record<LawyerRole, number>,
    availableHoursPerMonth: data.available_hours_per_month,
    utilizationRate: data.utilization_rate,
    realizationRate: data.realization_rate,
    taxBurdenPercent: data.tax_burden_percent,
    writeOffPercent: data.write_off_percent,
    successCommissionPercent: data.success_commission_percent,
  }
}

export async function saveLegalSettings(assumptions: PracticeAssumptions) {
  const { error } = await supabase.from('bbcs_settings').upsert(
    {
      monthly_cost_by_role: assumptions.monthlyCostByRole,
      available_hours_per_month: assumptions.availableHoursPerMonth,
      utilization_rate: assumptions.utilizationRate,
      realization_rate: assumptions.realizationRate,
      tax_burden_percent: assumptions.taxBurdenPercent,
      write_off_percent: assumptions.writeOffPercent,
      success_commission_percent: assumptions.successCommissionPercent,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'user_id' },
  )
  if (error) throw error
}
