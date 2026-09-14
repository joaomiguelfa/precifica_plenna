export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      bbcs_employees: {
        Row: {
          created_at: string
          id: string
          monthly_cost: number
          name: string
          role: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          monthly_cost?: number
          name: string
          role: string
          updated_at?: string
          user_id?: string
        }
        Update: {
          created_at?: string
          id?: string
          monthly_cost?: number
          name?: string
          role?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "bbcs_employees_profile_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "pricing3d_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      bbcs_fixed_costs: {
        Row: {
          created_at: string
          id: string
          monthly_cost: number
          name: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          monthly_cost?: number
          name: string
          updated_at?: string
          user_id?: string
        }
        Update: {
          created_at?: string
          id?: string
          monthly_cost?: number
          name?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "bbcs_fixed_costs_profile_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "pricing3d_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      bbcs_priced_cases: {
        Row: {
          case_name: string
          created_at: string
          estimated_total_revenue: number | null
          id: string
          input: Json
          result: Json
          selected_models: string[]
          updated_at: string
          user_id: string
        }
        Insert: {
          case_name?: string
          created_at?: string
          estimated_total_revenue?: number | null
          id?: string
          input: Json
          result: Json
          selected_models?: string[]
          updated_at?: string
          user_id?: string
        }
        Update: {
          case_name?: string
          created_at?: string
          estimated_total_revenue?: number | null
          id?: string
          input?: Json
          result?: Json
          selected_models?: string[]
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "bbcs_priced_cases_profile_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "pricing3d_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      pricing3d_accessory_profiles: {
        Row: {
          acquisition_cost: number
          created_at: string
          id: string
          lifespan_hours: number
          name: string
          updated_at: string
          user_id: string
        }
        Insert: {
          acquisition_cost?: number
          created_at?: string
          id?: string
          lifespan_hours?: number
          name: string
          updated_at?: string
          user_id?: string
        }
        Update: {
          acquisition_cost?: number
          created_at?: string
          id?: string
          lifespan_hours?: number
          name?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      pricing3d_material_profiles: {
        Row: {
          color: string | null
          cost_per_kg: number
          created_at: string
          id: string
          material_type: string | null
          name: string
          updated_at: string
          user_id: string
        }
        Insert: {
          color?: string | null
          cost_per_kg?: number
          created_at?: string
          id?: string
          material_type?: string | null
          name: string
          updated_at?: string
          user_id?: string
        }
        Update: {
          color?: string | null
          cost_per_kg?: number
          created_at?: string
          id?: string
          material_type?: string | null
          name?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      pricing3d_priced_pieces: {
        Row: {
          batch_total: number | null
          created_at: string
          final_price: number | null
          id: string
          input: Json
          method: string
          piece_name: string
          quantity: number
          result: Json
          total_production_cost: number
          user_id: string
        }
        Insert: {
          batch_total?: number | null
          created_at?: string
          final_price?: number | null
          id?: string
          input: Json
          method: string
          piece_name?: string
          quantity?: number
          result: Json
          total_production_cost: number
          user_id?: string
        }
        Update: {
          batch_total?: number | null
          created_at?: string
          final_price?: number | null
          id?: string
          input?: Json
          method?: string
          piece_name?: string
          quantity?: number
          result?: Json
          total_production_cost?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "pricing3d_priced_pieces_profile_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "pricing3d_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      pricing3d_printer_profiles: {
        Row: {
          acquisition_cost: number
          created_at: string
          id: string
          lifespan_hours: number
          name: string
          power_watts: number
          updated_at: string
          user_id: string
        }
        Insert: {
          acquisition_cost?: number
          created_at?: string
          id?: string
          lifespan_hours?: number
          name: string
          power_watts?: number
          updated_at?: string
          user_id?: string
        }
        Update: {
          acquisition_cost?: number
          created_at?: string
          id?: string
          lifespan_hours?: number
          name?: string
          power_watts?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      pricing3d_profiles: {
        Row: {
          created_at: string
          document: string
          email: string
          full_name: string
          id: string
          role: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          document: string
          email: string
          full_name: string
          id: string
          role?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          document?: string
          email?: string
          full_name?: string
          id?: string
          role?: string
          updated_at?: string
        }
        Relationships: []
      }
      pricing3d_settings: {
        Row: {
          currency: string
          default_payment_fee_percent: number
          default_platform_fee_percent: number
          default_tax_percent: number
          default_waste_percent: number
          energy_tariff_per_kwh: number
          updated_at: string
          user_id: string
        }
        Insert: {
          currency?: string
          default_payment_fee_percent?: number
          default_platform_fee_percent?: number
          default_tax_percent?: number
          default_waste_percent?: number
          energy_tariff_per_kwh?: number
          updated_at?: string
          user_id?: string
        }
        Update: {
          currency?: string
          default_payment_fee_percent?: number
          default_platform_fee_percent?: number
          default_tax_percent?: number
          default_waste_percent?: number
          energy_tariff_per_kwh?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      pricing3d_is_admin: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}
