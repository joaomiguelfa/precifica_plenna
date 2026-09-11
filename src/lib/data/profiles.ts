import { supabase } from '../supabase/client'

export interface PrinterProfile {
  id: string
  name: string
  powerWatts: number
  acquisitionCost: number
  lifespanHours: number
}

export interface MaterialProfile {
  id: string
  name: string
  materialType: string | null
  color: string | null
  costPerKg: number
}

export interface AccessoryProfile {
  id: string
  name: string
  acquisitionCost: number
  lifespanHours: number
}

// --- Impressoras -----------------------------------------------------------

export async function listPrinterProfiles(): Promise<PrinterProfile[]> {
  const { data, error } = await supabase
    .from('pricing3d_printer_profiles')
    .select('*')
    .order('name')
  if (error) throw error
  return data.map((row) => ({
    id: row.id,
    name: row.name,
    powerWatts: row.power_watts,
    acquisitionCost: row.acquisition_cost,
    lifespanHours: row.lifespan_hours,
  }))
}

export async function upsertPrinterProfile(profile: Partial<PrinterProfile> & { name: string }) {
  const { error } = await supabase.from('pricing3d_printer_profiles').upsert(
    {
      id: profile.id,
      name: profile.name,
      power_watts: profile.powerWatts ?? 0,
      acquisition_cost: profile.acquisitionCost ?? 0,
      lifespan_hours: profile.lifespanHours ?? 0,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'id' },
  )
  if (error) throw error
}

export async function deletePrinterProfile(id: string) {
  const { error } = await supabase.from('pricing3d_printer_profiles').delete().eq('id', id)
  if (error) throw error
}

// --- Materiais ---------------------------------------------------------------

export async function listMaterialProfiles(): Promise<MaterialProfile[]> {
  const { data, error } = await supabase
    .from('pricing3d_material_profiles')
    .select('*')
    .order('name')
  if (error) throw error
  return data.map((row) => ({
    id: row.id,
    name: row.name,
    materialType: row.material_type,
    color: row.color,
    costPerKg: row.cost_per_kg,
  }))
}

export async function upsertMaterialProfile(profile: Partial<MaterialProfile> & { name: string }) {
  const { error } = await supabase.from('pricing3d_material_profiles').upsert(
    {
      id: profile.id,
      name: profile.name,
      material_type: profile.materialType ?? null,
      color: profile.color ?? null,
      cost_per_kg: profile.costPerKg ?? 0,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'id' },
  )
  if (error) throw error
}

export async function deleteMaterialProfile(id: string) {
  const { error } = await supabase.from('pricing3d_material_profiles').delete().eq('id', id)
  if (error) throw error
}

// --- Acessórios (depreciação adicional) -------------------------------------

export async function listAccessoryProfiles(): Promise<AccessoryProfile[]> {
  const { data, error } = await supabase
    .from('pricing3d_accessory_profiles')
    .select('*')
    .order('name')
  if (error) throw error
  return data.map((row) => ({
    id: row.id,
    name: row.name,
    acquisitionCost: row.acquisition_cost,
    lifespanHours: row.lifespan_hours,
  }))
}

export async function upsertAccessoryProfile(profile: Partial<AccessoryProfile> & { name: string }) {
  const { error } = await supabase.from('pricing3d_accessory_profiles').upsert(
    {
      id: profile.id,
      name: profile.name,
      acquisition_cost: profile.acquisitionCost ?? 0,
      lifespan_hours: profile.lifespanHours ?? 0,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'id' },
  )
  if (error) throw error
}

export async function deleteAccessoryProfile(id: string) {
  const { error } = await supabase.from('pricing3d_accessory_profiles').delete().eq('id', id)
  if (error) throw error
}
