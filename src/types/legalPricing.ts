/**
 * Precificação de honorários para escritórios de advocacia (ex.: BBCS
 * Advocacia). Modelo baseado nos dados reais de premissas/DRE do escritório:
 * mix de receita em 4 linhas de honorário, custo de hora técnica por cargo,
 * carga tributária efetiva, comissão sobre êxito e provisão para
 * cancelamentos/glosas.
 *
 * Um caso pode combinar mais de uma forma de honorário ao mesmo tempo (ex.:
 * parte por hora + parte de êxito). Profissionais/horas, custos diretos e
 * rateio de custos fixos são informados em separado PARA CADA forma
 * selecionada — não compartilhados entre elas — para que o custo do caso
 * não seja "recuperado" mais de uma vez ao somar os honorários de formas
 * diferentes. Só a margem e as premissas do escritório são compartilhadas,
 * já que são percentuais/taxas, não um valor de custo que se acumula.
 */

export type LegalFeeModel = 'hourly' | 'recurring' | 'success' | 'adhoc'

export const LEGAL_FEE_MODEL_LABELS: Record<LegalFeeModel, string> = {
  hourly: 'Por hora',
  recurring: 'Fixo/recorrente',
  success: 'Êxito',
  adhoc: 'Contratual avulso',
}

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
// Dados de custo — um conjunto próprio por forma de honorário selecionada
// ---------------------------------------------------------------------------

export interface CaseCostInputs {
  roles: RoleAllocation[]
  directCosts: DirectCostItem[]
  fixedCostAllocation: number
  marginPercent: number
}

/** Profissionais/horas, custos diretos e rateio de custos fixos atribuídos a uma única forma de honorário do caso. */
export interface ModelCostAllocation {
  roles: RoleAllocation[]
  directCosts: DirectCostItem[]
  fixedCostAllocation: number
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

export interface HourlyFeeResult extends FeeResult {
  totalHours: number
  effectiveHourlyRate: number | null
}

// ---------------------------------------------------------------------------
// 2. Honorário fixo/recorrente (mensalidade / iguala)
// ---------------------------------------------------------------------------

export type RecurringFeeResult = FeeResult

// ---------------------------------------------------------------------------
// 3. Honorário de êxito (success fee)
// ---------------------------------------------------------------------------

export interface SuccessFeeExtra {
  /** Valor da causa / proveito econômico estimado, em R$. */
  caseValue: number
  /** Probabilidade estimada de êxito (0-100). */
  successProbabilityPercent: number
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

export type AdhocFeeResult = FeeResult

// ---------------------------------------------------------------------------
// Input e resultado combinados do caso (as 4 formas podem ser usadas juntas)
// ---------------------------------------------------------------------------

export interface LegalPricingInput {
  /** Nome do processo/caso — equivalente ao "nome da peça" do Precifica3D. */
  caseName: string
  /** Formas de honorário aplicadas a este caso — pode ser mais de uma. */
  selectedModels: LegalFeeModel[]
  assumptions: PracticeAssumptions
  /** Custos (profissionais/horas, diretos, rateio) de cada forma de honorário — um conjunto por forma, nunca somados em dobro. */
  costsByModel: Record<LegalFeeModel, ModelCostAllocation>
  marginPercent: number
  /** Usado somente quando "Êxito" está selecionado. */
  caseValue: number
  successProbabilityPercent: number
  /** Usado somente quando "Contratual avulso" está selecionado. */
  serviceName: string
}

export interface CombinedLegalResult {
  hourly: HourlyFeeResult | null
  recurring: RecurringFeeResult | null
  success: SuccessFeeResult | null
  adhoc: AdhocFeeResult | null
  /**
   * Soma do preço fixo de cada forma selecionada (hora/recorrente/avulso) com
   * o valor esperado (ponderado pela probabilidade) do componente de êxito,
   * quando aplicável — uma estimativa única de receita do caso como um todo,
   * sem tratar o componente de êxito como se fosse garantido.
   */
  estimatedTotalRevenue: number | null
}
