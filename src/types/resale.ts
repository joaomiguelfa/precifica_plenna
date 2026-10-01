/**
 * Estrutura de dados do domínio de precificação de revenda: comprar um
 * produto pronto para vender no Mercado Livre e em outras plataformas.
 *
 * Custo da mercadoria vendida (CMV) + custos diretos por unidade + taxas das
 * plataformas (comissão, pagamento, anúncios…) + impostos = o que o preço de
 * venda precisa cobrir. A margem de lucro pode ser definida tanto em % do
 * preço final quanto em R$ de lucro desejado por unidade — os dois sempre
 * aparecem lado a lado no resultado, em valor e em percentual, para ajudar a
 * avaliar o preço antes de colocar à venda.
 */

export interface DirectCostItem {
  id: string
  /** Ex.: "Embalagem", "Frete de compra (rateado por unidade)" */
  name: string
  /** Custo por unidade, em R$ */
  cost: number
}

export interface PlatformFeeItem {
  id: string
  /** Ex.: "Comissão Mercado Livre", "Taxa de pagamento", "Ads/patrocinado" */
  name: string
  /** Percentual sobre o preço final de venda (0-100) */
  percent: number
}

export type MarginInputMode = 'percent' | 'value'

export interface ResalePricingInput {
  productName: string
  /** Quantidade de unidades do pedido (modo lote); 1 para unidade única */
  quantity: number
  /** Custo da mercadoria vendida (CMV): quanto custou comprar uma unidade */
  purchaseCost: number
  directCosts: DirectCostItem[]
  /** Taxas das plataformas de venda, uma linha por plataforma/tipo de taxa */
  platformFees: PlatformFeeItem[]
  /** Impostos (ex.: Simples Nacional), em % sobre o preço final (0-100) */
  taxPercent: number
  /** Como a margem de lucro está sendo definida nesta precificação */
  marginMode: MarginInputMode
  /** Usado quando marginMode === 'percent': margem desejada sobre o preço final (0-100, exclusivo) */
  marginPercent: number
  /** Usado quando marginMode === 'value': lucro desejado por unidade, em R$ */
  marginValue: number
  /** Preço mínimo de mercado conhecido pelo usuário, em R$ (opcional) */
  minMarketPrice: number | null
}

// ---------------------------------------------------------------------------
// Output
// ---------------------------------------------------------------------------

export interface ResaleCostBreakdown {
  purchaseCost: number
  directCostsTotal: number
  /** purchaseCost + directCostsTotal */
  totalCost: number
}

export interface PlatformFeeAmount {
  id: string
  name: string
  percent: number
  /** Valor em R$ desse item, calculado sobre o preço final */
  amount: number
}

export interface ResalePricingResult {
  costBreakdown: ResaleCostBreakdown
  platformFeeAmounts: PlatformFeeAmount[]
  platformFeesTotalPercent: number
  platformFeesTotalAmount: number
  taxAmount: number
  /** Preço final sugerido; null quando o cálculo não é matematicamente válido */
  finalPrice: number | null
  /** Lucro efetivo em R$, sempre recalculado a partir do preço final — igual a marginValue quando marginMode é "value" */
  profitAmount: number | null
  /** Lucro efetivo como % do preço final — a "margem real" obtida, igual a marginPercent quando marginMode é "percent" */
  effectiveMarginPercent: number | null
  isValid: boolean
  /** Preço final multiplicado pela quantidade do pedido (null quando quantity <= 1) */
  batchTotal: number | null
  warnings: string[]
}
