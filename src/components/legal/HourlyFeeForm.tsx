import { calculateHourlyFee } from '../../lib/legalPricing/calculate'
import type { HourlyFeeInput, PracticeAssumptions } from '../../types/legalPricing'
import { NumberField } from '../ui/NumberField'
import { DirectCostsEditor } from './DirectCostsEditor'
import { FeeResultCard } from './FeeResultCard'
import { RoleAllocationsEditor } from './RoleAllocationsEditor'
import { formatBRL } from '../../lib/format'

interface Props {
  input: HourlyFeeInput
  assumptions: PracticeAssumptions
  onChange: (input: HourlyFeeInput) => void
}

export function HourlyFeeForm({ input, assumptions, onChange }: Props) {
  const result = calculateHourlyFee(input, assumptions)

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      <div className="space-y-4">
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Estime as horas de cada profissional envolvido no caso. O preço já embute a carga tributária e a
          provisão de inadimplência/glosas definidas nas premissas do escritório.
        </p>
        <RoleAllocationsEditor
          roles={input.roles}
          assumptions={assumptions}
          onChange={(roles) => onChange({ ...input, roles })}
        />
        <DirectCostsEditor
          items={input.directCosts}
          onChange={(directCosts) => onChange({ ...input, directCosts })}
        />
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <NumberField
            label="Rateio de custos fixos"
            suffix="R$"
            value={input.fixedCostAllocation}
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

      <FeeResultCard
        result={result}
        priceLabel="Honorário sugerido para o caso"
        extra={
          result.isValid && (
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              {formatBRL(result.effectiveHourlyRate)}/hora, para {result.totalHours}h estimadas
            </p>
          )
        }
      />
    </div>
  )
}
