import type { PrinterProfile } from '../../lib/data/profiles'
import { formatBRL } from '../../lib/format'
import { NumberField } from '../ui/NumberField'
import type { SectionProps } from './SectionProps'

interface Props extends SectionProps {
  printerProfiles: PrinterProfile[]
}

export function EnergySectionForm({ input, update, printerProfiles }: Props) {
  const { printerPowerWatts, printTimeHours, energyTariffPerKwh } = input.energy
  const cost = (printerPowerWatts * printTimeHours * energyTariffPerKwh) / 1000

  function loadPrinterProfile(profileId: string) {
    const profile = printerProfiles.find((p) => p.id === profileId)
    if (!profile) return
    update((draft) => {
      draft.energy.printerPowerWatts = profile.powerWatts
      draft.depreciation.printer = {
        id: profile.id,
        name: profile.name,
        acquisitionCost: profile.acquisitionCost,
        lifespanHours: profile.lifespanHours,
      }
    })
  }

  return (
    <div className="space-y-3">
      <p className="text-xs text-slate-500 dark:text-slate-400">
        Tempo de impressão: extraia direto do seu fatiador (Cura, PrusaSlicer, Orca…). Ele também alimenta o
        cálculo de depreciação abaixo.
      </p>
      {printerProfiles.length > 0 && (
        <select
          className="rounded-md border border-slate-300 bg-white px-2 py-1 text-xs text-slate-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300"
          value=""
          onChange={(e) => loadPrinterProfile(e.target.value)}
        >
          <option value="" disabled>
            Carregar perfil de impressora… (preenche a potência aqui e os dados na Depreciação)
          </option>
          {printerProfiles.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
      )}
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
      <div className="text-right text-sm text-slate-600 dark:text-slate-400">
        Custo de energia: <strong>{formatBRL(cost)}</strong>
      </div>
    </div>
  )
}
