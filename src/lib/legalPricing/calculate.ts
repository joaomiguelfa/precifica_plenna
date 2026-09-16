import type {
  AdhocFeeResult,
  CaseCostInputs,
  CombinedLegalResult,
  DirectCostItem,
  FeeCostBreakdown,
  HourlyFeeResult,
  LawyerRole,
  LegalFeeModel,
  LegalPricingInput,
  ModelCostAllocation,
  PracticeAssumptions,
  RecurringFeeResult,
  RoleAllocation,
  SuccessFeeExtra,
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
export function hourlyCostForRole(
  role: LawyerRole,
  assumptions: PracticeAssumptions,
  monthlyCostOverride?: number | null,
): number {
  const billableHours = assumptions.availableHoursPerMonth * (assumptions.utilizationRate / 100)
  if (billableHours <= 0) return 0
  const monthlyCost = monthlyCostOverride ?? assumptions.monthlyCostByRole[role]
  return monthlyCost / billableHours
}

function laborCost(roles: RoleAllocation[], assumptions: PracticeAssumptions): number {
  return roles.reduce((sum, r) => sum + r.hours * hourlyCostForRole(r.role, assumptions, r.monthlyCostOverride), 0)
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

function costBreakdownFor(inputs: CaseCostInputs, assumptions: PracticeAssumptions): FeeCostBreakdown {
  return buildCostBreakdown(
    laborCost(inputs.roles, assumptions),
    directCostTotal(inputs.directCosts),
    inputs.fixedCostAllocation,
  )
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

export function calculateHourlyFee(inputs: CaseCostInputs, assumptions: PracticeAssumptions): HourlyFeeResult {
  const totalHours = inputs.roles.reduce((sum, r) => sum + r.hours, 0)
  const costBreakdown = costBreakdownFor(inputs, assumptions)

  const { price, isValid, warning } = priceFromCostAndRates(
    costBreakdown.totalCost,
    inputs.marginPercent,
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

export function calculateRecurringFee(inputs: CaseCostInputs, assumptions: PracticeAssumptions): RecurringFeeResult {
  const costBreakdown = costBreakdownFor(inputs, assumptions)
  const { price, isValid, warning } = priceFromCostAndRates(
    costBreakdown.totalCost,
    inputs.marginPercent,
    assumptions.taxBurdenPercent,
    assumptions.writeOffPercent,
  )
  return { costBreakdown, price, isValid, warning }
}

// ---------------------------------------------------------------------------
// 3. Honorário de êxito
// ---------------------------------------------------------------------------

export function calculateSuccessFee(
  inputs: CaseCostInputs & SuccessFeeExtra,
  assumptions: PracticeAssumptions,
): SuccessFeeResult {
  const costBreakdown = costBreakdownFor(inputs, assumptions)
  const probability = inputs.successProbabilityPercent / 100

  if (probability <= 0) {
    return {
      costBreakdown,
      price: null,
      isValid: false,
      warning: 'Informe uma probabilidade de êxito maior que zero para calcular o percentual sugerido.',
      suggestedFeePercent: null,
      amountIfWon: null,
      expectedValue: null,
    }
  }

  // O honorário só é recebido se o caso for ganho: nos casos perdidos (que
  // acontecem "1 - probabilidade" das vezes, em uma carteira de casos
  // parecidos) o custo investido não é recuperado. Por isso o valor cobrado
  // quando se ganha precisa ser dividido tanto pela probabilidade de êxito
  // quanto pelo que sobra depois de margem, tributo e comissão — cobrindo,
  // em valor esperado, o custo de todos os casos (ganhos e perdidos).
  const totalPercent = inputs.marginPercent + assumptions.taxBurdenPercent + assumptions.successCommissionPercent
  const denominator = probability * (1 - totalPercent / 100)

  if (denominator <= 0) {
    return {
      costBreakdown,
      price: null,
      isValid: false,
      warning:
        'A combinação de probabilidade de êxito, margem, tributos e comissão não permite calcular um percentual válido — reduza a margem/comissão ou revise a probabilidade.',
      suggestedFeePercent: null,
      amountIfWon: null,
      expectedValue: null,
    }
  }

  const amountIfWon = round2(costBreakdown.totalCost / denominator)
  const expectedValue = round2(amountIfWon * probability)
  const suggestedFeePercent = inputs.caseValue > 0 ? round2((amountIfWon / inputs.caseValue) * 100) : null

  let warning: string | null = null
  if (suggestedFeePercent != null && suggestedFeePercent > 30) {
    warning =
      'O percentual de êxito sugerido está acima de 30% do valor da causa — vale revisar se o valor da causa está correto ou se o caso comporta esse risco.'
  }

  return {
    costBreakdown,
    price: amountIfWon,
    isValid: true,
    warning,
    suggestedFeePercent,
    amountIfWon,
    expectedValue,
  }
}

// ---------------------------------------------------------------------------
// 4. Honorário contratual avulso
// ---------------------------------------------------------------------------

export function calculateAdhocFee(inputs: CaseCostInputs, assumptions: PracticeAssumptions): AdhocFeeResult {
  const costBreakdown = costBreakdownFor(inputs, assumptions)
  const { price, isValid, warning } = priceFromCostAndRates(
    costBreakdown.totalCost,
    inputs.marginPercent,
    assumptions.taxBurdenPercent,
    assumptions.writeOffPercent,
  )
  return { costBreakdown, price, isValid, warning }
}

// ---------------------------------------------------------------------------
// Combinação: um caso pode usar mais de uma forma de honorário ao mesmo
// tempo (ex.: parte por hora + parte de êxito) — cada forma usa APENAS os
// custos atribuídos a ela em `costsByModel`, nunca o custo do caso inteiro,
// para não recuperar o mesmo custo mais de uma vez ao somar os honorários.
// ---------------------------------------------------------------------------

function costInputsFor(model: LegalFeeModel, input: LegalPricingInput): CaseCostInputs {
  const c = input.costsByModel[model]
  return {
    roles: c.roles,
    directCosts: c.directCosts,
    fixedCostAllocation: c.fixedCostAllocation,
    marginPercent: input.marginPercent,
  }
}

export function calculateSelectedModels(input: LegalPricingInput): CombinedLegalResult {
  const hourly = input.selectedModels.includes('hourly')
    ? calculateHourlyFee(costInputsFor('hourly', input), input.assumptions)
    : null
  const recurring = input.selectedModels.includes('recurring')
    ? calculateRecurringFee(costInputsFor('recurring', input), input.assumptions)
    : null
  const adhoc = input.selectedModels.includes('adhoc')
    ? calculateAdhocFee(costInputsFor('adhoc', input), input.assumptions)
    : null
  const success = input.selectedModels.includes('success')
    ? calculateSuccessFee(
        {
          ...costInputsFor('success', input),
          caseValue: input.caseValue,
          successProbabilityPercent: input.successProbabilityPercent,
        },
        input.assumptions,
      )
    : null

  let total = 0
  let hasAny = false
  for (const flat of [hourly, recurring, adhoc]) {
    if (flat && flat.isValid && flat.price != null) {
      total += flat.price
      hasAny = true
    }
  }
  if (success && success.isValid && success.expectedValue != null) {
    total += success.expectedValue
    hasAny = true
  }

  return { hourly, recurring, success, adhoc, estimatedTotalRevenue: hasAny ? round2(total) : null }
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

export function createEmptyModelCostAllocation(): ModelCostAllocation {
  return { roles: [], directCosts: [], fixedCostAllocation: 0 }
}

export function createDefaultLegalPricingInput(): LegalPricingInput {
  return {
    caseName: '',
    selectedModels: ['hourly'],
    assumptions: createDefaultPracticeAssumptions(),
    costsByModel: {
      hourly: createEmptyModelCostAllocation(),
      recurring: createEmptyModelCostAllocation(),
      success: createEmptyModelCostAllocation(),
      adhoc: createEmptyModelCostAllocation(),
    },
    marginPercent: 20,
    caseValue: 0,
    successProbabilityPercent: 50,
    serviceName: '',
  }
}
