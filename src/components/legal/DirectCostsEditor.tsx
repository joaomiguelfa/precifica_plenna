import { formatBRL } from '../../lib/format'
import type { DirectCostItem } from '../../types/legalPricing'
import { Button } from '../ui/Button'
import { NumberField } from '../ui/NumberField'
import { TextField } from '../ui/TextField'

interface Props {
  items: DirectCostItem[]
  onChange: (items: DirectCostItem[]) => void
  title?: string
  placeholder?: string
}

export function DirectCostsEditor({
  items,
  onChange,
  title = 'Custos diretos do caso',
  placeholder = 'Ex.: custas processuais, honorários periciais, tradução juramentada…',
}: Props) {
  function addItem() {
    onChange([...items, { id: crypto.randomUUID(), name: '', cost: 0 }])
  }

  function updateItem(index: number, patch: Partial<DirectCostItem>) {
    onChange(items.map((it, i) => (i === index ? { ...it, ...patch } : it)))
  }

  function removeItem(index: number) {
    onChange(items.filter((_, i) => i !== index))
  }

  const total = items.reduce((sum, it) => sum + it.cost, 0)

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <h4 className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">{title}</h4>
        <Button type="button" size="sm" variant="secondary" onClick={addItem}>
          + Adicionar custo
        </Button>
      </div>

      {items.length === 0 && <p className="text-sm text-slate-400 dark:text-slate-500">{placeholder}</p>}

      {items.map((item, index) => (
        <div key={item.id} className="grid grid-cols-12 items-end gap-2 rounded-md bg-slate-50 p-2 dark:bg-slate-800/60">
          <TextField
            label="Descrição"
            value={item.name}
            onChange={(v) => updateItem(index, { name: v })}
            className="col-span-8 sm:col-span-8"
          />
          <NumberField
            label="Valor"
            value={item.cost}
            suffix="R$"
            onChange={(v) => updateItem(index, { cost: v })}
            className="col-span-2 sm:col-span-3"
          />
          <Button
            type="button"
            size="sm"
            variant="danger"
            className="col-span-2 justify-self-end sm:col-span-1"
            onClick={() => removeItem(index)}
            aria-label="Remover custo"
          >
            ×
          </Button>
        </div>
      ))}

      {items.length > 0 && (
        <div className="text-right text-sm text-slate-600 dark:text-slate-400">
          Subtotal custos diretos: <strong>{formatBRL(total)}</strong>
        </div>
      )}
    </div>
  )
}
