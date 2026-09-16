import { describe, expect, it } from 'vitest'
import {
  calculateAdhocFee,
  calculateHourlyFee,
  calculateRecurringFee,
  calculateSelectedModels,
  calculateSuccessFee,
  createDefaultLegalPricingInput,
  createDefaultPracticeAssumptions,
  hourlyCostForRole,
  round2,
} from './calculate'
import type {
  CaseCostInputs,
  DirectCostItem,
  LegalPricingInput,
  PracticeAssumptions,
  RoleAllocation,
} from '../../types/legalPricing'

function role(
  id: string,
  roleName: RoleAllocation['role'],
  hours: number,
  monthlyCostOverride?: number,
): RoleAllocation {
  return { id, role: roleName, hours, monthlyCostOverride }
}

function directCost(id: string, name: string, cost: number): DirectCostItem {
  return { id, name, cost }
}

function caseInputs(overrides: Partial<CaseCostInputs> = {}): CaseCostInputs {
  return { roles: [], directCosts: [], fixedCostAllocation: 0, marginPercent: 20, ...overrides }
}

describe('hourlyCostForRole', () => {
  const assumptions = createDefaultPracticeAssumptions()

  it('dilui o custo mensal do sócio pelas horas faturáveis (disponíveis × utilização)', () => {
    // BBCS: 176h disponíveis × 65% utilização = 114,4h faturáveis/mês
    expect(hourlyCostForRole('socio', assumptions)).toBeCloseTo(60000 / 114.4, 2)
  })

  it('reproduz os custos de hora por cargo do levantamento do BBCS', () => {
    expect(round2(hourlyCostForRole('associado_senior', assumptions))).toBeCloseTo(157.34, 1)
    expect(round2(hourlyCostForRole('associado_junior', assumptions))).toBeCloseTo(78.67, 1)
    expect(round2(hourlyCostForRole('estagiario', assumptions))).toBeCloseTo(19.23, 1)
  })

  it('usa o custo mensal de um funcionário salvo no lugar do padrão do cargo, quando informado', () => {
    const billableHours = 176 * 0.65
    expect(hourlyCostForRole('associado_senior', assumptions, 22000)).toBeCloseTo(22000 / billableHours, 2)
  })

  it('não divide por zero quando não há horas disponíveis/utilização', () => {
    const zeroed: PracticeAssumptions = { ...assumptions, utilizationRate: 0 }
    expect(hourlyCostForRole('socio', zeroed)).toBe(0)
  })
})

describe('calculateHourlyFee', () => {
  const assumptions = createDefaultPracticeAssumptions()

  it('calcula custo de mão de obra + custos diretos e aplica margem sobre o preço', () => {
    const result = calculateHourlyFee(
      caseInputs({
        roles: [role('1', 'associado_senior', 10)],
        directCosts: [directCost('1', 'Custas processuais', 200)],
        fixedCostAllocation: 50,
        marginPercent: 20,
      }),
      { ...assumptions, taxBurdenPercent: 0, writeOffPercent: 0 },
    )

    const expectedLabor = 10 * hourlyCostForRole('associado_senior', assumptions)
    expect(result.costBreakdown.laborCost).toBeCloseTo(expectedLabor, 1)
    expect(result.costBreakdown.directCost).toBe(200)
    expect(result.costBreakdown.fixedCostAllocation).toBe(50)

    const expectedCost = expectedLabor + 200 + 50
    const expectedPrice = round2(expectedCost / (1 - 0.2))
    expect(result.price).toBeCloseTo(expectedPrice, 0)
    expect(result.isValid).toBe(true)
    expect(result.totalHours).toBe(10)
    expect(result.effectiveHourlyRate).toBeCloseTo(result.price! / 10, 2)
  })

  it('soma tributos e provisão de inadimplência à margem na mesma fórmula (margem sobre o preço)', () => {
    const result = calculateHourlyFee(
      caseInputs({ directCosts: [directCost('1', 'Insumo', 100)], marginPercent: 20 }),
      { ...assumptions, taxBurdenPercent: 15, writeOffPercent: 10 },
    )
    // custo=100; preço = 100 / (1 - 0.20 - 0.15 - 0.10) = 100/0.55
    expect(result.price).toBe(round2(100 / 0.55))
  })

  it('usa o custo mensal individual de um funcionário salvo em vez do custo padrão do cargo', () => {
    const result = calculateHourlyFee(
      caseInputs({ roles: [role('1', 'associado_senior', 10, 22000)], marginPercent: 0 }),
      { ...assumptions, taxBurdenPercent: 0, writeOffPercent: 0 },
    )
    const expectedLabor = 10 * (22000 / (176 * 0.65))
    expect(result.costBreakdown.laborCost).toBeCloseTo(expectedLabor, 1)
  })

  it('marca como inválido quando margem+tributos+provisão somam 100% ou mais', () => {
    const result = calculateHourlyFee(
      caseInputs({ directCosts: [directCost('1', 'Insumo', 100)], marginPercent: 60 }),
      { ...assumptions, taxBurdenPercent: 30, writeOffPercent: 15 },
    )
    expect(result.isValid).toBe(false)
    expect(result.price).toBeNull()
    expect(result.warning).toBeTruthy()
  })
})

