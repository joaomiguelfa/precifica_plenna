import type { FixedCostProfile } from '../../lib/data/legalProfiles'
import { formatBRL } from '../../lib/format'
import { NumberField } from '../ui/NumberField'

interface Props {
  fixedCosts: FixedCostProfile[]
  monthlyCaseCount: number
  value: number
  /** Quando há mais de uma forma de honorário selecionada, cada uma recebe sua própria fatia do rateio total. */
  editable?: boolean
  onChange?: (value: number) => void
}

/**
 * Com uma só forma de honorário selecionada, o rateio não é digitado — é
 * calculado sozinho a partir do total de custos fixos e do número de
 * casos/mês cadastrados em "Perfis salvos". Com mais de uma forma
 * selecionada, cada uma precisa da sua própria fatia desse total (editável),
 * para não recuperar o mesmo rateio mais de uma vez.
 */
export function FixedCostAllocationDisplay({ fixedCosts, monthlyCaseCount, value, editable = false, onChange }: Props) {
  const total = fixedCosts.reduce((sum, f) => sum + f.monthlyCost, 0)
  const canCalculate = fixedCosts.length > 0 && monthlyCaseCount > 0

  if (editable) {
    return (
      <div>
        <NumberField
          label="Rateio de custos fixos atribuído a esta forma"
          suffix="R$"
          value={value}
          onChange={(v) => onChange?.(v)}
        />
        {canCalculate && (
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            Rateio total do caso: {formatBRL(total / monthlyCaseCount)} — divida entre as formas marcadas, sem
            repetir o valor em cada uma.
          </p>
        )}
      </div>
    )
  }

  return (
    <div>
      <span className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Rateio de custos fixos</span>
      <div className="rounded-md border border-slate-300 bg-slate-50 px-3 py-2 dark:border-slate-700 dark:bg-slate-900">
        <p className="text-lg font-semibold text-slate-900 dark:text-slate-100">{formatBRL(value)}</p>
        {canCalculate ? (
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {formatBRL(total)}/mês ÷ {monthlyCaseCount} casos/mês — vindo de "Perfis salvos"
          </p>
        ) : (
          <p className="text-xs text-amber-600 dark:text-amber-400">
            Cadastre os custos fixos e quantos casos/mês o escritório atende em "Perfis salvos" para calcular este
            valor.
          </p>
        )}
      </div>
    </div>
  )
}
