import type { EmployeeProfile, FixedCostProfile } from '../../lib/data/legalProfiles'
import { calculateAdhocFee } from '../../lib/legalPricing/calculate'
import type { AdhocFeeInput, PracticeAssumptions } from '../../types/legalPricing'
import { NumberField } from '../ui/NumberField'
import { TextField } from '../ui/TextField'
import { DirectCostsEditor } from './DirectCostsEditor'
import { FeeResultCard } from './FeeResultCard'
import { FixedCostAllocationField } from './FixedCostAllocationField'
import { RoleAllocationsEditor } from './RoleAllocationsEditor'

interface Props {
  input: AdhocFeeInput
  assumptions: PracticeAssumptions
  employees: EmployeeProfile[]
  fixedCosts: FixedCostProfile[]
  onChange: (input: AdhocFeeInput) => void
}

export function AdhocFeeForm({ input, assumptions, employees, fixedCosts, onChange }: Props) {
  const result = calculateAdhocFee(input, assumptions)

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      <div className="space-y-4">
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Para um serviço pontual e fechado — ex.: elaborar um contrato, emitir um parecer, conduzir uma due
          diligence — sem vínculo de hora faturada nem recorrência.
        </p>
        <TextField
          label="Nome do serviço"
          value={input.serviceName}
          onChange={(v) => onChange({ ...input, serviceName: v })}
          placeholder="Ex.: Elaboração de contrato de prestação de serviços"
        />
        <RoleAllocationsEditor
          roles={input.roles}
          assumptions={assumptions}
          employees={employees}
          onChange={(roles) => onChange({ ...input, roles })}
        />
        <DirectCostsEditor
          items={input.directCosts}
          onChange={(directCosts) => onChange({ ...input, directCosts })}
          placeholder="Ex.: taxas cartorárias, autenticações, traduções…"
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

      <FeeResultCard result={result} priceLabel="Valor fechado sugerido" />
    </div>
  )
}
