import type { ButtonHTMLAttributes } from 'react'

type Variant = 'primary' | 'secondary' | 'danger' | 'ghost'

const variantClasses: Record<Variant, string> = {
  primary:
    'bg-indigo-600 text-white hover:bg-indigo-700 disabled:bg-indigo-300 dark:disabled:bg-indigo-900 dark:disabled:text-indigo-400',
  secondary:
    'bg-slate-100 text-slate-700 hover:bg-slate-200 disabled:text-slate-400 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700 dark:disabled:text-slate-600',
  danger:
    'bg-red-50 text-red-600 hover:bg-red-100 disabled:text-red-300 dark:bg-red-950/40 dark:text-red-400 dark:hover:bg-red-950/70 dark:disabled:text-red-800',
  ghost:
    'text-slate-600 hover:bg-slate-100 disabled:text-slate-300 dark:text-slate-400 dark:hover:bg-slate-800 dark:disabled:text-slate-700',
}

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: 'sm' | 'md'
}

export function Button({ variant = 'primary', size = 'md', className = '', ...props }: ButtonProps) {
  const sizeClasses = size === 'sm' ? 'px-2.5 py-1.5 text-sm' : 'px-4 py-2 text-sm'
  return (
    <button
      className={`inline-flex items-center justify-center gap-1.5 rounded-md font-medium transition-colors disabled:cursor-not-allowed ${variantClasses[variant]} ${sizeClasses} ${className}`}
      {...props}
    />
  )
}
