import { formatBRL } from '../../lib/format'
import { NumberField } from '../ui/NumberField'
import type { SectionProps } from './SectionProps'

export function EnergySectionForm({ input, update }: SectionProps) {
  const { printerPowerWatts, printTimeHours, energyTariffPerKwh } = input.energy
  const cost = (printerPowerWatts * printTimeHours * energyTariffPerKwh) / 1000

  return (
    <div className="space-y-3">
      <p className="text-xs text-slate-500">
        Tempo de impressão: extraia direto do seu fatiador (Cura, PrusaSlicer, Orca…). Ele também alimenta o
        cálculo de depreciação abaixo.
      </p>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <NumberField
          label="Potência da impressora"
          value={printerPowerWatts}
          suffix="W"
          onChange={(v) =>
            update((draft) => {
              draft.energy.printerPowerWatts = v
            })
          }
        />
        <NumberField
          label="Tempo de impressão"
          value={printTimeHours}
          suffix="h"
          onChange={(v) =>
            update((draft) => {
              draft.energy.printTimeHours = v
            })
          }
        />
        <NumberField
          label="Tarifa de energia"
          value={energyTariffPerKwh}
          suffix="R$/kWh"
          onChange={(v) =>
            update((draft) => {
              draft.energy.energyTariffPerKwh = v
            })
          }
        />
      </div>
      <div className="text-right text-sm text-slate-600">
        Custo de energia: <strong>{formatBRL(cost)}</strong>
      </div>
    </div>
  )
}
