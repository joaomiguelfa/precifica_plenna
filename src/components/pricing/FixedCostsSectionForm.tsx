import { formatBRL } from '../../lib/format'
import { round2 } from '../../lib/pricing/calculate'
import { NumberField } from '../ui/NumberField'
import type { SectionProps } from './SectionProps'

export function FixedCostsSectionForm({ input, update }: SectionProps) {
  const { monthlyFixedCosts, estimatedMonthlyPieces, manualOverridePerPiece } = input.fixedCosts
  const auto = estimatedMonthlyPieces > 0 ? monthlyFixedCosts / estimatedMonthlyPieces : 0
  const effective = manualOverridePerPiece ?? auto

  return (
    <div className="space-y-3">
      <p className="text-xs text-slate-500">
        Aluguel do espaço, internet, manutenção preventiva, software de fatiamento pago etc. — rateados pela
        quantidade de peças que você estima produzir no mês.
      </p>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <NumberField
          label="Custos fixos mensais"
          value={monthlyFixedCosts}
          suffix="R$/mês"
          onChange={(v) =>
            update((draft) => {
              draft.fixedCosts.monthlyFixedCosts = v
            })
          }
        />
        <NumberField
          label="Peças estimadas no mês"
          value={estimatedMonthlyPieces}
          onChange={(v) =>
            update((draft) => {
              draft.fixedCosts.estimatedMonthlyPieces = v
            })
          }
        />
      </div>
      <div className="text-right text-sm text-slate-500">Rateio automático: {formatBRL(auto)}/peça</div>

      <label className="flex items-center gap-2 text-sm text-slate-700">
        <input
          type="checkbox"
          checked={manualOverridePerPiece != null}
          onChange={(e) =>
            update((draft) => {
              draft.fixedCosts.manualOverridePerPiece = e.target.checked ? round2(auto) : null
            })
          }
        />
        Editar manualmente o rateio por peça
      </label>

      {manualOverridePerPiece != null && (
        <NumberField
          label="Custo fixo por peça (manual)"
          value={manualOverridePerPiece}
          suffix="R$"
          onChange={(v) =>
            update((draft) => {
              draft.fixedCosts.manualOverridePerPiece = v
            })
          }
          className="max-w-xs"
        />
      )}

      <div className="text-right text-sm text-slate-600">
        Custo fixo aplicado: <strong>{formatBRL(effective)}</strong>
      </div>
    </div>
  )
}
