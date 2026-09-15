import type { FixedCostProfile } from '../../lib/data/legalProfiles'
import { formatBRL } from '../../lib/format'

interface Props {
  fixedCosts: FixedCostProfile[]
  monthlyCaseCount: number
  value: number
}

/**
 * Somente leitura: o rateio de custos fixos não é mais digitado por caso —
 * é calculado a partir do total de custos fixos e do número de casos/mês
 * cadastrados em "Perfis salvos".
 */
export function FixedCostAllocationDisplay({ fixedCosts, monthlyCaseCount, value }: Props) {
  const total = fixedCosts.reduce((sum, f) => sum + f.monthlyCost, 0)
  const canCalculate = fixedCosts.length > 0 && monthlyCaseCount > 0

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
