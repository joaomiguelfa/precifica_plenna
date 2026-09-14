import type { MaterialProfile } from '../../lib/data/profiles'
import { formatBRL } from '../../lib/format'
import { Button } from '../ui/Button'
import { NumberField } from '../ui/NumberField'
import { TextField } from '../ui/TextField'
import type { SectionProps } from './SectionProps'

interface Props extends SectionProps {
  materialProfiles: MaterialProfile[]
}

export function MaterialSectionForm({ input, update, materialProfiles }: Props) {
  const { materials, extraSupplies, wastePercent } = input.material

  const materialBaseCost = materials.reduce((sum, m) => sum + (m.weightGrams / 1000) * m.costPerKg, 0)
  const extraSuppliesCost = extraSupplies.reduce((sum, s) => sum + s.quantity * s.unitCost, 0)

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
            Filamentos / cores usadas
          </h4>
          <div className="flex gap-2">
            {materialProfiles.length > 0 && (
              <select
                className="rounded-md border border-slate-300 bg-white px-2 py-1 text-xs text-slate-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300"
                value=""
                onChange={(e) => {
                  const profile = materialProfiles.find((p) => p.id === e.target.value)
                  if (!profile) return
                  update((draft) => {
                    draft.material.materials.push({
                      id: crypto.randomUUID(),
                      name: profile.name,
                      weightGrams: 0,
                      costPerKg: profile.costPerKg,
                    })
                  })
                }}
              >
                <option value="" disabled>
                  Carregar de um perfil salvo…
                </option>
                {materialProfiles.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({formatBRL(p.costPerKg)}/kg)
                  </option>
                ))}
              </select>
            )}
            <Button
              type="button"
              size="sm"
              variant="secondary"
              onClick={() =>
                update((draft) => {
                  draft.material.materials.push({
                    id: crypto.randomUUID(),
                    name: '',
                    weightGrams: 0,
                    costPerKg: 0,
                  })
                })
              }
            >
              + Adicionar material
            </Button>
          </div>
        </div>

        {materials.length === 0 && (
          <p className="text-sm text-slate-400 dark:text-slate-500">Nenhum material adicionado ainda.</p>
        )}

        {materials.map((material, index) => (
          <div key={material.id} className="grid grid-cols-12 items-end gap-2 rounded-md bg-slate-50 p-2 dark:bg-slate-800/60">
            <TextField
              label="Nome / cor"
              value={material.name}
              onChange={(v) =>
                update((draft) => {
                  draft.material.materials[index].name = v
                })
              }
              className="col-span-12 sm:col-span-5"
            />
            <NumberField
              label="Peso consumido"
              value={material.weightGrams}
              suffix="g"
              onChange={(v) =>
                update((draft) => {
                  draft.material.materials[index].weightGrams = v
                })
              }
              className="col-span-6 sm:col-span-3"
            />
            <NumberField
              label="Custo do filamento"
              value={material.costPerKg}
              suffix="R$/kg"
              onChange={(v) =>
                update((draft) => {
                  draft.material.materials[index].costPerKg = v
                })
              }
              className="col-span-6 sm:col-span-3"
            />
            <div className="col-span-10 flex items-center justify-between text-xs text-slate-500 sm:col-span-11 sm:justify-end sm:gap-3 dark:text-slate-400">
              <span className="sm:hidden">Subtotal</span>
              <span>{formatBRL((material.weightGrams / 1000) * material.costPerKg)}</span>
            </div>
            <Button
              type="button"
              size="sm"
              variant="danger"
              className="col-span-2 justify-self-end sm:col-span-1"
              onClick={() =>
                update((draft) => {
                  draft.material.materials.splice(index, 1)
                })
              }
              aria-label="Remover material"
            >
              ×
            </Button>
          </div>
        ))}

        <div className="text-right text-sm text-slate-600 dark:text-slate-400">
          Subtotal material: <strong className="dark:text-slate-200">{formatBRL(materialBaseCost)}</strong>
        </div>
      </div>

      <NumberField
        label="Percentual de desperdício/falha"
        value={wastePercent}
        suffix="%"
        onChange={(v) =>
          update((draft) => {
            draft.material.wastePercent = v
          })
        }
        className="max-w-xs"
      />

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
            Outros insumos diretos
          </h4>
          <Button
            type="button"
            size="sm"
            variant="secondary"
            onClick={() =>
              update((draft) => {
                draft.material.extraSupplies.push({
                  id: crypto.randomUUID(),
                  name: '',
                  quantity: 1,
                  unitCost: 0,
                })
              })
            }
          >
            + Adicionar insumo
          </Button>
        </div>

        {extraSupplies.length === 0 && (
          <p className="text-sm text-slate-400 dark:text-slate-500">
            Ex.: suporte solúvel, insert metálico, tinta, resina de pós-processamento…
          </p>
        )}

        {extraSupplies.map((item, index) => (
          <div key={item.id} className="grid grid-cols-12 items-end gap-2 rounded-md bg-slate-50 p-2 dark:bg-slate-800/60">
            <TextField
              label="Nome do insumo"
              value={item.name}
              onChange={(v) =>
                update((draft) => {
                  draft.material.extraSupplies[index].name = v
                })
              }
              className="col-span-12 sm:col-span-5"
            />
            <NumberField
              label="Quantidade"
              value={item.quantity}
              onChange={(v) =>
                update((draft) => {
                  draft.material.extraSupplies[index].quantity = v
                })
              }
              className="col-span-6 sm:col-span-3"
            />
            <NumberField
              label="Custo unitário"
              value={item.unitCost}
              suffix="R$"
              onChange={(v) =>
                update((draft) => {
                  draft.material.extraSupplies[index].unitCost = v
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
                  draft.material.extraSupplies.splice(index, 1)
                })
              }
              aria-label="Remover insumo"
            >
              ×
            </Button>
          </div>
        ))}

        {extraSupplies.length > 0 && (
          <div className="text-right text-sm text-slate-600 dark:text-slate-400">
            Subtotal insumos: <strong>{formatBRL(extraSuppliesCost)}</strong>
          </div>
        )}
      </div>
    </div>
  )
}
