import type {
  AdhocFeeInput,
  AdhocFeeResult,
  DirectCostItem,
  FeeCostBreakdown,
  HourlyFeeInput,
  HourlyFeeResult,
  LawyerRole,
  LegalPricingInput,
  PracticeAssumptions,
  RecurringFeeInput,
  RecurringFeeResult,
  RoleAllocation,
  SuccessFeeInput,
  SuccessFeeResult,
} from '../../types/legalPricing'

export function round2(value: number): number {
  if (!Number.isFinite(value)) return value
  return Math.round((value + Number.EPSILON) * 100) / 100
}

/**
 * Custo de uma hora técnica de um cargo, já considerando a ociosidade: o
 * custo mensal do profissional é diluído pelas horas efetivamente
 * faturáveis (disponíveis × meta de utilização), não pelas horas totais —
 * é assim que o BBCS calcula o "custo direto por hora faturável".
 */
export function hourlyCostForRole(role: LawyerRole, assumptions: PracticeAssumptions): number {
  const billableHours = assumptions.availableHoursPerMonth * (assumptions.utilizationRate / 100)
  if (billableHours <= 0) return 0
  return assumptions.monthlyCostByRole[role] / billableHours
}

function laborCost(roles: RoleAllocation[], assumptions: PracticeAssumptions): number {
  return roles.reduce((sum, r) => sum + r.hours * hourlyCostForRole(r.role, assumptions), 0)
}

function directCostTotal(items: DirectCostItem[]): number {
  return items.reduce((sum, i) => sum + i.cost, 0)
}

function buildCostBreakdown(labor: number, direct: number, fixedAllocation: number): FeeCostBreakdown {
  return {
    laborCost: round2(labor),
    directCost: round2(direct),
    fixedCostAllocation: round2(fixedAllocation),
    totalCost: round2(labor + direct + fixedAllocation),
  }
}

/**
 * Núcleo comum a honorário por hora, fixo/recorrente e avulso: preço que
 * cobre custo + margem + carga tributária + provisão de inadimplência,
 * todos incidindo sobre o PREÇO final (mesma lógica de "margem sobre a
 * venda" da calculadora de peças 3D — não markup simples sobre o custo).
 */
function priceFromCostAndRates(
  totalCost: number,
  marginPercent: number,
  taxBurdenPercent: number,
  writeOffPercent: number,
  extraPercent = 0,
): { price: number | null; isValid: boolean; warning: string | null } {
  const totalPercent = marginPercent + taxBurdenPercent + writeOffPercent + extraPercent
  const denominator = 1 - totalPercent / 100
  if (denominator <= 0) {
    return {
      price: null,
      isValid: false,
      warning:
        'A soma da margem, tributos, provisão de inadimplência (e comissão, se houver) atinge ou ultrapassa 100% do preço — não existe preço capaz de cobrir isso. Reduza algum desses percentuais.',
    }
  }
  return { price: round2(totalCost / denominator), isValid: true, warning: null }
}

// ---------------------------------------------------------------------------
// 1. Honorário por hora
// ---------------------------------------------------------------------------

export function calculateHourlyFee(input: HourlyFeeInput, assumptions: PracticeAssumptions): HourlyFeeResult {
  const totalHours = input.roles.reduce((sum, r) => sum + r.hours, 0)
  const labor = laborCost(input.roles, assumptions)
  const direct = directCostTotal(input.directCosts)
  const costBreakdown = buildCostBreakdown(labor, direct, input.fixedCostAllocation)

  const { price, isValid, warning } = priceFromCostAndRates(
    costBreakdown.totalCost,
    input.marginPercent,
    assumptions.taxBurdenPercent,
    assumptions.writeOffPercent,
  )

  return {
    costBreakdown,
    price,
    isValid,
    warning,
    totalHours: round2(totalHours),
    effectiveHourlyRate: price != null && totalHours > 0 ? round2(price / totalHours) : null,
  }
}

// ---------------------------------------------------------------------------
// 2. Honorário fixo/recorrente
// ---------------------------------------------------------------------------

export function calculateRecurringFee(input: RecurringFeeInput, assumptions: PracticeAssumptions): RecurringFeeResult {
  const labor = laborCost(input.roles, assumptions)
  const direct = directCostTotal(input.monthlyDirectCosts)
  const costBreakdown = buildCostBreakdown(labor, direct, input.fixedCostAllocation)

  const { price, isValid, warning } = priceFromCostAndRates(
    costBreakdown.totalCost,
    input.marginPercent,
    assumptions.taxBurdenPercent,
    assumptions.writeOffPercent,
  )

  return { costBreakdown, price, isValid, warning }
}