describe('calculateRecurringFee', () => {
  it('usa a mesma fórmula de custo+margem, para um pacote mensal de horas', () => {
    const assumptions = createDefaultPracticeAssumptions()
    const result = calculateRecurringFee(
      caseInputs({ roles: [role('1', 'associado_junior', 20)], fixedCostAllocation: 300, marginPercent: 25 }),
      { ...assumptions, taxBurdenPercent: 0, writeOffPercent: 0 },
    )
    const expectedLabor = 20 * hourlyCostForRole('associado_junior', assumptions)
    expect(result.costBreakdown.totalCost).toBeCloseTo(expectedLabor + 300, 1)
    expect(result.price).toBeCloseTo(result.costBreakdown.totalCost / 0.75, 0)
  })
})

describe('calculateAdhocFee', () => {
  it('calcula um valor fechado para um serviço pontual', () => {
    const assumptions = createDefaultPracticeAssumptions()
    const result = calculateAdhocFee(caseInputs({ roles: [role('1', 'socio', 3)], marginPercent: 30 }), {
      ...assumptions,
      taxBurdenPercent: 0,
      writeOffPercent: 0,
    })
    const expectedLabor = 3 * hourlyCostForRole('socio', assumptions)
    expect(result.price).toBeCloseTo(expectedLabor / 0.7, 0)
  })
})

describe('calculateSuccessFee', () => {
  const assumptions = createDefaultPracticeAssumptions()

  it('sugere um percentual sobre o valor da causa que cobre custo, margem, tributo e comissão de êxito, ajustado pela probabilidade', () => {
    const result = calculateSuccessFee(
      {
        ...caseInputs({ roles: [role('1', 'associado_senior', 40)], directCosts: [directCost('1', 'Custas', 500)], marginPercent: 20 }),
        caseValue: 100000,
        successProbabilityPercent: 50,
      },
      { ...assumptions, taxBurdenPercent: 10 },
    )

    expect(result.isValid).toBe(true)
    // amountIfWon = custo / (probabilidade × (1 - margem% - tributo% - comissão%))
    const expectedCost = round2(40 * hourlyCostForRole('associado_senior', assumptions) + 500)
    const denom = 0.5 * (1 - (0.2 + 0.1 + assumptions.successCommissionPercent / 100))
    const expectedAmountIfWon = round2(expectedCost / denom)
    expect(result.amountIfWon).toBeCloseTo(expectedAmountIfWon, 0)
    expect(result.suggestedFeePercent).toBeCloseTo((expectedAmountIfWon / 100000) * 100, 1)
    expect(result.expectedValue).toBeCloseTo(expectedAmountIfWon * 0.5, 0)
    // o valor esperado (ponderado pela probabilidade) deve cobrir o custo do caso
    expect(result.expectedValue!).toBeGreaterThan(expectedCost)
  })

  it('exige um percentual maior quanto menor a probabilidade de êxito, para o mesmo caso', () => {
    const base = caseInputs({ roles: [role('1', 'associado_senior', 40)], directCosts: [directCost('1', 'Custas', 500)], marginPercent: 20 })
    const highProbability = calculateSuccessFee({ ...base, caseValue: 100000, successProbabilityPercent: 80 }, assumptions)
    const lowProbability = calculateSuccessFee({ ...base, caseValue: 100000, successProbabilityPercent: 20 }, assumptions)
    expect(lowProbability.suggestedFeePercent!).toBeGreaterThan(highProbability.suggestedFeePercent!)
  })

  it('avisa quando o percentual sugerido ultrapassa 30% do valor da causa', () => {
    const result = calculateSuccessFee(
      { ...caseInputs({ roles: [role('1', 'socio', 20)], marginPercent: 20 }), caseValue: 5000, successProbabilityPercent: 50 },
      assumptions,
    )
    expect(result.suggestedFeePercent).toBeGreaterThan(30)
    expect(result.warning).toMatch(/30%/)
  })

  it('avisa quando a probabilidade de êxito é zero', () => {
    const result = calculateSuccessFee(
      { ...caseInputs({ directCosts: [directCost('1', 'x', 100)], marginPercent: 20 }), caseValue: 100000, successProbabilityPercent: 0 },
      assumptions,
    )
    expect(result.warning).toMatch(/probabilidade/)
  })
})

