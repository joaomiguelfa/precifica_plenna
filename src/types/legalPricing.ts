/**
 * Precificação de honorários para escritórios de advocacia (ex.: BBCS
 * Advocacia). Modelo baseado nos dados reais de premissas/DRE do escritório:
 * mix de receita em 4 linhas de honorário, custo de hora técnica por cargo,
 * carga tributária efetiva, comissão sobre êxito e provisão para
 * cancelamentos/glosas.
 */

export type LegalFeeModel = 'hourly' | 'recurring' | 'success' | 'adhoc'

export type LawyerRole = 'socio' | 'associado_senior' | 'associado_junior' | 'estagiario' | 'paralegal'

export const LAWYER_ROLE_LABELS: Record<LawyerRole, string> = {
  socio: 'Sócio',
  associado_senior: 'Associado sênior',
  associado_junior: 'Associado júnior',
  estagiario: 'Estagiário',
  paralegal: 'Paralegal / suporte técnico',
}

// ---------------------------------------------------------------------------
// Premissas do escritório (rateio de hora técnica, tributos, risco)
// ---------------------------------------------------------------------------

export interface PracticeAssumptions {
  /** Custo mensal médio (com encargos), por cargo, em R$. */
  monthlyCostByRole: Record<LawyerRole, number>
  /** Horas disponíveis por profissional por mês. */
  availableHoursPerMonth: number
  /** Meta de utilização: horas faturáveis ÷ horas disponíveis. */
  utilizationRate: number
  /** Taxa de realização: faturado ÷ trabalhado (desconta cortesias/descontos). */
  realizationRate: number
  /** Carga tributária efetiva sobre a receita bruta (ISS+PIS+COFINS+IRPJ+CSLL). */
  taxBurdenPercent: number
  /** Provisão para cancelamentos/glosas/inadimplência, em % da receita. */
  writeOffPercent: number
  /** Comissão sobre honorários de êxito repassada ao responsável pelo caso. */
  successCommissionPercent: number
}

export interface RoleAllocation {
  id: string
  role: LawyerRole
  hours: number
  /** Se veio de um funcionário salvo: nome (só exibição) e o custo mensal dele, que sobrepõe o custo padrão do cargo nas premissas. */
  employeeName?: string | null
  monthlyCostOverride?: number | null
}

export interface DirectCostItem {
  id: string
  name: string
  cost: number
}

// ---------------------------------------------------------------------------
// Resultado comum a qualquer modelo de honorário
// ---------------------------------------------------------------------------

export interface FeeCostBreakdown {
  laborCost: number
  directCost: number
  fixedCostAllocation: number
  totalCost: number
}

export interface FeeResult {
  costBreakdown: FeeCostBreakdown
  /** Preço que cobre custo + margem + tributos + provisão de inadimplência. */
  price: number | null
  isValid: boolean
  warning: string | null
}

// ---------------------------------------------------------------------------
// 1. Honorário por hora
// ---------------------------------------------------------------------------

export interface HourlyFeeInput {
  roles: RoleAllocation[]
  directCosts: DirectCostItem[]
  fixedCostAllocation: number
  marginPercent: number
}

export interface HourlyFeeResult extends FeeResult {
  totalHours: number
  effectiveHourlyRate: number | null
}

// ---------------------------------------------------------------------------
// 2. Honorário fixo/recorrente (mensalidade / iguala)
// ---------------------------------------------------------------------------

export interface RecurringFeeInput {
  roles: RoleAllocation[]
  monthlyDirectCosts: DirectCostItem[]
  fixedCostAllocation: number
  marginPercent: number
}

export type RecurringFeeResult = FeeResult

// ---------------------------------------------------------------------------
// 3. Honorário de êxito (success fee)
// ---------------------------------------------------------------------------

export interface SuccessFeeInput {
  /** Valor da causa / proveito econômico estimado, em R$. */
  caseValue: number
  /** Probabilidade estimada de êxito (0-100). */
  successProbabilityPercent: number
  roles: RoleAllocation[]
  directCosts: DirectCostItem[]
  fixedCostAllocation: number
  marginPercent: number
}

export interface SuccessFeeResult extends FeeResult {
  /** % sugerido sobre o valor da causa, cobrado somente se o caso for ganho. */
  suggestedFeePercent: number | null
  /** Valor a receber se o caso for ganho (price já é isso, mas fica explícito). */
  amountIfWon: number | null
  /** Valor esperado (amountIfWon × probabilidade) — para comparar com o custo. */
  expectedValue: number | null
}

// ---------------------------------------------------------------------------
// 4. Honorário contratual avulso (serviço pontual)
// ---------------------------------------------------------------------------

export interface AdhocFeeInput {
  serviceName: string
  roles: RoleAllocation[]
  directCosts: DirectCostItem[]
  fixedCostAllocation: number
  marginPercent: number
}

export type AdhocFeeResult = FeeResult

// ---------------------------------------------------------------------------
// Input combinado (um por modelo, para a UI trocar de aba sem perder dados)
// ---------------------------------------------------------------------------

export interface LegalPricingInput {
  /** Nome do processo/caso — equivalente ao "nome da peça" do Precifica3D. */
  caseName: string
  selectedModel: LegalFeeModel
  assumptions: PracticeAssumptions
  hourly: HourlyFeeInput
  recurring: RecurringFeeInput
  success: SuccessFeeInput
  adhoc: AdhocFeeInput
}
