import { describe, expect, it } from 'vitest'
import type { PricingInput } from '../../types/pricing'
import { calculateCostBreakdown, calculatePricing, createDefaultPricingInput, round2, validatePricingInput } from './calculate'

/** Monta um input completo a partir dos defaults, com overrides pontuais. */
function buildInput(overrides: (input: PricingInput) => void): PricingInput {
  const input = createDefaultPricingInput()
  overrides(input)
  return input
}

describe('round2', () => {
  it('arredonda para 2 casas decimais', () => {
    expect(round2(45.454545)).toBe(45.45)
    expect(round2(1.005)).toBe(1.01) // corrige o erro clássico de ponto flutuante (1.005 -> 1.00)
    expect(round2(10)).toBe(10)
  })
})

describe('calculatePricing — critério de aceite principal', () => {
  it('para custo=20, margem=40%, taxa plataforma=12%, taxa cartão=4%: preço = 20 / (1 - 0,56) = 45,45', () => {
    const input = buildInput((i) => {
      // Custo total de produção = 20 via um único insumo direto, para isolar o teste do resto da cadeia de custos.
      i.material.extraSupplies = [{ id: '1', name: 'Insumo único', quantity: 1, unitCost: 20 }]
      i.material.wastePercent = 0
      i.fees.platformFeePercent = 12
      i.fees.paymentFeePercent = 4
      i.fees.taxPercent = 0
      i.margin.method = 'margin_on_price'
      i.margin.marginOnPricePercent = 40
    })

    const result = calculatePricing(input)

    expect(result.costBreakdown.totalProductionCost).toBe(20)
    expect(result.marginOnPrice.finalPrice).toBe(45.45)
    expect(result.selected.finalPrice).toBe(45.45)
  })

  it('não deve ser igual ao markup simples (custo × (1 + margem%) = 28,00)', () => {
    const input = buildInput((i) => {
      i.material.extraSupplies = [{ id: '1', name: 'Insumo único', quantity: 1, unitCost: 20 }]
      i.fees.platformFeePercent = 12
      i.fees.paymentFeePercent = 4
      i.margin.marginOnPricePercent = 40
      i.margin.markupOnCostPercent = 40
    })

    const result = calculatePricing(input)

    expect(result.markupOnCost.finalPrice).toBe(28)
    expect(result.marginOnPrice.finalPrice).not.toBe(28)
    expect(result.marginOnPrice.finalPrice).toBe(45.45)
  })

  it('deixa explícito que nem todo o valor acima do custo é lucro puro (taxas consomem parte)', () => {
    const input = buildInput((i) => {
      i.material.extraSupplies = [{ id: '1', name: 'Insumo único', quantity: 1, unitCost: 20 }]
      i.fees.platformFeePercent = 12
      i.fees.paymentFeePercent = 4
      i.margin.marginOnPricePercent = 40
    })

    const result = calculatePricing(input)
    const { finalPrice, profitAmount, fees } = result.marginOnPrice

    expect(finalPrice).toBe(45.45)
    // Diferença entre preço final e custo: R$ 25,45 — mas nem tudo isso é lucro.
    expect(round2(finalPrice! - result.costBreakdown.totalProductionCost)).toBe(25.45)
    // Taxas consomem 16% de 45.45 = 7.27
    expect(fees.totalFeesAmount).toBeCloseTo(7.27, 2)
    // Lucro real é a margem de 40% sobre o preço final: 40% de 45.45 = 18.18
    expect(profitAmount).toBeCloseTo(18.18, 2)
    // custo + taxas + lucro devem reconstituir o preço final
    expect(round2(result.costBreakdown.totalProductionCost + fees.totalFeesAmount + profitAmount!)).toBe(45.45)
  })

  it('atualiza o preço final instantaneamente ao trocar a margem de 30% para 50%', () => {
    const base = buildInput((i) => {
      i.material.extraSupplies = [{ id: '1', name: 'Insumo único', quantity: 1, unitCost: 20 }]
    })

    const at30 = calculatePricing(buildInput((i) => Object.assign(i, base, { margin: { ...base.margin, marginOnPricePercent: 30 } })))
    const at50 = calculatePricing(buildInput((i) => Object.assign(i, base, { margin: { ...base.margin, marginOnPricePercent: 50 } })))

    expect(at30.marginOnPrice.finalPrice).toBe(round2(20 / (1 - 0.3)))
    expect(at50.marginOnPrice.finalPrice).toBe(round2(20 / (1 - 0.5)))
    expect(at50.marginOnPrice.finalPrice).not.toBe(at30.marginOnPrice.finalPrice)
  })
})

