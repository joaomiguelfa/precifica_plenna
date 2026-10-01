import type { MarginInputMode } from '../../types/resale'
import { NumberField } from '../ui/NumberField'

interface Props {
  mode: MarginInputMode
  marginPercent: number
  marginValue: number
  onModeChange: (mode: MarginInputMode) => void
  onMarginPercentChange: (value: number) => void
  onMarginValueChange: (value: number) => void
}

const MODE_OPTIONS: { id: MarginInputMode; label: string }[] = [
  { id: 'percent', label: 'Por percentual' },
  { id: 'value', label: 'Por valor (R$)' },
]

/**
 * Deixa escolher se o lucro desejado é informado como % do preço final ou
 * como um valor fixo em R$ por unidade — os dois jeitos de pensar preço que
 * um vendedor usa dependendo do produto.
 */
export function MarginModeField({
  mode,
  marginPercent,
  marginValue,
  onModeChange,
  onMarginPercentChange,
  onMarginValueChange,
}: Props) {
  return (
    <div className="space-y-2">
      <span className="block text-sm font-medium text-slate-700 dark:text-slate-300">Como definir a margem</span>
      <div className="flex w-fit gap-1 rounded-md border border-slate-300 p-1 text-sm dark:border-slate-700">
        {MODE_OPTIONS.map((option) => (
          <button
            key={option.id}
            type="button"
            onClick={() => onModeChange(option.id)}
            className={`rounded px-3 py-1.5 font-medium transition-colors ${
              mode === option.id
                ? 'bg-indigo-600 text-white'
                : 'text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800'
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>
      {mode === 'percent' ? (
        <NumberField
          label="Margem de lucro desejada"
          suffix="%"
          value={marginPercent}
          onChange={onMarginPercentChange}
        />
      ) : (
        <NumberField
          label="Lucro desejado por unidade"
          suffix="R$"
          value={marginValue}
          onChange={onMarginValueChange}
        />
      )}
    </div>
  )
}
