interface NumberFieldProps {
  label: string
  value: number
  onChange: (value: number) => void
  suffix?: string
  min?: number
  step?: number
  placeholder?: string
  className?: string
  disabled?: boolean
}

export function NumberField({
  label,
  value,
  onChange,
  suffix,
  min = 0,
  step = 'any' as unknown as number,
  placeholder,
  className = '',
  disabled = false,
}: NumberFieldProps) {
  const invalid = min != null && value < min

  return (
    <label className={`block text-sm ${className}`}>
      <span className="mb-1 block font-medium text-slate-700 dark:text-slate-300">{label}</span>
      <div className="flex items-stretch overflow-hidden rounded-md border border-slate-300 focus-within:border-indigo-500 focus-within:ring-1 focus-within:ring-indigo-500 dark:border-slate-700 dark:disabled:opacity-60">
        <input
          type="number"
          inputMode="decimal"
          className="w-full min-w-0 flex-1 bg-white px-3 py-2 text-slate-900 outline-none disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500 dark:bg-slate-900 dark:text-slate-100 dark:disabled:bg-slate-800"
          value={Number.isFinite(value) ? value : 0}
          min={min}
          step={step}
          placeholder={placeholder}
          disabled={disabled}
          onChange={(e) => {
            const raw = e.target.value
            onChange(raw === '' ? 0 : Number(raw))
          }}
        />
        {suffix && (
          <span className="flex items-center bg-slate-50 px-2 text-xs text-slate-500 dark:bg-slate-800 dark:text-slate-400">
            {suffix}
          </span>
        )}
      </div>
      {invalid && <span className="mt-1 block text-xs text-red-600 dark:text-red-400">Não pode ser negativo.</span>}
    </label>
  )
}
