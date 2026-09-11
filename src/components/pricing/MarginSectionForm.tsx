import { formatBRL, formatPercent } from '../../lib/format'
import type { PricingResult } from '../../types/pricing'
import { NumberField } from '../ui/NumberField'
import type { SectionProps } from './SectionProps'

interface Props extends SectionProps {
  result: PricingResult
}

export function MarginSectionForm({ input, update, result }: Props) {
  const { method, marginOnPricePercent, markupOnCostPercent } = input.margin

  return (
    <div className="space-y-4">
      <div className="flex rounded-md border border-slate-300 p-1 text-sm">
        <button
          type="button"
          className={`flex-1 rounded px-3 py-1.5 font-medium transition-colors ${
            method === 'margin_on_price' ? 'bg-indigo-600 text-white' : 'text-slate-600'
          }`}
          onClick={() =>
            update((draft) => {
              draft.margin.method = 'margin_on_price'
            })
          }
        >
          Margem sobre a venda (correto)
        </button>
        <button
          type="button"
          className={`flex-1 rounded px-3 py-1.5 font-medium transition-colors ${
            method === 'markup_on_cost' ? 'bg-indigo-600 text-white' : 'text-slate-600'
          }`}
          onClick={() =>
            update((draft) => {
              draft.margin.method = 'markup_on_cost'
            })
          }
        >
          Markup sobre o custo (comum)
        </button>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <NumberField
          label="Margem desejada sobre o preço final"
          value={marginOnPricePercent}
          suffix="%"
          onChange={(v) =>
            update((draft) => {
              draft.margin.marginOnPricePercent = v
            })
          }
          className={method === 'margin_on_price' ? '' : 'opacity-60'}
        />
        <NumberField
          label="Markup desejado sobre o custo"
          value={markupOnCostPercent}
          suffix="%"
          onChange={(v) =>
            update((draft) => {
              draft.margin.markupOnCostPercent = v
            })
          }
          className={method === 'markup_on_cost' ? '' : 'opacity-60'}
        />
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <ComparisonCard
          title="Margem sobre a venda"
          highlighted={method === 'margin_on_price'}
          finalPrice={result.marginOnPrice.finalPrice}
          effectiveMarginPercent={result.marginOnPrice.effectiveMarginPercent}
          isValid={result.marginOnPrice.isValid}
          warning={result.marginOnPrice.warning}
          formula="Custo ÷ (1 − margem% − taxas%)"
        />
        <ComparisonCard
          title="Markup sobre o custo"
          highlighted={method === 'markup_on_cost'}
          finalPrice={result.markupOnCost.finalPrice}
          effectiveMarginPercent={result.markupOnCost.effectiveMarginPercent}
          isValid={result.markupOnCost.isValid}
          warning={result.markupOnCost.warning}
          formula="Custo × (1 + markup%)"
        />
      </div>

      {result.priceDifferenceBetweenMethods != null && result.priceDifferenceBetweenMethods !== 0 && (
        <p className="rounded-md bg-amber-50 px-3 py-2 text-xs text-amber-800">
          A diferença entre os dois métodos é de <strong>{formatBRL(Math.abs(result.priceDifferenceBetweenMethods))}</strong>{' '}
          no preço final. O markup simples costuma parecer mais barato, mas não garante a margem real desejada
          depois que as taxas de venda entram — repare na "margem real" de cada card acima.
        </p>
      )}
    </div>
  )
}

function ComparisonCard({
  title,
  highlighted,
  finalPrice,
  effectiveMarginPercent,
  isValid,
  warning,
  formula,
}: {
  title: string
  highlighted: boolean
  finalPrice: number | null
  effectiveMarginPercent: number | null
  isValid: boolean
  warning: string | null
  formula: string
}) {
  return (
    <div
      className={`rounded-lg border p-3 ${
        highlighted ? 'border-indigo-400 bg-indigo-50' : 'border-slate-200 bg-white'
      }`}
    >
      <div className="mb-1 flex items-center justify-between">
        <span className="text-xs font-semibold text-slate-600">{title}</span>
        {highlighted && (
          <span className="rounded-full bg-indigo-600 px-2 py-0.5 text-[10px] font-medium text-white">
            selecionado
          </span>
        )}
      </div>
      <p className="mb-2 text-[11px] text-slate-400">{formula}</p>
      {isValid ? (
        <>
          <p className="text-xl font-semibold text-slate-900">{formatBRL(finalPrice)}</p>
          <p className="text-xs text-slate-500">margem real: {formatPercent(effectiveMarginPercent)}</p>
        </>
      ) : (
        <p className="text-xs text-red-600">{warning}</p>
      )}
    </div>
  )
}
