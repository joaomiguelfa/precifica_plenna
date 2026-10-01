import type {
  DirectCostItem,
  PlatformFeeAmount,
  PlatformFeeItem,
  ResaleCostBreakdown,
  ResalePricingInput,
  ResalePricingResult,
} from '../../types/resale'

/** Arredonda para 2 casas decimais evitando erros clássicos de ponto flutuante. */
export function round2(value: number): number {
  if (!Number.isFinite(value)) return value
  return Math.round((value + Number.EPSILON) * 100) / 100
}

function directCostsTotal(items: DirectCostItem[]): number {
  return items.reduce((sum, item) => sum + item.cost, 0)
}

function platformFeesTotalPercent(items: PlatformFeeItem[]): number {
  return items.reduce((sum, item) => sum + item.percent, 0)
}

/**
 * Preço de venda para revenda de produto pronto: o custo (CMV + custos
 * diretos) precisa ser recuperado depois que as taxas das plataformas e os
 * impostos — que incidem sobre o PREÇO FINAL, não sobre o custo — forem
 * descontados. Mesma lógica de "margem sobre a venda" usada no resto do
 * app, não markup simples sobre o custo.
 *
 * Com a margem em % do preço final:
 *   Preço = CustoTotal / (1 - TaxasPlataformas% - Imposto% - Margem%)
 *
 * Com a margem como um valor fixo de lucro por unidade, o lucro desejado
 * entra como mais uma parcela de custo a recuperar (já que as taxas também
 * incidem sobre ele, por ser parte do preço final):
 *   Preço = (CustoTotal + LucroDesejado) / (1 - TaxasPlataformas% - Imposto%)
 */
export function calculateResalePricing(input: ResalePricingInput): ResalePricingResult {
  const directTotal = directCostsTotal(input.directCosts)
  const totalCost = input.purchaseCost + directTotal
  const costBreakdown: ResaleCostBreakdown = {
    purchaseCost: round2(input.purchaseCost),
    directCostsTotal: round2(directTotal),
    totalCost: round2(totalCost),
  }

  const feesPercent = platformFeesTotalPercent(input.platformFees)
  const warnings: string[] = []

  let finalPrice: number | null = null

  if (input.marginMode === 'percent') {
    const totalPercent = feesPercent + input.taxPercent + input.marginPercent
    const denominator = 1 - totalPercent / 100
    if (denominator <= 0) {
      warnings.push(
        'A soma das taxas das plataformas, impostos e margem atinge ou ultrapassa 100% do preço — não existe preço capaz de cobrir isso. Reduza algum desses percentuais.',
      )
    } else {
      finalPrice = round2(totalCost / denominator)
    }
  } else {
    const totalPercent = feesPercent + input.taxPercent
    const denominator = 1 - totalPercent / 100
    if (denominator <= 0) {
      warnings.push(
        'A soma das taxas das plataformas e impostos atinge ou ultrapassa 100% do preço — não existe preço capaz de cobrir isso, mesmo sem lucro. Reduza essas taxas.',
      )
    } else {
      finalPrice = round2((totalCost + input.marginValue) / denominator)
    }
  }

  const platformFeeAmounts: PlatformFeeAmount[] = input.platformFees.map((item) => ({
    id: item.id,
    name: item.name,
    percent: item.percent,
    amount: finalPrice != null ? round2((finalPrice * item.percent) / 100) : 0,
  }))
  const platformFeesTotalAmount = round2(platformFeeAmounts.reduce((sum, item) => sum + item.amount, 0))
  const taxAmount = finalPrice != null ? round2((finalPrice * input.taxPercent) / 100) : 0

  const profitAmount =
    finalPrice != null ? round2(finalPrice - totalCost - platformFeesTotalAmount - taxAmount) : null
  const effectiveMarginPercent =
    finalPrice != null && finalPrice > 0 && profitAmount != null ? round2((profitAmount / finalPrice) * 100) : null

  if (totalCost <= 0) {
    warnings.push('Custo da mercadoria está zerado — confira se o custo de compra foi preenchido.')
  }
  if (
    input.minMarketPrice != null &&
    input.minMarketPrice > 0 &&
    finalPrice != null &&
    finalPrice < input.minMarketPrice
  ) {
    warnings.push(
      `O preço sugerido (${finalPrice}) está abaixo do preço mínimo de mercado informado (${input.minMarketPrice}).`,
    )
  }

  const batchTotal = finalPrice != null && input.quantity > 1 ? round2(finalPrice * input.quantity) : null

  return {
    costBreakdown,
    platformFeeAmounts,
    platformFeesTotalPercent: round2(feesPercent),
    platformFeesTotalAmount,
    taxAmount,
    finalPrice,
    profitAmount,
    effectiveMarginPercent,
    isValid: finalPrice != null,
    batchTotal,
    warnings,
  }
}

// ---------------------------------------------------------------------------
// Fábrica de input vazio, útil para inicializar formulários
// ---------------------------------------------------------------------------

export function createDefaultResalePricingInput(): ResalePricingInput {
  return {
    productName: '',
    quantity: 1,
    purchaseCost: 0,
    directCosts: [],
    platformFees: [],
    taxPercent: 0,
    marginMode: 'percent',
    marginPercent: 30,
    marginValue: 0,
    minMarketPrice: null,
  }
}
