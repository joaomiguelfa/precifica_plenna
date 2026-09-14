import type { EmployeeProfile, FixedCostProfile } from '../../lib/data/legalProfiles'
import { calculateRecurringFee } from '../../lib/legalPricing/calculate'
import type { PracticeAssumptions, RecurringFeeInput } from '../../types/legalPricing'
import { NumberField } from '../ui/NumberField'
import { DirectCostsEditor } from './DirectCostsEditor'
import { FeeResultCard } from './FeeResultCard'
import { FixedCostAllocationField } from './FixedCostAllocationField'
import { RoleAllocationsEditor } from './RoleAllocationsEditor'

interface Props {
  input: RecurringFeeInput
  assumptions: PracticeAssumptions
  employees: EmployeeProfile[]
  fixedCosts: FixedCostProfile[]
  onChange: (input: RecurringFeeInput) => void
}

export function RecurringFeeForm({ input, assumptions, employees, fixedCosts, onChange }: Props) {
  const result = calculateRecurringFee(input, assumptions)

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      <div className="space-y-4">
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Estime a capacidade mensal média dedicada a esse cliente (iguala/contrato de risco) — quantas horas de
          cada profissional ficam reservadas por mês para atendê-lo.
        </p>
        <RoleAllocationsEditor
          roles={input.roles}
          assumptions={assumptions}
          employees={employees}
          onChange={(roles) => onChange({ ...input, roles })}
          hoursLabel="Horas/mês estimadas"
        />
        <DirectCostsEditor
          items={input.monthlyDirectCosts}
          onChange={(monthlyDirectCosts) => onChange({ ...input, monthlyDirectCosts })}
          title="Custos diretos mensais"
          placeholder="Ex.: correspondente jurídico fixo, software dedicado ao cliente…"
        />
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <FixedCostAllocationField
            value={input.fixedCostAllocation}
            fixedCosts={fixedCosts}
            onChange={(v) => onChange({ ...input, fixedCostAllocation: v })}
          />
          <NumberField
            label="Margem de lucro desejada"
            suffix="%"
            value={input.marginPercent}
            onChange={(v) => onChange({ ...input, marginPercent: v })}
          />
        </div>
      </div>

      <FeeResultCard result={result} priceLabel="Honorário fixo mensal sugerido" />
    </div>
  )
}
