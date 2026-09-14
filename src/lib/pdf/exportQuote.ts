import { jsPDF } from 'jspdf'
import { formatBRL } from '../format'
import type { PricingInput, PricingResult } from '../../types/pricing'

function breakdownRows(result: PricingResult) {
  return [
    { label: 'Material (com desperdício + insumos)', value: result.costBreakdown.materialTotalCost },
    { label: 'Energia elétrica', value: result.costBreakdown.energyCost },
    { label: 'Depreciação de equipamento', value: result.costBreakdown.depreciationCost },
    { label: 'Mão de obra', value: result.costBreakdown.laborCost },
    { label: 'Custos fixos rateados', value: result.costBreakdown.fixedCostPerPiece },
    { label: 'Embalagem', value: result.costBreakdown.packagingCost },
    { label: 'Frete', value: result.costBreakdown.shippingCost },
  ]
}

/**
 * Gera um orçamento em PDF.
 *
 * Por padrão mostra só o preço final, para enviar ao cliente sem expor o
 * detalhamento de custos internos do produtor. Com `includeBreakdown: true`
 * (opção "Descrição"), acrescenta a composição completa do preço — útil para
 * uso interno/arquivo do próprio vendedor.
 */
export function exportQuotePdf(
  input: PricingInput,
  result: PricingResult,
  seller?: { fullName: string } | null,
  includeBreakdown = false,
) {
  const doc = new jsPDF({ unit: 'mm', format: includeBreakdown ? 'a4' : 'a5' })
  const pageHeight = doc.internal.pageSize.getHeight()
  const pageWidth = doc.internal.pageSize.getWidth()
  const marginX = 16
  const marginBottom = 20
  let y = 20

  function ensureSpace(next: number) {
    if (y + next > pageHeight - marginBottom) {
      doc.addPage()
      y = 20
    }
  }

  doc.setFontSize(18)
  doc.text('Orçamento', marginX, y)
  y += 10

  doc.setFontSize(10)
  doc.setTextColor(100)
  doc.text(new Date().toLocaleDateString('pt-BR'), pageWidth - marginX, 20, { align: 'right' })

  doc.setDrawColor(220)
  doc.line(marginX, y, pageWidth - marginX, y)
  y += 10

  doc.setTextColor(20)
  doc.setFontSize(13)
  doc.text(input.pieceName || 'Peça personalizada', marginX, y)
  y += 8

  doc.setFontSize(11)
  doc.setTextColor(80)
  doc.text(`Quantidade: ${input.quantity || 1}`, marginX, y)
  y += 14

  doc.setFontSize(12)
  doc.setTextColor(20)
  doc.text('Preço unitário', marginX, y)
  doc.setFontSize(20)
  doc.text(formatBRL(result.selected.finalPrice), pageWidth - marginX, y, { align: 'right' })
  y += 12

  if ((input.quantity || 1) > 1 && result.batchTotal != null) {
    doc.setFontSize(12)
    doc.text('Total do pedido', marginX, y)
    doc.setFontSize(16)
    doc.text(formatBRL(result.batchTotal), pageWidth - marginX, y, { align: 'right' })
    y += 12
  }

  if (includeBreakdown) {
    y += 6
    doc.setDrawColor(220)
    doc.line(marginX, y, pageWidth - marginX, y)
    y += 10

    doc.setFontSize(13)
    doc.setTextColor(20)
    doc.text('Descrição — como chegamos nesse valor', marginX, y)
    y += 9

    doc.setFontSize(10.5)
    for (const row of breakdownRows(result)) {
      ensureSpace(7)
      doc.setTextColor(90)
      doc.text(row.label, marginX, y)
      doc.setTextColor(20)
      doc.text(formatBRL(row.value), pageWidth - marginX, y, { align: 'right' })
      y += 7
    }

    ensureSpace(9)
    doc.setDrawColor(220)
    doc.line(marginX, y - 4, pageWidth - marginX, y - 4)
    doc.setFontSize(11)
    doc.setTextColor(20)
    doc.text('Custo total de produção', marginX, y)
    doc.text(formatBRL(result.costBreakdown.totalProductionCost), pageWidth - marginX, y, { align: 'right' })
    y += 9

    doc.setFontSize(10.5)
    doc.setTextColor(90)
    ensureSpace(7)
    doc.text('Taxas sobre a venda (plataforma, cartão, impostos)', marginX, y)
    doc.setTextColor(20)
    doc.text(formatBRL(result.selected.fees.totalFeesAmount), pageWidth - marginX, y, { align: 'right' })
    y += 7

    ensureSpace(7)
    doc.setTextColor(90)
    doc.text('Margem de lucro', marginX, y)
    doc.setTextColor(20)
    doc.text(formatBRL(result.selected.profitAmount), pageWidth - marginX, y, { align: 'right' })
    y += 9

    ensureSpace(10)
    doc.setDrawColor(180)
    doc.line(marginX, y - 4, pageWidth - marginX, y - 4)
    doc.setFontSize(12)
    doc.setTextColor(20)
    doc.text('Preço final', marginX, y)
    doc.text(formatBRL(result.selected.finalPrice), pageWidth - marginX, y, { align: 'right' })
    y += 10
  }

  ensureSpace(16)
  y += 6
  doc.setDrawColor(220)
  doc.line(marginX, y, pageWidth - marginX, y)
  y += 8

  doc.setFontSize(9)
  doc.setTextColor(140)
  if (seller?.fullName) {
    doc.text(`Emitido por: ${seller.fullName}`, marginX, y)
    y += 6
  }
  doc.text('Orçamento sujeito a alteração sem aviso prévio. Validade: 7 dias.', marginX, y)

  const safeName = (input.pieceName || 'orcamento').replace(/[^a-z0-9-_]+/gi, '_')
  const suffix = includeBreakdown ? '_detalhado' : ''
  doc.save(`orcamento_${safeName}${suffix}.pdf`)
}