describe('calculateCostBreakdown — hierarquia completa de custos', () => {
  it('soma material, energia, depreciação, mão de obra, custo fixo e embalagem/frete', () => {
    const input = buildInput((i) => {
      i.material.materials = [
        { id: '1', name: 'PLA Preto', weightGrams: 50, costPerKg: 100 }, // 5.00
        { id: '2', name: 'PETG Branco', weightGrams: 20, costPerKg: 150 }, // 3.00
      ]
      i.material.wastePercent = 10 // 10% de 8.00 = 0.80
      i.material.extraSupplies = [{ id: '3', name: 'Insert M3', quantity: 4, unitCost: 0.5 }] // 2.00

      i.energy.printerPowerWatts = 200
      i.energy.printTimeHours = 5
      i.energy.energyTariffPerKwh = 0.8 // (200*5*0.8)/1000 = 0.80

      i.depreciation.printer = { id: 'printer', name: 'Ender 3', acquisitionCost: 1500, lifespanHours: 3000 } // 0.5/h * 5h = 2.50
      i.depreciation.accessories = [
        { id: 'dryer', name: 'Secador', acquisitionCost: 300, lifespanHours: 1000 }, // 0.3/h * 5h = 1.50
      ]

      i.labor.manualLaborHours = 0.5
      i.labor.hourlyRate = 30 // 15.00

      i.fixedCosts.monthlyFixedCosts = 500
      i.fixedCosts.estimatedMonthlyPieces = 100 // 5.00/peça

      i.packaging.packagingCostPerPiece = 3
      i.packaging.shippingCost = 12
      i.packaging.includeShippingInPrice = true
    })

    const breakdown = calculateCostBreakdown(input)

    expect(breakdown.materialBaseCost).toBe(8)
    expect(breakdown.materialWasteCost).toBe(0.8)
    expect(breakdown.extraSuppliesCost).toBe(2)
    expect(breakdown.materialTotalCost).toBe(10.8)
    expect(breakdown.energyCost).toBe(0.8)
    expect(breakdown.depreciationCost).toBe(4) // 2.50 + 1.50
    expect(breakdown.laborCost).toBe(15)
    expect(breakdown.fixedCostPerPiece).toBe(5)
    expect(breakdown.packagingCost).toBe(3)
    expect(breakdown.shippingCost).toBe(12)

    const expectedTotal = 10.8 + 0.8 + 4 + 15 + 5 + 3 + 12
    expect(breakdown.totalProductionCost).toBe(round2(expectedTotal))
  })

  it('ignora o frete quando includeShippingInPrice é falso', () => {
    const input = buildInput((i) => {
      i.material.extraSupplies = [{ id: '1', name: 'X', quantity: 1, unitCost: 10 }]
      i.packaging.shippingCost = 999
      i.packaging.includeShippingInPrice = false
    })

    const breakdown = calculateCostBreakdown(input)
    expect(breakdown.shippingCost).toBe(0)
    expect(breakdown.totalProductionCost).toBe(10)
  })

  it('usa o rateio manual de custo fixo quando informado, ignorando o cálculo automático', () => {
    const input = buildInput((i) => {
      i.fixedCosts.monthlyFixedCosts = 1000
      i.fixedCosts.estimatedMonthlyPieces = 10 // automático seria 100
      i.fixedCosts.manualOverridePerPiece = 2.5
    })

    const breakdown = calculateCostBreakdown(input)
    expect(breakdown.fixedCostPerPiece).toBe(2.5)
  })

  it('não divide por zero quando a quantidade estimada de peças é zero', () => {
    const input = buildInput((i) => {
      i.fixedCosts.monthlyFixedCosts = 1000
      i.fixedCosts.estimatedMonthlyPieces = 0
      i.fixedCosts.manualOverridePerPiece = null
    })

    const breakdown = calculateCostBreakdown(input)
    expect(breakdown.fixedCostPerPiece).toBe(0)
    expect(Number.isFinite(breakdown.fixedCostPerPiece)).toBe(true)
  })

  it('não divide por zero quando a vida útil da impressora é zero', () => {
    const input = buildInput((i) => {
      i.depreciation.printer.acquisitionCost = 1000
      i.depreciation.printer.lifespanHours = 0
      i.energy.printTimeHours = 5
    })

    const breakdown = calculateCostBreakdown(input)
    expect(breakdown.depreciationCost).toBe(0)
  })
})

