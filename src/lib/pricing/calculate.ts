import type {
  CostBreakdown,
  FeesBreakdown,
  PricingInput,
  PricingMethod,
  PricingMethodResult,
  PricingResult,
} from '../../types/pricing'

/** Arredonda para 2 casas decimais evitando erros clássicos de ponto flutuante. */
export function round2(value: number): number {
  if (!Number.isFinite(value)) return value
  return Math.round((value + Number.EPSILON) * 100) / 100
}

/**
 * Custo total de percentuais de venda (margem/markup + taxas) que incidem
 * sobre o preço final. Usado para validar se o método "margem sobre venda"
 * é matematicamente possível (a soma não pode atingir 100%).
 */
function sumSalePercentages(fees: { platformFeePercent: number; paymentFeePercent: number; taxPercent: number }, marginPercent: number): number {
  return marginPercent + fees.platformFeePercent + fees.paymentFeePercent + fees.taxPercent
}

// ---------------------------------------------------------------------------
// Custo total de produção (etapas 1 a 6)
// ---------------------------------------------------------------------------

export function calculateCostBreakdown(input: PricingInput): CostBreakdown {
  const { material, energy, depreciation, labor, fixedCosts, packaging } = input

  const materialBaseCost = material.materials.reduce(
    (sum, m) => sum + (m.weightGrams / 1000) * m.costPerKg,
    0,
  )
  const materialWasteCost = materialBaseCost * (material.wastePercent / 100)
  const extraSuppliesCost = material.extraSupplies.reduce(
    (sum, item) => sum + item.quantity * item.unitCost,
    0,
  )
  const materialTotalCost = materialBaseCost + materialWasteCost + extraSuppliesCost

  const energyCost =
    (energy.printerPowerWatts * energy.printTimeHours * energy.energyTariffPerKwh) / 1000

  const printerDepreciation =
    depreciation.printer.lifespanHours > 0
      ? (depreciation.printer.acquisitionCost / depreciation.printer.lifespanHours) * energy.printTimeHours
      : 0
  const accessoriesDepreciation = depreciation.accessories.reduce((sum, asset) => {
    if (asset.lifespanHours <= 0) return sum
    return sum + (asset.acquisitionCost / asset.lifespanHours) * energy.printTimeHours
  }, 0)
  const depreciationCost = printerDepreciation + accessoriesDepreciation

  const laborCost = labor.manualLaborHours * labor.hourlyRate

  const fixedCostPerPiece =
    fixedCosts.manualOverridePerPiece != null
      ? fixedCosts.manualOverridePerPiece
      : fixedCosts.estimatedMonthlyPieces > 0
        ? fixedCosts.monthlyFixedCosts / fixedCosts.estimatedMonthlyPieces
        : 0

  const packagingCost = packaging.packagingCostPerPiece
  const shippingCost = packaging.includeShippingInPrice ? packaging.shippingCost : 0

  const totalProductionCost =
    materialTotalCost +
    energyCost +
    depreciationCost +
    laborCost +
    fixedCostPerPiece +
    packagingCost +
    shippingCost

  return {
    materialBaseCost: round2(materialBaseCost),
    materialWasteCost: round2(materialWasteCost),
    extraSuppliesCost: round2(extraSuppliesCost),
    materialTotalCost: round2(materialTotalCost),
    energyCost: round2(energyCost),
    depreciationCost: round2(depreciationCost),
    laborCost: round2(laborCost),
    fixedCostPerPiece: round2(fixedCostPerPiece),
    packagingCost: round2(packagingCost),
    shippingCost: round2(shippingCost),
    totalProductionCost: round2(totalProductionCost),
  }
}

// ---------------------------------------------------------------------------
// Preço final (etapas 8 a 10) — os dois métodos
// ---------------------------------------------------------------------------

function buildFees(finalPrice: number, fees: PricingInput['fees']): FeesBreakdown {
  const platformFeeAmount = finalPrice * (fees.platformFeePercent / 100)
  const paymentFeeAmount = finalPrice * (fees.paymentFeePercent / 100)
  const taxAmount = finalPrice * (fees.taxPercent / 100)
  return {
    platformFeeAmount: round2(platformFeeAmount),
    paymentFeeAmount: round2(paymentFeeAmount),
    taxAmount: round2(taxAmount),
    totalFeesAmount: round2(platformFeeAmount + paymentFeeAmount + taxAmount),
  }
}

/**
 * Método correto quando o usuário diz "quero X% de margem de lucro":
 * a margem (e as taxas) incidem sobre o PREÇO FINAL, não sobre o custo.
 *
 *   Preço = CustoTotal / (1 - Margem% - TaxaPlataforma% - TaxaCartão% - Imposto%)
 */
