import { supabase } from '../supabase/client'

export interface AppSettings {
  energyTariffPerKwh: number
  defaultPlatformFeePercent: number
  defaultPaymentFeePercent: number
  defaultTaxPercent: number
  defaultWastePercent: number
  currency: string
}

export const DEFAULT_SETTINGS: AppSettings = {
  energyTariffPerKwh: 0.95,
  defaultPlatformFeePercent: 12,
  defaultPaymentFeePercent: 4.99,
  defaultTaxPercent: 6,
  defaultWastePercent: 5,
  currency: 'BRL',
}

export async function getSettings(): Promise<AppSettings> {
  const { data, error } = await supabase.from('pricing3d_settings').select('*').maybeSingle()
  if (error) throw error
  if (!data) return DEFAULT_SETTINGS
  return {
    energyTariffPerKwh: data.energy_tariff_per_kwh,
    defaultPlatformFeePercent: data.default_platform_fee_percent,
    defaultPaymentFeePercent: data.default_payment_fee_percent,
    defaultTaxPercent: data.default_tax_percent,
    defaultWastePercent: data.default_waste_percent,
    currency: data.currency,
  }
}

export async function saveSettings(settings: AppSettings) {
  const { error } = await supabase.from('pricing3d_settings').upsert(
    {
      energy_tariff_per_kwh: settings.energyTariffPerKwh,
      default_platform_fee_percent: settings.defaultPlatformFeePercent,
      default_payment_fee_percent: settings.defaultPaymentFeePercent,
      default_tax_percent: settings.defaultTaxPercent,
      default_waste_percent: settings.defaultWastePercent,
      currency: settings.currency,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'user_id' },
  )
  if (error) throw error
}
