import { formatBRL } from '../../lib/format'
import type { FeeResult } from '../../types/legalPricing'
import { Card } from '../ui/Card'

interface Props {
  result: FeeResult
  priceLabel: string
  extra?: React.ReactNode
}

export function FeeResultCard({ result, priceLabel, extra }: Props) {
  return (
    <Card className="p-5">
      <p className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">Custo total</p>
      <p className="text-2xl font-semibold text-slate-900 dark:text-slate-100">
        {formatBRL(result.costBreakdown.totalCost)}
      </p>

      <div className="my-4 border-t border-dashed border-slate-200 dark:border-slate-700" />

      <p className="text-xs font-medium uppercase tracking-wide text-indigo-600 dark:text-indigo-400">{priceLabel}</p>
      {result.isValid ? (
        <p className="text-4xl font-bold text-indigo-700 dark:text-indigo-400">{formatBRL(result.price)}</p>
      ) : (
        <p className="text-sm text-red-600 dark:text-red-400">{result.warning}</p>
      )}

      {extra}

      <div className="my-4 border-t border-slate-200 dark:border-slate-800" />

      <dl className="space-y-1.5 text-sm">
        <div className="flex items-center justify-between">
          <dt className="text-slate-500 dark:text-slate-400">Mão de obra</dt>
          <dd className="font-medium text-slate-800 dark:text-slate-200">{formatBRL(result.costBreakdown.laborCost)}</dd>
        </div>
        <div className="flex items-center justify-between">
          <dt className="text-slate-500 dark:text-slate-400">Custos diretos</dt>
          <dd className="font-medium text-slate-800 dark:text-slate-200">{formatBRL(result.costBreakdown.directCost)}</dd>
        </div>
        <div className="flex items-center justify-between">
          <dt className="text-slate-500 dark:text-slate-400">Custos fixos rateados</dt>
          <dd className="font-medium text-slate-800 dark:text-slate-200">
            {formatBRL(result.costBreakdown.fixedCostAllocation)}
          </dd>
        </div>
        <div className="flex items-center justify-between border-t border-slate-200 pt-1.5 font-semibold dark:border-slate-700">
          <dt>Custo total</dt>
          <dd>{formatBRL(result.costBreakdown.totalCost)}</dd>
        </div>
      </dl>

      {result.isValid && result.warning && (
        <p className="mt-3 rounded-md bg-amber-50 px-3 py-2 text-xs text-amber-800 dark:bg-amber-950/40 dark:text-amber-300">
          {result.warning}
        </p>
      )}
    </Card>
  )
}