function calculateMarginOnPrice(
  totalProductionCost: number,
  fees: PricingInput['fees'],
  marginOnPricePercent: number,
): PricingMethodResult {
  const totalPercent = sumSalePercentages(fees, marginOnPricePercent)
  const denominator = 1 - totalPercent / 100

  if (denominator <= 0) {
    return {
      method: 'margin_on_price',
      finalPrice: null,
      fees: { platformFeeAmount: 0, paymentFeeAmount: 0, taxAmount: 0, totalFeesAmount: 0 },
      profitAmount: null,
      effectiveMarginPercent: null,
      isValid: false,
      warning:
        'A soma da margem desejada com as taxas de venda atinge ou ultrapassa 100% do preço final — não existe preço capaz de cobrir isso. Reduza a margem ou as taxas.',
    }
  }

  const finalPrice = totalProductionCost / denominator
  const feesBreakdown = buildFees(finalPrice, fees)
  const profitAmount = finalPrice - totalProductionCost - feesBreakdown.totalFeesAmount

  return {
    method: 'margin_on_price',
    finalPrice: round2(finalPrice),
    fees: feesBreakdown,
    profitAmount: round2(profitAmount),
    effectiveMarginPercent: round2((profitAmount / finalPrice) * 100),
    isValid: true,
    warning: null,
  }
}

/**
 * Método comum (e tecnicamente incorreto para quem pensa em "margem"):
 * aplica um multiplicador simples sobre o custo, sem considerar que as
 * taxas de venda continuam incidindo sobre o preço final resultante.
 *
 *   Preço = CustoTotal × (1 + Markup%)
 */
function calculateMarkupOnCost(
  totalProductionCost: number,
  fees: PricingInput['fees'],
  markupOnCostPercent: number,
): PricingMethodResult {
  const finalPrice = totalProductionCost * (1 + markupOnCostPercent / 100)
  const feesBreakdown = buildFees(finalPrice, fees)
  const profitAmount = finalPrice - totalProductionCost - feesBreakdown.totalFeesAmount

  return {
    method: 'markup_on_cost',
    finalPrice: round2(finalPrice),
    fees: feesBreakdown,
    profitAmount: round2(profitAmount),
    effectiveMarginPercent: finalPrice > 0 ? round2((profitAmount / finalPrice) * 100) : null,
    isValid: Number.isFinite(finalPrice),
    warning: null,
  }
}

// ---------------------------------------------------------------------------
// Função principal
// ---------------------------------------------------------------------------

export function calculatePricing(input: PricingInput): PricingResult {
  const costBreakdown = calculateCostBreakdown(input)
  const { totalProductionCost } = costBreakdown

  const marginOnPrice = calculateMarginOnPrice(
    totalProductionCost,
    input.fees,
    input.margin.marginOnPricePercent,
  )
  const markupOnCost = calculateMarkupOnCost(
    totalProductionCost,
    input.fees,
    input.margin.markupOnCostPercent,
  )

  const selected = input.margin.method === 'margin_on_price' ? marginOnPrice : markupOnCost

  const priceDifferenceBetweenMethods =
    marginOnPrice.finalPrice != null && markupOnCost.finalPrice != null
      ? round2(markupOnCost.finalPrice - marginOnPrice.finalPrice)
      : null

  const quantity = input.quantity > 0 ? input.quantity : 1
  const batchTotal = selected.finalPrice != null ? round2(selected.finalPrice * quantity) : null

  const warnings = collectWarnings(input, costBreakdown, selected)

  return {
    costBreakdown,
    marginOnPrice,
    markupOnCost,
    selected,
    priceDifferenceBetweenMethods,
    batchTotal,
    warnings,
  }
}

function collectWarnings(
  input: PricingInput,
  costBreakdown: CostBreakdown,
  selected: PricingMethodResult,
): string[] {
  const warnings: string[] = []

  if (selected.warning) warnings.push(selected.warning)

  if (input.material.materials.length === 0 && input.material.extraSupplies.length === 0) {
    warnings.push('Nenhum material ou insumo direto foi informado.')
  }

  if (input.energy.printTimeHours <= 0) {
    warnings.push('Tempo de impressão está zerado — energia e depreciação não serão calculadas corretamente.')
  }

  if (costBreakdown.totalProductionCost <= 0) {
    warnings.push('Custo total de produção está zerado — confira se os campos foram preenchidos.')
  }

  if (
    input.sanity.minMarketPrice != null &&
    selected.finalPrice != null &&
    selected.finalPrice < input.sanity.minMarketPrice
  ) {
    warnings.push(
      `O preço sugerido (${selected.finalPrice}) está abaixo do preço mínimo de mercado informado (${input.sanity.minMarketPrice}).`,
    )
  }

  return warnings
}

