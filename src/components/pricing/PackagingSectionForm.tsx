import { NumberField } from '../ui/NumberField'
import type { SectionProps } from './SectionProps'

export function PackagingSectionForm({ input, update }: SectionProps) {
  const { packagingCostPerPiece, shippingCost, includeShippingInPrice } = input.packaging

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <NumberField
          label="Custo de embalagem"
          value={packagingCostPerPiece}
          suffix="R$"
          onChange={(v) =>
            update((draft) => {
              draft.packaging.packagingCostPerPiece = v
            })
          }
        />
        <NumberField
          label="Custo de frete"
          value={shippingCost}
          suffix="R$"
          onChange={(v) =>
            update((draft) => {
              draft.packaging.shippingCost = v
            })
          }
        />
      </div>
      <label className="flex items-center gap-2 text-sm text-slate-700">
        <input
          type="checkbox"
          checked={includeShippingInPrice}
          onChange={(e) =>
            update((draft) => {
              draft.packaging.includeShippingInPrice = e.target.checked
            })
          }
        />
        Incluir o frete no preço final (em vez de destacá-lo separadamente para o cliente)
      </label>
    </div>
  )
}
