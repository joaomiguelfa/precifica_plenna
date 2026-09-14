import { useState, type ReactNode } from 'react'

interface CollapsibleSectionProps {
  title: string
  subtitle?: string
  badge?: ReactNode
  defaultOpen?: boolean
  children: ReactNode
}

export function CollapsibleSection({ title, subtitle, badge, defaultOpen = true, children }: CollapsibleSectionProps) {
  const [open, setOpen] = useState(defaultOpen)

  return (
    <div className="border-b border-slate-200 last:border-b-0 dark:border-slate-800">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left"
        aria-expanded={open}
      >
        <div>
          <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">{title}</h3>
          {subtitle && <p className="text-xs text-slate-500 dark:text-slate-400">{subtitle}</p>}
        </div>
        <div className="flex items-center gap-3">
          {badge}
          <span
            className={`text-slate-400 transition-transform dark:text-slate-500 ${open ? 'rotate-180' : ''}`}
            aria-hidden="true"
          >
            ▾
          </span>
        </div>
      </button>
      {open && <div className="space-y-3 px-4 pb-4">{children}</div>}
    </div>
  )
}