// ---------------------------------------------------------------------------
// 3. Honorário de êxito
// ---------------------------------------------------------------------------

export function calculateSuccessFee(input: SuccessFeeInput, assumptions: PracticeAssumptions): SuccessFeeResult {
  const labor = laborCost(input.roles, assumptions)
  const direct = directCostTotal(input.directCosts)
  const costBreakdown = buildCostBreakdown(labor, direct, input.fixedCostAllocation)

  // O honorário só é recebido se o caso for ganho, então a comissão sobre
  // êxito (repassada quando há recebimento) também precisa ser coberta pelo
  // valor recebido na vitória — por isso entra como percentual extra aqui,
  // mas ela é uma condicional que só se realiza se o caso for ganho, então
  // é o valor recebido nessa hipótese que a inclui.
  const { price, isValid, warning } = priceFromCostAndRates(
    costBreakdown.totalCost,
    input.marginPercent,
    assumptions.taxBurdenPercent,
    0,
    assumptions.successCommissionPercent,
  )

  const amountIfWon = price
  const probability = input.successProbabilityPercent / 100
  const expectedValue = amountIfWon != null ? round2(amountIfWon * probability) : null
  const suggestedFeePercent =
    amountIfWon != null && input.caseValue > 0 ? round2((amountIfWon / input.caseValue) * 100) : null

  let combinedWarning = warning
  if (!combinedWarning && suggestedFeePercent != null && suggestedFeePercent > 30) {
    combinedWarning =
      'O percentual de êxito sugerido está acima de 30% do valor da causa — vale revisar se o valor da causa está correto ou se o caso comporta esse risco.'
  }
  if (!combinedWarning && input.successProbabilityPercent <= 0) {
    combinedWarning = 'Informe uma probabilidade de êxito maior que zero para calcular o percentual sugerido.'
  }

  return {
    costBreakdown,
    price,
    isValid,
    warning: combinedWarning,
    suggestedFeePercent,
    amountIfWon,
    expectedValue,
  }
}

// ---------------------------------------------------------------------------
// 4. Honorário contratual avulso
// ---------------------------------------------------------------------------

export function calculateAdhocFee(input: AdhocFeeInput, assumptions: PracticeAssumptions): AdhocFeeResult {
  const labor = laborCost(input.roles, assumptions)
  const direct = directCostTotal(input.directCosts)
  const costBreakdown = buildCostBreakdown(labor, direct, input.fixedCostAllocation)

  const { price, isValid, warning } = priceFromCostAndRates(
    costBreakdown.totalCost,
    input.marginPercent,
    assumptions.taxBurdenPercent,
    assumptions.writeOffPercent,
  )

  return { costBreakdown, price, isValid, warning }
}

// ---------------------------------------------------------------------------
// Premissas e input padrão — valores reais de referência do BBCS
// ---------------------------------------------------------------------------

export function createDefaultPracticeAssumptions(): PracticeAssumptions {
  return {
    monthlyCostByRole: {
      socio: 60000,
      associado_senior: 18000,
      associado_junior: 9000,
      estagiario: 2200,
      paralegal: 6500,
    },
    availableHoursPerMonth: 176,
    utilizationRate: 65,
    realizationRate: 90,
    taxBurdenPercent: 15.5,
    writeOffPercent: 10,
    successCommissionPercent: 12,
  }
}

export function createDefaultLegalPricingInput(): LegalPricingInput {
  return {
    selectedModel: 'hourly',
    assumptions: createDefaultPracticeAssumptions(),
    hourly: {
      roles: [],
      directCosts: [],
      fixedCostAllocation: 0,
      marginPercent: 20,
    },
    recurring: {
      roles: [],
      monthlyDirectCosts: [],
      fixedCostAllocation: 0,
      marginPercent: 20,
    },
    success: {
      caseValue: 0,
      successProbabilityPercent: 50,
      roles: [],
      directCosts: [],
      fixedCostAllocation: 0,
      marginPercent: 20,
    },
    adhoc: {
      serviceName: '',
      roles: [],
      directCosts: [],
      fixedCostAllocation: 0,
      marginPercent: 20,
    },
  }
}
