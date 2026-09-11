import { jsPDF } from 'jspdf'
import { formatBRL } from '../format'
import type { PricingInput, PricingResult } from '../../types/pricing'

/**
 * Gera um orçamento simples em PDF para enviar ao cliente: apenas o preço
 * final, sem o detalhamento de custos internos do produtor.
 */
export function exportQuotePdf(
  input: PricingInput,
  result: PricingResult,
  seller?: { fullName: string } | null,
) {
  const doc = new jsPDF({ unit: 'mm', format: 'a5' })
  const pageWidth = doc.internal.pageSize.getWidth()
  const marginX = 16
  let y = 20

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
  doc.save(`orcamento_${safeName}.pdf`)
}
