import { useMemo, useState } from 'react'
import { formatBRL, formatPercent } from '../../lib/format'
import { calculatePricing } from '../../lib/pricing/calculate'
import type { PricingInput } from '../../types/pricing'
import { NumberField } from '../ui/NumberField'

interface Props {
  input: PricingInput
}

export function ScenarioComparator({ input }: Props) {
  const [margins, setMargins] = useState([30, 50, 70])

  const scenarios = useMemo(
    () =>
      margins.map((marginPercent) => {
        const scenarioInput: PricingInput = {
          ...input,
          margin: { ...input.margin, method: 'margin_on_price', marginOnPricePercent: marginPercent },
        }
        return { marginPercent, result: calculatePricing(scenarioInput) }
      }),
    [input, margins],
  )

  return (
    <div className="space-y-3">
      <p className="text-xs text-slate-500 dark:text-slate-400">
        Compare o preço final resultante de diferentes margens sobre a venda, sem alterar o cálculo principal.
      </p>
      <div className="grid grid-cols-3 gap-2">
        {margins.map((m, i) => (
          <NumberField
            key={i}
            label={`Cenário ${i + 1}`}
            value={m}
            suffix="%"
            onChange={(v) =>
              setMargins((prev) => prev.map((old, idx) => (idx === i ? v : old)))
            }
          />
        ))}
      </div>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
        {scenarios.map(({ marginPercent, result }) => (
          <div key={marginPercent} className="rounded-lg border border-slate-200 bg-white p-3 dark:border-slate-800 dark:bg-slate-900">
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">Margem de {marginPercent}%</p>
            {result.marginOnPrice.isValid ? (
              <>
                <p className="text-lg font-bold text-slate-900 dark:text-slate-100">{formatBRL(result.marginOnPrice.finalPrice)}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  lucro: {formatBRL(result.marginOnPrice.profitAmount)} ({formatPercent(result.marginOnPrice.effectiveMarginPercent)})
                </p>
              </>
            ) : (
              <p className="text-xs text-red-600 dark:text-red-400">Margem + taxas ≥ 100%</p>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
