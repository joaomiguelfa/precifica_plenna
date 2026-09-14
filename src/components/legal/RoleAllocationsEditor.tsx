import type { EmployeeProfile } from '../../lib/data/legalProfiles'
import { formatBRL } from '../../lib/format'
import { hourlyCostForRole } from '../../lib/legalPricing/calculate'
import { LAWYER_ROLE_LABELS } from '../../types/legalPricing'
import type { LawyerRole, PracticeAssumptions, RoleAllocation } from '../../types/legalPricing'
import { Button } from '../ui/Button'
import { NumberField } from '../ui/NumberField'

interface Props {
  roles: RoleAllocation[]
  assumptions: PracticeAssumptions
  employees: EmployeeProfile[]
  onChange: (roles: RoleAllocation[]) => void
  hoursLabel?: string
}

const ROLE_OPTIONS = Object.entries(LAWYER_ROLE_LABELS) as [LawyerRole, string][]

export function RoleAllocationsEditor({ roles, assumptions, employees, onChange, hoursLabel = 'Horas estimadas' }: Props) {
  function addRole() {
    onChange([...roles, { id: crypto.randomUUID(), role: 'associado_senior', hours: 0 }])
  }

  function addFromEmployee(employeeId: string) {
    const employee = employees.find((e) => e.id === employeeId)
    if (!employee) return
    onChange([
      ...roles,
      {
        id: crypto.randomUUID(),
        role: employee.role,
        hours: 0,
        employeeName: employee.name,
        monthlyCostOverride: employee.monthlyCost,
      },
    ])
  }

  function updateRole(index: number, patch: Partial<RoleAllocation>) {
    onChange(roles.map((r, i) => (i === index ? { ...r, ...patch } : r)))
  }

  function removeRole(index: number) {
    onChange(roles.filter((_, i) => i !== index))
  }

  const totalLaborCost = roles.reduce(
    (sum, r) => sum + r.hours * hourlyCostForRole(r.role, assumptions, r.monthlyCostOverride),
    0,
  )

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h4 className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
          Profissionais envolvidos
        </h4>
        <div className="flex gap-2">
          {employees.length > 0 && (
            <select
              value=""
              onChange={(e) => addFromEmployee(e.target.value)}
              className="rounded-md border border-slate-300 bg-white px-2 py-1 text-xs text-slate-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300"
            >
              <option value="" disabled>
                Carregar funcionário salvo…
              </option>
              {employees.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.name} ({LAWYER_ROLE_LABELS[e.role]})
                </option>
              ))}
            </select>
          )}
          <Button type="button" size="sm" variant="secondary" onClick={addRole}>
            + Adicionar profissional
          </Button>
        </div>
      </div>

      {roles.length === 0 && (
        <p className="text-sm text-slate-400 dark:text-slate-500">Nenhum profissional adicionado ainda.</p>
      )}

      {roles.map((r, index) => {
        const hourlyCost = hourlyCostForRole(r.role, assumptions, r.monthlyCostOverride)
        return (
          <div key={r.id} className="grid grid-cols-12 items-end gap-2 rounded-md bg-slate-50 p-2 dark:bg-slate-800/60">
            <label className="col-span-12 block text-sm sm:col-span-6">
              <span className="mb-1 block font-medium text-slate-700 dark:text-slate-300">
                Cargo {r.employeeName && <span className="font-normal text-slate-400 dark:text-slate-500">— {r.employeeName}</span>}
              </span>
              <select
                value={r.role}
                onChange={(e) =>
                  updateRole(index, { role: e.target.value as LawyerRole, employeeName: null, monthlyCostOverride: null })
                }
                className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
              >
                {ROLE_OPTIONS.map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </label>
            <NumberField
              label={hoursLabel}
              value={r.hours}
              suffix="h"
              onChange={(v) => updateRole(index, { hours: v })}
              className="col-span-6 sm:col-span-3"
            />
            <div className="col-span-4 text-xs text-slate-500 dark:text-slate-400 sm:col-span-2">
              {formatBRL(hourlyCost)}/h
            </div>
            <Button
              type="button"
              size="sm"
              variant="danger"
              className="col-span-2 justify-self-end sm:col-span-1"
              onClick={() => removeRole(index)}
              aria-label="Remover profissional"
            >
              ×
            </Button>
          </div>
        )
      })}

      {roles.length > 0 && (
        <div className="text-right text-sm text-slate-600 dark:text-slate-400">
          Subtotal mão de obra: <strong>{formatBRL(totalLaborCost)}</strong>
        </div>
      )}
    </div>
  )
}
