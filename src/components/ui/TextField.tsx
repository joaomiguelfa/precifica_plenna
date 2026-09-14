interface TextFieldProps {
  label: string
  value: string
  onChange: (value: string) => void
  placeholder?: string
  className?: string
}

export function TextField({ label, value, onChange, placeholder, className = '' }: TextFieldProps) {
  return (
    <label className={`block text-sm ${className}`}>
      <span className="mb-1 block font-medium text-slate-700 dark:text-slate-300">{label}</span>
      <input
        type="text"
        className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-slate-900 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
      />
    </label>
  )
}