describe('calculatePricing — método de markup sobre o custo', () => {
  it('calcula preço = custo × (1 + markup%)', () => {
    const input = buildInput((i) => {
      i.material.extraSupplies = [{ id: '1', name: 'X', quantity: 1, unitCost: 100 }]
      i.margin.markupOnCostPercent = 50
    })

    const result = calculatePricing(input)
    expect(result.markupOnCost.finalPrice).toBe(150)
  })

  it('mostra que a margem real fica abaixo do markup pretendido quando há taxas', () => {
    const input = buildInput((i) => {
      i.material.extraSupplies = [{ id: '1', name: 'X', quantity: 1, unitCost: 100 }]
      i.margin.markupOnCostPercent = 50 // vendedor "pensa" que vai lucrar 50% do custo
      i.fees.platformFeePercent = 12
      i.fees.paymentFeePercent = 4
    })

    const result = calculatePricing(input)
    // Preço = 150; taxas de 16% sobre 150 = 24; lucro real = 150 - 100 - 24 = 26 (não 50)
    expect(result.markupOnCost.finalPrice).toBe(150)
    expect(result.markupOnCost.fees.totalFeesAmount).toBe(24)
    expect(result.markupOnCost.profitAmount).toBe(26)
    expect(result.markupOnCost.effectiveMarginPercent).toBeLessThan(50)
  })
})

describe('calculatePricing — validação e casos inválidos', () => {
  it('marca o método de margem sobre venda como inválido quando margem + taxas >= 100%', () => {
    const input = buildInput((i) => {
      i.material.extraSupplies = [{ id: '1', name: 'X', quantity: 1, unitCost: 50 }]
      i.margin.marginOnPricePercent = 60
      i.fees.platformFeePercent = 30
      i.fees.paymentFeePercent = 15 // soma = 105%
    })

    const result = calculatePricing(input)
    expect(result.marginOnPrice.isValid).toBe(false)
    expect(result.marginOnPrice.finalPrice).toBeNull()
    expect(result.marginOnPrice.warning).toBeTruthy()
    expect(result.warnings).toContain(result.marginOnPrice.warning)
  })

  it('gera aviso quando nenhum material/insumo foi informado', () => {
    const input = createDefaultPricingInput()
    const result = calculatePricing(input)
    expect(result.warnings.some((w) => w.includes('Nenhum material'))).toBe(true)
  })

  it('gera aviso quando o preço sugerido fica abaixo do preço mínimo de mercado', () => {
    const input = buildInput((i) => {
      i.material.extraSupplies = [{ id: '1', name: 'X', quantity: 1, unitCost: 20 }]
      i.margin.marginOnPricePercent = 10
      i.sanity.minMarketPrice = 100
    })

    const result = calculatePricing(input)
    expect(result.warnings.some((w) => w.includes('preço mínimo de mercado'))).toBe(true)
  })
})

describe('calculatePricing — modo lote', () => {
  it('multiplica o preço final pela quantidade de peças do pedido', () => {
    const input = buildInput((i) => {
      i.material.extraSupplies = [{ id: '1', name: 'X', quantity: 1, unitCost: 20 }]
      i.margin.marginOnPricePercent = 40
      i.quantity = 3
    })

    const result = calculatePricing(input)
    expect(result.batchTotal).toBe(round2(result.selected.finalPrice! * 3))
  })

  it('trata quantidade zero/negativa como 1 peça', () => {
    const input = buildInput((i) => {
      i.material.extraSupplies = [{ id: '1', name: 'X', quantity: 1, unitCost: 20 }]
      i.quantity = 0
    })

    const result = calculatePricing(input)
    expect(result.batchTotal).toBe(result.selected.finalPrice)
  })
})

describe('validatePricingInput', () => {
  it('não retorna erros para um input padrão válido', () => {
    expect(validatePricingInput(createDefaultPricingInput())).toEqual([])
  })

  it('reporta campos negativos', () => {
    const input = buildInput((i) => {
      i.energy.printTimeHours = -5
      i.labor.hourlyRate = -10
    })
    const errors = validatePricingInput(input)
    expect(errors.some((e) => e.includes('Tempo de impressão'))).toBe(true)
    expect(errors.some((e) => e.includes('hora do operador'))).toBe(true)
  })

  it('reporta margem sobre venda >= 100%', () => {
    const input = buildInput((i) => {
      i.margin.marginOnPricePercent = 100
    })
    const errors = validatePricingInput(input)
    expect(errors.some((e) => e.includes('menor que 100%'))).toBe(true)
  })
})
