import { formatBRL } from '../../lib/format'
import { NumberField } from '../ui/NumberField'
import type { SectionProps } from './SectionProps'

export function LaborSectionForm({ input, update }: SectionProps) {
  const { manualLaborHours, hourlyRate } = input.labor
  const cost = manualLaborHours * hourlyRate

  return (
    <div className="space-y-3">
      <p className="text-xs text-slate-500">
        Tempo de trabalho manual: modelagem/preparo do arquivo, pós-processamento, montagem e embalagem. O tempo
        de máquina (impressão em si) não entra aqui — ele já é coberto pela energia e depreciação.
      </p>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <NumberField
          label="Tempo de trabalho manual"
          value={manualLaborHours}
          suffix="h"
          onChange={(v) =>
            update((draft) => {
              draft.labor.manualLaborHours = v
            })
          }
        />
        <NumberField
          label="Valor da hora do operador"
          value={hourlyRate}
          suffix="R$/h"
          onChange={(v) =>
            update((draft) => {
              draft.labor.hourlyRate = v
            })
          }
        />
      </div>
      <div className="text-right text-sm text-slate-600">
        Custo de mão de obra: <strong>{formatBRL(cost)}</strong>
      </div>
    </div>
  )
}
