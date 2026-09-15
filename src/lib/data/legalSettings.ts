import { createDefaultPracticeAssumptions } from '../legalPricing/calculate'
import type { LawyerRole, PracticeAssumptions } from '../../types/legalPricing'
import { supabase } from '../supabase/client'

export interface LegalOfficeSettings {
  assumptions: PracticeAssumptions
  /** Quantos casos o escritório atende por mês, em média — usado para ratear os custos fixos entre os casos. */
  monthlyCaseCount: number
}

export function createDefaultLegalOfficeSettings(): LegalOfficeSettings {
  return { assumptions: createDefaultPracticeAssumptions(), monthlyCaseCount: 1 }
}

export async function getLegalSettings(): Promise<LegalOfficeSettings> {
  const { data, error } = await supabase.from('bbcs_settings').select('*').maybeSingle()
  if (error) throw error
  if (!data) return createDefaultLegalOfficeSettings()
  return {
    assumptions: {
      monthlyCostByRole: data.monthly_cost_by_role as unknown as Record<LawyerRole, number>,
      availableHoursPerMonth: data.available_hours_per_month,
      utilizationRate: data.utilization_rate,
      realizationRate: data.realization_rate,
      taxBurdenPercent: data.tax_burden_percent,
      writeOffPercent: data.write_off_percent,
      successCommissionPercent: data.success_commission_percent,
    },
    monthlyCaseCount: data.monthly_case_count,
  }
}

export async function saveLegalSettings(settings: LegalOfficeSettings) {
  const { error } = await supabase.from('bbcs_settings').upsert(
    {
      id: true,
      monthly_cost_by_role: settings.assumptions.monthlyCostByRole,
      available_hours_per_month: settings.assumptions.availableHoursPerMonth,
      utilization_rate: settings.assumptions.utilizationRate,
      realization_rate: settings.assumptions.realizationRate,
      tax_burden_percent: settings.assumptions.taxBurdenPercent,
      write_off_percent: settings.assumptions.writeOffPercent,
      success_commission_percent: settings.assumptions.successCommissionPercent,
      monthly_case_count: settings.monthlyCaseCount,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'id' },
  )
  if (error) throw error
}
