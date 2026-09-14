import { NumberField } from '../ui/NumberField'
import type { SectionProps } from './SectionProps'

export function FeesSectionForm({ input, update }: SectionProps) {
  const { platformFeePercent, paymentFeePercent, taxPercent } = input.fees

  return (
    <div className="space-y-3">
      <p className="text-xs text-slate-500 dark:text-slate-400">
        Essas taxas incidem sobre o <strong>preço final de venda</strong>, não sobre o custo — é assim que o
        marketplace e a maquininha/gateway realmente cobram.
      </p>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <NumberField
          label="Taxa da plataforma"
          value={platformFeePercent}
          suffix="%"
          onChange={(v) =>
            update((draft) => {
              draft.fees.platformFeePercent = v
            })
          }
        />
        <NumberField
          label="Taxa de cartão/gateway"
          value={paymentFeePercent}
          suffix="%"
          onChange={(v) =>
            update((draft) => {
              draft.fees.paymentFeePercent = v
            })
          }
        />
        <NumberField
          label="Impostos (Simples Nacional etc.)"
          value={taxPercent}
          suffix="%"
          onChange={(v) =>
            update((draft) => {
              draft.fees.taxPercent = v
            })
          }
        />
      </div>
    </div>
  )
}
