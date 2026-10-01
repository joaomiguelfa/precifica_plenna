import { describe, expect, it } from 'vitest'
import { calculateResalePricing, createDefaultResalePricingInput, round2 } from './calculate'
import type { DirectCostItem, PlatformFeeItem, ResalePricingInput } from '../../types/resale'

function fee(id: string, name: string, percent: number): PlatformFeeItem {
  return { id, name, percent }
}

function cost(id: string, name: string, value: number): DirectCostItem {
  return { id, name, cost: value }
}

function input(overrides: Partial<ResalePricingInput> = {}): ResalePricingInput {
  return { ...createDefaultResalePricingInput(), ...overrides }
}

describe('calculateResalePricing — margem em % (marginMode: percent)', () => {
  it('critério de aceite do app: custo=R$20, margem=40%, plataforma=12%, cartão=4% → preço R$45,45 (não R$28 de markup ingênuo)', () => {
    const result = calculateResalePricing(
      input({
        purchaseCost: 20,
        platformFees: [fee('1', 'Plataforma', 12), fee('2', 'Cartão', 4)],
        taxPercent: 0,
        marginMode: 'percent',
        marginPercent: 40,
      }),
    )
    expect(result.finalPrice).toBe(45.45)
    expect(result.isValid).toBe(true)
  })

  it('soma CMV + custos diretos como base do custo total', () => {
    const result = calculateResalePricing(
      input({
        purchaseCost: 50,
        directCosts: [cost('1', 'Embalagem', 5), cost('2', 'Frete de compra', 3)],
        marginMode: 'percent',
        marginPercent: 0,
        taxPercent: 0,
        platformFees: [],
      }),
    )
    expect(result.costBreakdown.totalCost).toBe(58)
    expect(result.finalPrice).toBe(58)
  })

  it('a margem efetiva (R$ e %) bate com o que foi pedido quando marginMode é percent', () => {
    const result = calculateResalePricing(
      input({ purchaseCost: 100, marginMode: 'percent', marginPercent: 25, taxPercent: 0, platformFees: [] }),
    )
    expect(result.effectiveMarginPercent).toBeCloseTo(25, 1)
    expect(result.profitAmount).toBeCloseTo(result.finalPrice! * 0.25, 1)
  })

  it('marca como inválido quando taxas+imposto+margem somam 100% ou mais', () => {
    const result = calculateResalePricing(
      input({
        purchaseCost: 10,
        platformFees: [fee('1', 'Plataforma', 50)],
        taxPercent: 20,
        marginMode: 'percent',
        marginPercent: 30,
      }),
    )
    expect(result.isValid).toBe(false)
    expect(result.finalPrice).toBeNull()
    expect(result.warnings.some((w) => w.includes('100%'))).toBe(true)
  })
})

describe('calculateResalePricing — margem em R$ (marginMode: value)', () => {
  it('lucro desejado de R$20/unidade é recuperado integralmente, mesmo com taxas sobre o preço final', () => {
    const result = calculateResalePricing(
      input({
        purchaseCost: 80,
        platformFees: [fee('1', 'Comissão Mercado Livre', 16)],
        taxPercent: 6,
        marginMode: 'value',
        marginValue: 20,
      }),
    )
    expect(result.isValid).toBe(true)
    // lucro efetivo deve bater com os R$20 pedidos (dentro da margem de arredondamento)
    expect(result.profitAmount).toBeCloseTo(20, 1)
  })

  it('preço sobe conforme o lucro desejado em R$ sobe, mantendo custo e taxas fixos', () => {
    const base = { purchaseCost: 40, platformFees: [fee('1', 'Plataforma', 14)], taxPercent: 6, marginMode: 'value' as const }
    const low = calculateResalePricing(input({ ...base, marginValue: 10 }))
    const high = calculateResalePricing(input({ ...base, marginValue: 30 }))
    expect(high.finalPrice!).toBeGreaterThan(low.finalPrice!)
  })

  it('marca como inválido quando as taxas+imposto sozinhas já somam 100% ou mais', () => {
    const result = calculateResalePricing(
      input({
        purchaseCost: 10,
        platformFees: [fee('1', 'Plataforma', 70)],
        taxPercent: 35,
        marginMode: 'value',
        marginValue: 5,
      }),
    )
    expect(result.isValid).toBe(false)
    expect(result.finalPrice).toBeNull()
  })
})

describe('calculateResalePricing — detalhamento de taxas das plataformas', () => {
  it('reparte o valor de cada taxa da plataforma sobre o preço final', () => {
    const result = calculateResalePricing(
      input({
        purchaseCost: 100,
        platformFees: [fee('1', 'Comissão Mercado Livre', 12), fee('2', 'Taxa de pagamento', 5)],
        taxPercent: 0,
        marginMode: 'percent',
        marginPercent: 0,
      }),
    )
    expect(result.platformFeesTotalPercent).toBe(17)
    const ml = result.platformFeeAmounts.find((f) => f.id === '1')!
    const pagamento = result.platformFeeAmounts.find((f) => f.id === '2')!
    expect(round2(ml.amount + pagamento.amount)).toBeCloseTo(result.platformFeesTotalAmount, 1)
    expect(ml.amount).toBeCloseTo(result.finalPrice! * 0.12, 1)
  })
})

describe('calculateResalePricing — lote e alertas', () => {
  it('multiplica o preço final pela quantidade do pedido', () => {
    const result = calculateResalePricing(
      input({ purchaseCost: 50, quantity: 10, marginMode: 'percent', marginPercent: 20, taxPercent: 0, platformFees: [] }),
    )
    expect(result.batchTotal).toBeCloseTo(result.finalPrice! * 10, 1)
  })

  it('não calcula total do lote para quantidade 1', () => {
    const result = calculateResalePricing(input({ purchaseCost: 50, quantity: 1 }))
    expect(result.batchTotal).toBeNull()
  })

  it('avisa quando o preço sugerido fica abaixo do preço mínimo de mercado informado', () => {
    const result = calculateResalePricing(
      input({
        purchaseCost: 10,
        marginMode: 'percent',
        marginPercent: 5,
        taxPercent: 0,
        platformFees: [],
        minMarketPrice: 500,
      }),
    )
    expect(result.warnings.some((w) => w.includes('preço mínimo de mercado'))).toBe(true)
  })
})