// ---------------------------------------------------------------------------
// Fábrica de input vazio, útil para inicializar formulários
// ---------------------------------------------------------------------------

export function createDefaultPricingInput(): PricingInput {
  return {
    pieceName: '',
    quantity: 1,
    material: {
      materials: [],
      wastePercent: 5,
      extraSupplies: [],
    },
    energy: {
      printerPowerWatts: 0,
      printTimeHours: 0,
      energyTariffPerKwh: 0,
    },
    depreciation: {
      printer: { id: 'printer', name: 'Impressora', acquisitionCost: 0, lifespanHours: 0 },
      accessories: [],
    },
    labor: {
      manualLaborHours: 0,
      hourlyRate: 0,
    },
    fixedCosts: {
      monthlyFixedCosts: 0,
      estimatedMonthlyPieces: 0,
      manualOverridePerPiece: null,
    },
    packaging: {
      packagingCostPerPiece: 0,
      shippingCost: 0,
      includeShippingInPrice: false,
    },
    fees: {
      platformFeePercent: 0,
      paymentFeePercent: 0,
      taxPercent: 0,
    },
    margin: {
      method: 'margin_on_price' as PricingMethod,
      marginOnPricePercent: 30,
      markupOnCostPercent: 30,
    },
    sanity: {
      minMarketPrice: null,
    },
  }
}

// ---------------------------------------------------------------------------
// Validação de inputs (mensagens para a UI)
// ---------------------------------------------------------------------------

export function validatePricingInput(input: PricingInput): string[] {
  const errors: string[] = []

  const nonNegative = (value: number, label: string) => {
    if (value < 0) errors.push(`${label} não pode ser negativo.`)
  }

  input.material.materials.forEach((m, i) => {
    nonNegative(m.weightGrams, `Peso do material #${i + 1}`)
    nonNegative(m.costPerKg, `Custo/kg do material #${i + 1}`)
  })
  nonNegative(input.material.wastePercent, 'Percentual de desperdício')
  input.material.extraSupplies.forEach((s, i) => {
    nonNegative(s.quantity, `Quantidade do insumo #${i + 1}`)
    nonNegative(s.unitCost, `Custo unitário do insumo #${i + 1}`)
  })

  nonNegative(input.energy.printerPowerWatts, 'Potência da impressora')
  nonNegative(input.energy.printTimeHours, 'Tempo de impressão')
  nonNegative(input.energy.energyTariffPerKwh, 'Tarifa de energia')

  nonNegative(input.depreciation.printer.acquisitionCost, 'Valor de aquisição da impressora')
  nonNegative(input.depreciation.printer.lifespanHours, 'Vida útil da impressora')
  input.depreciation.accessories.forEach((a, i) => {
    nonNegative(a.acquisitionCost, `Valor de aquisição do acessório #${i + 1}`)
    nonNegative(a.lifespanHours, `Vida útil do acessório #${i + 1}`)
  })

  nonNegative(input.labor.manualLaborHours, 'Tempo de mão de obra')
  nonNegative(input.labor.hourlyRate, 'Valor da hora do operador')

  nonNegative(input.fixedCosts.monthlyFixedCosts, 'Custos fixos mensais')
  nonNegative(input.fixedCosts.estimatedMonthlyPieces, 'Quantidade estimada de peças/mês')
  if (input.fixedCosts.manualOverridePerPiece != null) {
    nonNegative(input.fixedCosts.manualOverridePerPiece, 'Rateio manual por peça')
  }

  nonNegative(input.packaging.packagingCostPerPiece, 'Custo de embalagem')
  nonNegative(input.packaging.shippingCost, 'Custo de frete')

  nonNegative(input.fees.platformFeePercent, 'Taxa de plataforma')
  nonNegative(input.fees.paymentFeePercent, 'Taxa de cartão')
  nonNegative(input.fees.taxPercent, 'Imposto')

  nonNegative(input.margin.marginOnPricePercent, 'Margem sobre a venda')
  nonNegative(input.margin.markupOnCostPercent, 'Markup sobre o custo')
  if (input.margin.marginOnPricePercent >= 100) {
    errors.push('Margem sobre a venda deve ser menor que 100%.')
  }

  nonNegative(input.quantity, 'Quantidade de peças')

  return errors
}
