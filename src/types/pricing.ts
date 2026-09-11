/**
 * Estrutura de dados do domínio de precificação de peças impressas em 3D.
 *
 * A hierarquia de custos segue: material -> energia -> depreciação -> mão de
 * obra -> custos fixos rateados -> embalagem/logística = custo total de
 * produção. Sobre o custo total incidem taxas de venda e margem de lucro,
 * que juntas compõem o preço final.
 */

// ---------------------------------------------------------------------------
// 1. Material e insumos diretos
// ---------------------------------------------------------------------------

export interface MaterialItem {
  id: string
  /** Ex.: "PLA Preto", "PETG Branco" */
  name: string
  /** Peso de filamento consumido, em gramas */
  weightGrams: number
  /** Custo do filamento, em R$ por kg */
  costPerKg: number
}

export interface ExtraSupplyItem {
  id: string
  /** Ex.: "Suporte solúvel PVA", "Insert metálico M3" */
  name: string
  quantity: number
  /** Custo unitário, em R$ */
  unitCost: number
}

export interface MaterialSection {
  materials: MaterialItem[]
  /** Percentual de desperdício/falha aplicado sobre o custo do material (0-100) */
  wastePercent: number
  extraSupplies: ExtraSupplyItem[]
}

// ---------------------------------------------------------------------------
// 2. Energia elétrica
// ---------------------------------------------------------------------------

export interface EnergySection {
  /** Potência da impressora, em Watts */
  printerPowerWatts: number
  /** Tempo de impressão, em horas (tempo de máquina) */
  printTimeHours: number
  /** Tarifa de energia, em R$ por kWh */
  energyTariffPerKwh: number
}

// ---------------------------------------------------------------------------
// 3. Depreciação de equipamento
// ---------------------------------------------------------------------------

export interface DepreciableAsset {
  id: string
  name: string
  /** Valor de aquisição, em R$ */
  acquisitionCost: number
  /** Vida útil estimada, em horas de uso */
  lifespanHours: number
}

export interface DepreciationSection {
  printer: DepreciableAsset
  /** Acessórios com depreciação própria (mesa aquecida extra, secador etc.) */
  accessories: DepreciableAsset[]
}

// ---------------------------------------------------------------------------
// 4. Mão de obra
// ---------------------------------------------------------------------------

export interface LaborSection {
  /** Tempo de trabalho manual: modelagem, pós-processamento, montagem, embalagem (horas) */
  manualLaborHours: number
  /** Valor da hora do operador, em R$ */
  hourlyRate: number
}

// ---------------------------------------------------------------------------
// 5. Custos indiretos/fixos rateados
// ---------------------------------------------------------------------------

export interface FixedCostsSection {
  /** Soma dos custos fixos mensais do negócio, em R$ */
  monthlyFixedCosts: number
  /** Quantidade estimada de peças produzidas no mês */
  estimatedMonthlyPieces: number
  /**
   * Quando definido, sobrepõe o rateio automático
   * (monthlyFixedCosts / estimatedMonthlyPieces) com um valor por peça
   * digitado manualmente pelo usuário.
   */
  manualOverridePerPiece: number | null
}

// ---------------------------------------------------------------------------
// 6. Embalagem e logística
// ---------------------------------------------------------------------------

export interface PackagingLogisticsSection {
  /** Custo de embalagem por peça, em R$ */
  packagingCostPerPiece: number
  /** Custo de frete, em R$ */
  shippingCost: number
  /** Se true, o frete entra na composição do custo total/preço final */
  includeShippingInPrice: boolean
}

// ---------------------------------------------------------------------------
// 8. Taxas sobre a venda
// ---------------------------------------------------------------------------

export interface FeesSection {
  /** Taxa da plataforma/marketplace, em % sobre o preço final (0-100) */
  platformFeePercent: number
  /** Taxa de gateway de pagamento/cartão, em % sobre o preço final (0-100) */
  paymentFeePercent: number
  /** Impostos (ex.: Simples Nacional), em % sobre o preço final (0-100) */
  taxPercent: number
}

// ---------------------------------------------------------------------------
// 9. Margem de lucro
// ---------------------------------------------------------------------------

export type PricingMethod = 'margin_on_price' | 'markup_on_cost'

export interface MarginSection {
  /** Método selecionado para exibição/uso como resultado principal */
  method: PricingMethod
  /** Margem desejada sobre o preço final de venda, em % (0-100, exclusivo) */
  marginOnPricePercent: number
  /** Markup desejado sobre o custo, em % (>= 0) */
  markupOnCostPercent: number
}

// ---------------------------------------------------------------------------
// Verificações de sanidade
// ---------------------------------------------------------------------------

export interface SanitySection {
  /** Preço mínimo de mercado conhecido pelo usuário, em R$ (opcional) */
  minMarketPrice: number | null
}

// ---------------------------------------------------------------------------
// Input completo
// ---------------------------------------------------------------------------

export interface PricingInput {
  pieceName: string
  /** Quantidade de peças do pedido (modo lote); 1 para peça única */
  quantity: number
  material: MaterialSection
  energy: EnergySection
  depreciation: DepreciationSection
  labor: LaborSection
  fixedCosts: FixedCostsSection
  packaging: PackagingLogisticsSection
  fees: FeesSection
  margin: MarginSection
  sanity: SanitySection
}

// ---------------------------------------------------------------------------
// Output
// ---------------------------------------------------------------------------

export interface CostBreakdown {
  materialBaseCost: number
  materialWasteCost: number
  extraSuppliesCost: number
  /** materialBaseCost + materialWasteCost + extraSuppliesCost */
  materialTotalCost: number
  energyCost: number
  depreciationCost: number
  laborCost: number
  fixedCostPerPiece: number
  packagingCost: number
  shippingCost: number
  /** Soma de todos os itens acima: o "custo real" da peça */
  totalProductionCost: number
}

export interface FeesBreakdown {
  platformFeeAmount: number
  paymentFeeAmount: number
  taxAmount: number
  totalFeesAmount: number
}

export interface PricingMethodResult {
  method: PricingMethod
  /** Preço final sugerido; null quando o cálculo não é matematicamente válido */
  finalPrice: number | null
  fees: FeesBreakdown
  /** Lucro efetivo em R$ (pode divergir da margem pretendida no método markup) */
  profitAmount: number | null
  /** Lucro efetivo como % do preço final (a "margem real") */
  effectiveMarginPercent: number | null
  isValid: boolean
  warning: string | null
}

export interface PricingResult {
  costBreakdown: CostBreakdown
  marginOnPrice: PricingMethodResult
  markupOnCost: PricingMethodResult
  /** Resultado do método escolhido em margin.method, para uso direto na UI */
  selected: PricingMethodResult
  /** Diferença de preço final entre os dois métodos (markup - margem) */
  priceDifferenceBetweenMethods: number | null
  /** Preço final multiplicado pela quantidade de peças do pedido */
  batchTotal: number | null
  warnings: string[]
}
