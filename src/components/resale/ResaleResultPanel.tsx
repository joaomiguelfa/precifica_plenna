import { formatBRL, formatPercent } from '../../lib/format'
import type { ResalePricingInput, ResalePricingResult } from '../../types/resale'
import { Card } from '../ui/Card'

interface Props {
  input: ResalePricingInput
  result: ResalePricingResult
}

interface Row {
  label: string
  amount: number
  /** Percentual sobre o preço final — null quando não há preço válido ainda */
  percentOfPrice: number | null
  emphasis?: boolean
}

export function ResaleResultPanel({ input, result }: Props) {
  const price = result.finalPrice
  const pct = (amount: number) => (price != null && price > 0 ? (amount / price) * 100 : null)

  const rows: Row[] = [
    { label: 'Custo da mercadoria (CMV)', amount: result.costBreakdown.purchaseCost, percentOfPrice: pct(result.costBreakdown.purchaseCost) },
    ...(result.costBreakdown.directCostsTotal > 0
      ? [{ label: 'Custos diretos por unidade', amount: result.costBreakdown.directCostsTotal, percentOfPrice: pct(result.costBreakdown.directCostsTotal) }]
      : []),
    ...result.platformFeeAmounts.map((fee) => ({
      label: fee.name || 'Taxa de plataforma',
      amount: fee.amount,
      percentOfPrice: fee.percent,
    })),
    ...(input.taxPercent > 0
      ? [{ label: 'Impostos', amount: result.taxAmount, percentOfPrice: input.taxPercent }]
      : []),
    {
      label: 'Lucro',
      amount: result.profitAmount ?? 0,
      percentOfPrice: result.effectiveMarginPercent,
      emphasis: true,
    },
  ]

  return (
    <div className="space-y-4">
      <Card className="p-5">
        <p className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
          Custo total (CMV + custos diretos)
        </p>
        <p className="text-2xl font-semibold text-slate-900 dark:text-slate-100">
          {formatBRL(result.costBreakdown.totalCost)}
        </p>

        <div className="my-4 border-t border-dashed border-slate-200 dark:border-slate-700" />

        <p className="text-xs font-medium uppercase tracking-wide text-indigo-600 dark:text-indigo-400">
          Preço de venda sugerido
        </p>
        {result.isValid ? (
          <>
            <p className="text-4xl font-bold text-indigo-700 dark:text-indigo-400">{formatBRL(price)}</p>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              Lucro: {formatBRL(result.profitAmount)} ({formatPercent(result.effectiveMarginPercent)} do preço)
            </p>
          </>
        ) : (
          <p className="text-sm text-red-600 dark:text-red-400">
            {result.warnings[0] ?? 'Não foi possível calcular um preço válido.'}
          </p>
        )}

        {input.quantity > 1 && result.batchTotal != null && (
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
            Pedido de {input.quantity} unidades: <strong>{formatBRL(result.batchTotal)}</strong>
          </p>
        )}
      </Card>

      {result.warnings.length > 0 && (
        <Card className="border-amber-300 bg-amber-50 p-4 dark:border-amber-800 dark:bg-amber-950/40">
          <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-amber-700 dark:text-amber-400">
            Alertas
          </p>
          <ul className="list-inside list-disc space-y-1 text-sm text-amber-800 dark:text-amber-300">
            {result.warnings.map((w, i) => (
              <li key={i}>{w}</li>
            ))}
          </ul>
        </Card>
      )}

      <Card className="p-5">
        <p className="mb-3 text-sm font-semibold text-slate-700 dark:text-slate-300">
          Composição do preço — em valor e em percentual
        </p>
        <dl className="space-y-1.5 text-sm">
          {rows.map((row) => (
            <div
              key={row.label}
              className={`flex items-center justify-between ${row.emphasis ? 'border-t border-slate-200 pt-1.5 font-semibold dark:border-slate-700' : ''}`}
            >
              <dt className={row.emphasis ? 'text-slate-800 dark:text-slate-200' : 'text-slate-500 dark:text-slate-400'}>
                {row.label}
              </dt>
              <dd className="flex items-baseline gap-2">
                <span className={row.emphasis ? 'text-indigo-700 dark:text-indigo-400' : 'font-medium text-slate-800 dark:text-slate-200'}>
                  {formatBRL(row.amount)}
                </span>
                <span className="w-14 text-right text-xs text-slate-400 dark:text-slate-500">
                  {formatPercent(row.percentOfPrice)}
                </span>
              </dd>
            </div>
          ))}
          <div className="flex items-center justify-between border-t border-slate-200 pt-1.5 text-base font-bold text-indigo-700 dark:border-slate-700 dark:text-indigo-400">
            <dt>Preço de venda</dt>
            <dd className="flex items-baseline gap-2">
              <span>{formatBRL(price)}</span>
              <span className="w-14 text-right text-xs font-normal text-slate-400 dark:text-slate-500">100,0%</span>
            </dd>
          </div>
        </dl>
      </Card>
    </div>
  )
}
