import { formatPercent } from '../../lib/format'
import type { PlatformFeeItem } from '../../types/resale'
import { Button } from '../ui/Button'
import { NumberField } from '../ui/NumberField'
import { TextField } from '../ui/TextField'

interface Props {
  items: PlatformFeeItem[]
  onChange: (items: PlatformFeeItem[]) => void
}

/**
 * Lista livre de taxas percentuais sobre o preço final — uma linha por
 * plataforma/tipo de taxa (Mercado Livre, Shopee, taxa de pagamento,
 * anúncios patrocinados…), já que "outras quaisquer plataformas" têm
 * estruturas de taxa diferentes entre si.
 */
export function PlatformFeesEditor({ items, onChange }: Props) {
  function addItem() {
    onChange([...items, { id: crypto.randomUUID(), name: '', percent: 0 }])
  }

  function updateItem(index: number, patch: Partial<PlatformFeeItem>) {
    onChange(items.map((it, i) => (i === index ? { ...it, ...patch } : it)))
  }

  function removeItem(index: number) {
    onChange(items.filter((_, i) => i !== index))
  }

  const total = items.reduce((sum, it) => sum + it.percent, 0)

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <h4 className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
          Taxas das plataformas
        </h4>
        <Button type="button" size="sm" variant="secondary" onClick={addItem}>
          + Adicionar taxa
        </Button>
      </div>

      {items.length === 0 && (
        <p className="text-sm text-slate-400 dark:text-slate-500">
          Ex.: comissão do Mercado Livre, taxa de pagamento, anúncios patrocinados…
        </p>
      )}

      {items.map((item, index) => (
        <div key={item.id} className="grid grid-cols-12 items-end gap-2 rounded-md bg-slate-50 p-2 dark:bg-slate-800/60">
          <TextField
            label="Descrição"
            value={item.name}
            onChange={(v) => updateItem(index, { name: v })}
            placeholder="Ex.: Comissão Mercado Livre"
            className="col-span-8 sm:col-span-8"
          />
          <NumberField
            label="Percentual"
            value={item.percent}
            suffix="%"
            onChange={(v) => updateItem(index, { percent: v })}
            className="col-span-2 sm:col-span-3"
          />
          <Button
            type="button"
            size="sm"
            variant="danger"
            className="col-span-2 justify-self-end sm:col-span-1"
            onClick={() => removeItem(index)}
            aria-label="Remover taxa"
          >
            ×
          </Button>
        </div>
      ))}

      {items.length > 0 && (
        <div className="text-right text-sm text-slate-600 dark:text-slate-400">
          Subtotal taxas das plataformas: <strong>{formatPercent(total)}</strong>
        </div>
      )}
    </div>
  )
}
