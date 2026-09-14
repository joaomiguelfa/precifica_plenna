import type { PrinterProfile } from '../../lib/data/profiles'
import { formatBRL } from '../../lib/format'
import { Button } from '../ui/Button'
import { NumberField } from '../ui/NumberField'
import { TextField } from '../ui/TextField'
import type { SectionProps } from './SectionProps'

interface Props extends SectionProps {
  printerProfiles: PrinterProfile[]
}

export function DepreciationSectionForm({ input, update, printerProfiles }: Props) {
  const { printer, accessories } = input.depreciation
  const printTimeHours = input.energy.printTimeHours

  const printerDep = printer.lifespanHours > 0 ? (printer.acquisitionCost / printer.lifespanHours) * printTimeHours : 0
  const accessoriesDep = accessories.reduce(
    (sum, a) => sum + (a.lifespanHours > 0 ? (a.acquisitionCost / a.lifespanHours) * printTimeHours : 0),
    0,
  )

  return (
    <div className="space-y-4">
      <div>
        <div className="mb-2 flex items-center justify-between">
          <h4 className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Impressora</h4>
          {printerProfiles.length > 0 && (
            <select
              className="rounded-md border border-slate-300 bg-white px-2 py-1 text-xs text-slate-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300"
              value=""
              onChange={(e) => {
                const profile = printerProfiles.find((p) => p.id === e.target.value)
                if (!profile) return
                update((draft) => {
                  draft.depreciation.printer = {
                    id: profile.id,
                    name: profile.name,
                    acquisitionCost: profile.acquisitionCost,
                    lifespanHours: profile.lifespanHours,
                  }
                  draft.energy.printerPowerWatts = profile.powerWatts
                })
              }}
            >
              <option value="" disabled>
                Carregar perfil de impressora…
              </option>
              {printerProfiles.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          )}
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <TextField
            label="Nome"
            value={printer.name}
            onChange={(v) =>
              update((draft) => {
                draft.depreciation.printer.name = v
              })
            }
          />
          <NumberField
            label="Valor de aquisição"
            value={printer.acquisitionCost}
            suffix="R$"
            onChange={(v) =>
              update((draft) => {
                draft.depreciation.printer.acquisitionCost = v
              })
            }
          />
          <NumberField
            label="Vida útil estimada"
            value={printer.lifespanHours}
            suffix="h"
            onChange={(v) =>
              update((draft) => {
                draft.depreciation.printer.lifespanHours = v
              })
            }
          />
        </div>
        <div className="mt-1 text-right text-sm text-slate-600 dark:text-slate-400">
          Depreciação da impressora nesta peça: <strong>{formatBRL(printerDep)}</strong>
        </div>
      </div>

      <div>
        <div className="mb-2 flex items-center justify-between">
          <h4 className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
            Acessórios (mesa extra, secador de filamento…)
          </h4>
          <Button
            type="button"
            size="sm"
            variant="secondary"
            onClick={() =>
              update((draft) => {
                draft.depreciation.accessories.push({
                  id: crypto.randomUUID(),
                  name: '',
                  acquisitionCost: 0,
                  lifespanHours: 0,
                })
              })
            }
          >
            + Adicionar acessório
          </Button>
        </div>

        {accessories.map((accessory, index) => (
          <div key={accessory.id} className="mb-2 grid grid-cols-12 items-end gap-2 rounded-md bg-slate-50 p-2 dark:bg-slate-800/60">
            <TextField
              label="Nome"
              value={accessory.name}
              onChange={(v) =>
                update((draft) => {
                  draft.depreciation.accessories[index].name = v
                })
              }
              className="col-span-12 sm:col-span-5"
            />
            <NumberField
              label="Valor de aquisição"
              value={accessory.acquisitionCost}
              suffix="R$"
              onChange={(v) =>
                update((draft) => {
                  draft.depreciation.accessories[index].acquisitionCost = v
                })
              }
              className="col-span-6 sm:col-span-3"
            />
            <NumberField
              label="Vida útil"
              value={accessory.lifespanHours}
              suffix="h"
              onChange={(v) =>
                update((draft) => {
                  draft.depreciation.accessories[index].lifespanHours = v
                })
              }
              className="col-span-6 sm:col-span-3"
            />
            <Button
              type="button"
              size="sm"
              variant="danger"
              className="col-span-12 justify-self-end sm:col-span-1"
              onClick={() =>
                update((draft) => {
                  draft.depreciation.accessories.splice(index, 1)
                })
              }
              aria-label="Remover acessório"
            >
              ×
            </Button>
          </div>
        ))}

        {accessories.length > 0 && (
          <div className="text-right text-sm text-slate-600 dark:text-slate-400">
            Depreciação dos acessórios: <strong>{formatBRL(accessoriesDep)}</strong>
          </div>
        )}
      </div>
    </div>
  )
}
