import { formatBRL } from '../../lib/format'
import { LAWYER_ROLE_LABELS } from '../../types/legalPricing'
import type { LawyerRole, PracticeAssumptions } from '../../types/legalPricing'
import { CollapsibleSection } from '../ui/CollapsibleSection'
import { NumberField } from '../ui/NumberField'

interface Props {
  assumptions: PracticeAssumptions
  onChange: (assumptions: PracticeAssumptions) => void
}

const ROLE_ENTRIES = Object.entries(LAWYER_ROLE_LABELS) as [LawyerRole, string][]

export function PracticeAssumptionsPanel({ assumptions, onChange }: Props) {
  function update(patch: Partial<PracticeAssumptions>) {
    onChange({ ...assumptions, ...patch })
  }

  return (
    <CollapsibleSection
      title="Premissas do escritório"
      subtitle="Valores de referência do BBCS — ajuste para o seu escritório"
      defaultOpen={false}
    >
      <div>
        <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
          Custo mensal médio por cargo (com encargos)
        </h4>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {ROLE_ENTRIES.map(([role, label]) => (
            <NumberField
              key={role}
              label={label}
              suffix="R$/mês"
              value={assumptions.monthlyCostByRole[role]}
              onChange={(v) =>
                update({ monthlyCostByRole: { ...assumptions.monthlyCostByRole, [role]: v } })
              }
            />
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <NumberField
          label="Horas disponíveis por mês"
          value={assumptions.availableHoursPerMonth}
          suffix="h"
          onChange={(v) => update({ availableHoursPerMonth: v })}
        />
        <NumberField
          label="Meta de utilização"
          value={assumptions.utilizationRate}
          suffix="%"
          onChange={(v) => update({ utilizationRate: v })}
        />
        <NumberField
          label="Carga tributária efetiva"
          value={assumptions.taxBurdenPercent}
          suffix="%"
          onChange={(v) => update({ taxBurdenPercent: v })}
        />
        <NumberField
          label="Provisão para inadimplência/glosas"
          value={assumptions.writeOffPercent}
          suffix="%"
          onChange={(v) => update({ writeOffPercent: v })}
        />
        <NumberField
          label="Comissão sobre honorários de êxito"
          value={assumptions.successCommissionPercent}
          suffix="%"
          onChange={(v) => update({ successCommissionPercent: v })}
        />
      </div>

      <p className="text-xs text-slate-400 dark:text-slate-500">
        Custo de hora faturável = custo mensal do cargo ÷ (horas disponíveis × meta de utilização). Ex.:{' '}
        {formatBRL(assumptions.monthlyCostByRole.socio)} ÷ ({assumptions.availableHoursPerMonth}h ×{' '}
        {assumptions.utilizationRate}%).
      </p>
    </CollapsibleSection>
  )
}
