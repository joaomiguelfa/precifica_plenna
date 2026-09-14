import { describe, expect, it } from 'vitest'
import {
  calculateAdhocFee,
  calculateHourlyFee,
  calculateRecurringFee,
  calculateSuccessFee,
  createDefaultPracticeAssumptions,
  hourlyCostForRole,
  round2,
} from './calculate'
import type { DirectCostItem, PracticeAssumptions, RoleAllocation } from '../../types/legalPricing'

function role(id: string, roleName: RoleAllocation['role'], hours: number): RoleAllocation {
  return { id, role: roleName, hours }
}

function directCost(id: string, name: string, cost: number): DirectCostItem {
  return { id, name, cost }
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

  it('não divide por zero quando não há horas disponíveis/utilização', () => {
    const zeroed: PracticeAssumptions = { ...assumptions, utilizationRate: 0 }
    expect(hourlyCostForRole('socio', zeroed)).toBe(0)
  })
})

describe('calculateHourlyFee', () => {
  const assumptions = createDefaultPracticeAssumptions()

  it('calcula custo de mão de obra + custos diretos e aplica margem sobre o preço', () => {
    const result = calculateHourlyFee(
      {
        roles: [role('1', 'associado_senior', 10)],
        directCosts: [directCost('1', 'Custas processuais', 200)],
        fixedCostAllocation: 50,
        marginPercent: 20,
      },
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
      {
        roles: [],
        directCosts: [directCost('1', 'Insumo', 100)],
        fixedCostAllocation: 0,
        marginPercent: 20,
      },
      { ...assumptions, taxBurdenPercent: 15, writeOffPercent: 10 },
    )
    // custo=100; preço = 100 / (1 - 0.20 - 0.15 - 0.10) = 100/0.55
    expect(result.price).toBe(round2(100 / 0.55))
  })

  it('marca como inválido quando margem+tributos+provisão somam 100% ou mais', () => {
    const result = calculateHourlyFee(
      {
        roles: [],
        directCosts: [directCost('1', 'Insumo', 100)],
        fixedCostAllocation: 0,
        marginPercent: 60,
      },
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
      {
        roles: [role('1', 'associado_junior', 20)],
        monthlyDirectCosts: [],
        fixedCostAllocation: 300,
        marginPercent: 25,
      },
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
    const result = calculateAdhocFee(
      {
        serviceName: 'Parecer jurídico',
        roles: [role('1', 'socio', 3)],
        directCosts: [],
        fixedCostAllocation: 0,
        marginPercent: 30,
      },
      { ...assumptions, taxBurdenPercent: 0, writeOffPercent: 0 },
    )
    const expectedLabor = 3 * hourlyCostForRole('socio', assumptions)
    expect(result.price).toBeCloseTo(expectedLabor / 0.7, 0)
  })
})

describe('calculateSuccessFee', () => {
  const assumptions = createDefaultPracticeAssumptions()

  it('sugere um percentual sobre o valor da causa que cobre custo, margem, tributo e comissão de êxito, ajustado pela probabilidade', () => {
    const result = calculateSuccessFee(
      {
        caseValue: 100000,
        successProbabilityPercent: 50,
        roles: [role('1', 'associado_senior', 40)],
        directCosts: [directCost('1', 'Custas', 500)],
        fixedCostAllocation: 0,
        marginPercent: 20,
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
    const caseInput = {
      caseValue: 100000,
      roles: [role('1', 'associado_senior', 40)],
      directCosts: [directCost('1', 'Custas', 500)],
      fixedCostAllocation: 0,
      marginPercent: 20,
    }
    const highProbability = calculateSuccessFee({ ...caseInput, successProbabilityPercent: 80 }, assumptions)
    const lowProbability = calculateSuccessFee({ ...caseInput, successProbabilityPercent: 20 }, assumptions)
    expect(lowProbability.suggestedFeePercent!).toBeGreaterThan(highProbability.suggestedFeePercent!)
  })

  it('avisa quando o percentual sugerido ultrapassa 30% do valor da causa', () => {
    const result = calculateSuccessFee(
      {
        caseValue: 5000,
        successProbabilityPercent: 50,
        roles: [role('1', 'socio', 20)],
        directCosts: [],
        fixedCostAllocation: 0,
        marginPercent: 20,
      },
      assumptions,
    )
    expect(result.suggestedFeePercent).toBeGreaterThan(30)
    expect(result.warning).toMatch(/30%/)
  })

  it('avisa quando a probabilidade de êxito é zero', () => {
    const result = calculateSuccessFee(
      {
        caseValue: 100000,
        successProbabilityPercent: 0,
        roles: [],
        directCosts: [directCost('1', 'x', 100)],
        fixedCostAllocation: 0,
        marginPercent: 20,
      },
      assumptions,
    )
    expect(result.warning).toMatch(/probabilidade/)
  })
})