describe('calculateSelectedModels', () => {
  const assumptions = createDefaultPracticeAssumptions()

  it('calcula somente as formas selecionadas, deixando as demais nulas', () => {
    const input: LegalPricingInput = {
      ...createDefaultLegalPricingInput(),
      assumptions,
      selectedModels: ['hourly'],
      costsByModel: {
        ...createDefaultLegalPricingInput().costsByModel,
        hourly: { roles: [role('1', 'socio', 10)], directCosts: [], fixedCostAllocation: 0 },
      },
    }
    const result = calculateSelectedModels(input)
    expect(result.hourly).not.toBeNull()
    expect(result.recurring).toBeNull()
    expect(result.success).toBeNull()
    expect(result.adhoc).toBeNull()
  })

  it('soma o preço fixo de uma forma com o valor esperado do componente de êxito na receita total estimada', () => {
    const input: LegalPricingInput = {
      ...createDefaultLegalPricingInput(),
      assumptions,
      selectedModels: ['hourly', 'success'],
      costsByModel: {
        ...createDefaultLegalPricingInput().costsByModel,
        hourly: { roles: [role('1', 'associado_senior', 10)], directCosts: [], fixedCostAllocation: 0 },
      },
      caseValue: 100000,
      successProbabilityPercent: 50,
    }
    const result = calculateSelectedModels(input)
    expect(result.hourly).not.toBeNull()
    expect(result.success).not.toBeNull()
    expect(result.hourly!.price).not.toBeNull()
    expect(result.success!.expectedValue).not.toBeNull()
    expect(result.estimatedTotalRevenue).toBeCloseTo(result.hourly!.price! + result.success!.expectedValue!, 0)
  })

  it('retorna receita total nula quando nenhuma forma selecionada é válida', () => {
    const input: LegalPricingInput = {
      ...createDefaultLegalPricingInput(),
      assumptions,
      selectedModels: ['success'],
      caseValue: 100000,
      successProbabilityPercent: 0,
    }
    const result = calculateSelectedModels(input)
    expect(result.success!.isValid).toBe(false)
    expect(result.estimatedTotalRevenue).toBeNull()
  })

  it('não soma o mesmo custo duas vezes quando duas formas são combinadas — cada uma usa só o custo atribuído a ela', () => {
    // Mesmas 10h de associado sênior, mas atribuídas SÓ à forma "por hora";
    // a forma "êxito" não tem nenhum custo atribuído a ela neste caso.
    const laborCost10h = 10 * hourlyCostForRole('associado_senior', assumptions)
    const input: LegalPricingInput = {
      ...createDefaultLegalPricingInput(),
      assumptions,
      selectedModels: ['hourly', 'success'],
      costsByModel: {
        ...createDefaultLegalPricingInput().costsByModel,
        hourly: { roles: [role('1', 'associado_senior', 10)], directCosts: [], fixedCostAllocation: 0 },
        success: { roles: [], directCosts: [], fixedCostAllocation: 0 },
      },
      caseValue: 100000,
      successProbabilityPercent: 50,
    }
    const result = calculateSelectedModels(input)
    // O custo da forma "por hora" reflete só as 10h atribuídas a ela...
    expect(result.hourly!.costBreakdown.laborCost).toBeCloseTo(laborCost10h, 1)
    // ...e a forma "êxito", sem nenhum custo atribuído a ela, não deveria cobrar nada por êxito
    // (se o custo de "por hora" vazasse para cá, isso não seria zero).
    expect(result.success!.costBreakdown.totalCost).toBe(0)
    expect(result.success!.amountIfWon).toBe(0)
  })

  it('duas formas com custos atribuídos separadamente somam os dois custos, não um custo duplicado', () => {
    const hourlyLabor = 10 * hourlyCostForRole('associado_senior', assumptions)
    const successLabor = 5 * hourlyCostForRole('socio', assumptions)
    const input: LegalPricingInput = {
      ...createDefaultLegalPricingInput(),
      assumptions,
      selectedModels: ['hourly', 'success'],
      marginPercent: 0,
      costsByModel: {
        ...createDefaultLegalPricingInput().costsByModel,
        hourly: { roles: [role('1', 'associado_senior', 10)], directCosts: [], fixedCostAllocation: 0 },
        success: { roles: [role('1', 'socio', 5)], directCosts: [], fixedCostAllocation: 0 },
      },
      caseValue: 1000000,
      successProbabilityPercent: 100,
    }
    const result = calculateSelectedModels({ ...input, assumptions: { ...assumptions, taxBurdenPercent: 0, writeOffPercent: 0, successCommissionPercent: 0 } })
    expect(result.hourly!.costBreakdown.laborCost).toBeCloseTo(hourlyLabor, 1)
    expect(result.success!.costBreakdown.laborCost).toBeCloseTo(successLabor, 1)
    // Cada forma recupera só o próprio custo (100% de probabilidade e 0% de
    // margem/tributos/comissão fazem o preço de êxito bater exatamente o
    // custo daquela forma) — a soma não duplica nenhum dos dois.
    expect(result.estimatedTotalRevenue).toBeCloseTo(hourlyLabor + successLabor, 0)
  })
})
