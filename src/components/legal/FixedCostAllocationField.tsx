import { useState } from 'react'
import type { FixedCostProfile } from '../../lib/data/legalProfiles'
import { formatBRL } from '../../lib/format'
import { round2 } from '../../lib/legalPricing/calculate'
import { NumberField } from '../ui/NumberField'

interface Props {
  value: number
  onChange: (value: number) => void
  fixedCosts: FixedCostProfile[]
}

export function FixedCostAllocationField({ value, onChange, fixedCosts }: Props) {
  const [monthlyCases, setMonthlyCases] = useState(1)
  const total = fixedCosts.reduce((sum, f) => sum + f.monthlyCost, 0)
  const suggested = monthlyCases > 0 ? total / monthlyCases : 0

  return (
    <div>
      <NumberField label="Rateio de custos fixos" suffix="R$" value={value} onChange={onChange} />
      {fixedCosts.length > 0 && (
        <div className="mt-1 flex flex-wrap items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
          <span>Custos fixos salvos: {formatBRL(total)}/mês ÷</span>
          <input
            type="number"
            min={1}
            value={monthlyCases}
            onChange={(e) => setMonthlyCases(Number(e.target.value) || 1)}
            className="w-14 rounded border border-slate-300 bg-white px-1.5 py-0.5 text-center dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
          />
          <span>casos/mês =</span>
          <button
            type="button"
            onClick={() => onChange(round2(suggested))}
            className="font-medium text-indigo-600 hover:underline dark:text-indigo-400"
          >
            usar {formatBRL(suggested)}
          </button>
        </div>
      )}
    </div>
  )
}
