import { formatBRL } from '../../lib/format'
import type { PricingInput, PricingResult } from '../../types/pricing'
import { Button } from '../ui/Button'
import { Card } from '../ui/Card'
import { CostBreakdownChart } from './CostBreakdownChart'

interface Props {
  input: PricingInput
  result: PricingResult
  onExportPdf: () => void
  onSaveHistory: () => void
  saving?: boolean
}

const breakdownRows = (result: PricingResult) => [
  { label: 'Material (com desperdício + insumos)', value: result.costBreakdown.materialTotalCost },
  { label: 'Energia elétrica', value: result.costBreakdown.energyCost },
  { label: 'Depreciação de equipamento', value: result.costBreakdown.depreciationCost },
  { label: 'Mão de obra', value: result.costBreakdown.laborCost },
  { label: 'Custos fixos rateados', value: result.costBreakdown.fixedCostPerPiece },
  { label: 'Embalagem', value: result.costBreakdown.packagingCost },
  { label: 'Frete', value: result.costBreakdown.shippingCost },
]

export function ResultPanel({ input, result, onExportPdf, onSaveHistory, saving }: Props) {
  const { selected } = result

  return (
    <div className="space-y-4">
      <Card className="p-5">
        <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Custo real de produção</p>
        <p className="text-2xl font-semibold text-slate-900">{formatBRL(result.costBreakdown.totalProductionCost)}</p>

        <div className="my-4 border-t border-dashed border-slate-200" />

        <p className="text-xs font-medium uppercase tracking-wide text-indigo-600">Preço final sugerido</p>
        <p className="text-4xl font-bold text-indigo-700">{formatBRL(selected.finalPrice)}</p>
        {selected.isValid && selected.finalPrice != null && (
          <p className="mt-1 text-xs text-slate-500">
            Dessa diferença de {formatBRL(selected.finalPrice - result.costBreakdown.totalProductionCost)}, apenas{' '}
            <strong>{formatBRL(selected.profitAmount)}</strong> é lucro — o restante ({formatBRL(selected.fees.totalFeesAmount)})
            vai para taxas de plataforma, cartão e impostos.
          </p>
        )}

        {input.quantity > 1 && result.batchTotal != null && (
          <p className="mt-2 text-sm text-slate-600">
            Pedido de {input.quantity} peças: <strong>{formatBRL(result.batchTotal)}</strong>
          </p>
        )}
      </Card>

      {result.warnings.length > 0 && (
        <Card className="border-amber-300 bg-amber-50 p-4">
          <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-amber-700">Alertas de sanidade</p>
          <ul className="list-inside list-disc space-y-1 text-sm text-amber-800">
            {result.warnings.map((w, i) => (
              <li key={i}>{w}</li>
            ))}
          </ul>
        </Card>
      )}

      <Card className="p-5">
        <p className="mb-3 text-sm font-semibold text-slate-700">Composição do preço final</p>
        <CostBreakdownChart costBreakdown={result.costBreakdown} selected={selected} />
      </Card>

      <Card className="p-5">
        <p className="mb-3 text-sm font-semibold text-slate-700">Detalhamento dos custos</p>
        <dl className="space-y-1.5 text-sm">
          {breakdownRows(result).map((row) => (
            <div key={row.label} className="flex items-center justify-between">
              <dt className="text-slate-500">{row.label}</dt>
              <dd className="font-medium text-slate-800">{formatBRL(row.value)}</dd>
            </div>
          ))}
          <div className="flex items-center justify-between border-t border-slate-200 pt-1.5 font-semibold">
            <dt>Custo total de produção</dt>
            <dd>{formatBRL(result.costBreakdown.totalProductionCost)}</dd>
          </div>
          <div className="flex items-center justify-between pt-2 text-slate-500">
            <dt>Taxas sobre a venda</dt>
            <dd>{formatBRL(selected.fees.totalFeesAmount)}</dd>
          </div>
          <div className="flex items-center justify-between text-slate-500">
            <dt>Lucro</dt>
            <dd>{formatBRL(selected.profitAmount)}</dd>
          </div>
          <div className="flex items-center justify-between border-t border-slate-200 pt-1.5 text-base font-bold text-indigo-700">
            <dt>Preço final</dt>
            <dd>{formatBRL(selected.finalPrice)}</dd>
          </div>
        </dl>
      </Card>

      <div className="flex flex-wrap gap-2">
        <Button variant="secondary" onClick={onExportPdf} disabled={!selected.isValid}>
          Exportar orçamento (PDF)
        </Button>
        <Button onClick={onSaveHistory} disabled={saving}>
          {saving ? 'Salvando…' : 'Salvar no histórico'}
        </Button>
      </div>
    </div>
  )
}
