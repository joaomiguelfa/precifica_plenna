import { jsPDF } from 'jspdf'
import { formatBRL, formatPercent } from '../format'
import { LAWYER_ROLE_LABELS } from '../../types/legalPricing'
import type { CombinedLegalResult, LegalPricingInput } from '../../types/legalPricing'

function modelResultRows(results: CombinedLegalResult) {
  const rows: { label: string; value: string }[] = []
  if (results.hourly) {
    rows.push({ label: 'Honorário por hora', value: formatBRL(results.hourly.price) })
  }
  if (results.recurring) {
    rows.push({ label: 'Honorário fixo/recorrente (mensal)', value: formatBRL(results.recurring.price) })
  }
  if (results.success) {
    rows.push({
      label: 'Honorário de êxito',
      value:
        results.success.suggestedFeePercent != null
          ? `${formatPercent(results.success.suggestedFeePercent)} da causa se ganhar`
          : '—',
    })
  }
  if (results.adhoc) {
    rows.push({ label: 'Contratual avulso', value: formatBRL(results.adhoc.price) })
  }
  return rows
}

/**
 * Gera o orçamento em PDF de um caso do BBCS Advocacia.
 *
 * Por padrão mostra só o(s) valor(es) de honorário, para enviar ao cliente
 * sem expor os custos internos do escritório. Com `includeBreakdown: true`
 * (opção "Descrição"), acrescenta o detalhamento completo: profissionais e
 * horas, custos diretos do caso, rateio de custos fixos e as premissas
 * (margem, tributos, provisão, comissão) usadas no cálculo.
 */
export function exportLegalQuotePdf(
  input: LegalPricingInput,
  results: CombinedLegalResult,
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
  doc.text(input.caseName || 'Processo/caso sem nome', marginX, y)
  y += 12

  const rows = modelResultRows(results)
  doc.setFontSize(12)
  for (const row of rows) {
    ensureSpace(10)
    doc.setTextColor(20)
    doc.text(row.label, marginX, y)
    doc.setFontSize(row.value.length > 12 ? 13 : 16)
    doc.text(row.value, pageWidth - marginX, y, { align: 'right' })
    doc.setFontSize(12)
    y += 10
  }

  if (rows.length > 1 && results.estimatedTotalRevenue != null) {
    ensureSpace(12)
    doc.setDrawColor(220)
    doc.line(marginX, y, pageWidth - marginX, y)
    y += 8
    doc.setFontSize(12)
    doc.setTextColor(20)
    doc.text('Receita total estimada do caso', marginX, y)
    doc.setFontSize(16)
    doc.text(formatBRL(results.estimatedTotalRevenue), pageWidth - marginX, y, { align: 'right' })
    y += 10
  }

  if (includeBreakdown) {
    const costBreakdown =
      results.hourly?.costBreakdown ??
      results.recurring?.costBreakdown ??
      results.success?.costBreakdown ??
      results.adhoc?.costBreakdown

    y += 6
    doc.setDrawColor(220)
    doc.line(marginX, y, pageWidth - marginX, y)
    y += 10

    doc.setFontSize(13)
    doc.setTextColor(20)
    doc.text('Descrição — custos do caso', marginX, y)
    y += 9

    if (input.roles.length > 0) {
      doc.setFontSize(10.5)
      doc.setTextColor(90)
      for (const role of input.roles) {
        ensureSpace(7)
        const label = role.employeeName ? `${role.employeeName} (${LAWYER_ROLE_LABELS[role.role]})` : LAWYER_ROLE_LABELS[role.role]
        doc.text(`${label} — ${role.hours}h`, marginX, y)
        y += 7
      }
      ensureSpace(8)
      doc.setTextColor(20)
      doc.text('Subtotal mão de obra', marginX, y)
      doc.text(formatBRL(costBreakdown?.laborCost ?? 0), pageWidth - marginX, y, { align: 'right' })
      y += 9
    }

    if (input.directCosts.length > 0) {
      doc.setFontSize(10.5)
      doc.setTextColor(90)
      for (const item of input.directCosts) {
        ensureSpace(7)
        doc.text(item.name || 'Custo direto', marginX, y)
        doc.setTextColor(20)
        doc.text(formatBRL(item.cost), pageWidth - marginX, y, { align: 'right' })
        doc.setTextColor(90)
        y += 7
      }
      y += 2
    }

    ensureSpace(7)
    doc.setFontSize(10.5)
    doc.setTextColor(90)
    doc.text('Rateio de custos fixos', marginX, y)
    doc.setTextColor(20)
    doc.text(formatBRL(costBreakdown?.fixedCostAllocation ?? 0), pageWidth - marginX, y, { align: 'right' })
    y += 9

    ensureSpace(9)
    doc.setDrawColor(180)
    doc.line(marginX, y - 4, pageWidth - marginX, y - 4)
    doc.setFontSize(11)
    doc.setTextColor(20)
    doc.text('Custo total do caso', marginX, y)
    doc.text(formatBRL(costBreakdown?.totalCost ?? 0), pageWidth - marginX, y, { align: 'right' })
    y += 12

    doc.setFontSize(10.5)
    doc.setTextColor(90)
    ensureSpace(7)
    doc.text(`Margem de lucro: ${formatPercent(input.marginPercent)}`, marginX, y)
    y += 7
    ensureSpace(7)
    doc.text(
      `Carga tributária: ${formatPercent(input.assumptions.taxBurdenPercent)} · Provisão de inadimplência: ${formatPercent(input.assumptions.writeOffPercent)}`,
      marginX,
      y,
    )
    y += 7
    if (results.success) {
      ensureSpace(7)
      doc.text(
        `Comissão de êxito: ${formatPercent(input.assumptions.successCommissionPercent)} · Probabilidade de êxito: ${formatPercent(input.successProbabilityPercent)}`,
        marginX,
        y,
      )
      y += 7
    }
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

  const safeName = (input.caseName || 'orcamento').replace(/[^a-z0-9-_]+/gi, '_')
  const suffix = includeBreakdown ? '_detalhado' : ''
  doc.save(`orcamento_${safeName}${suffix}.pdf`)
}
