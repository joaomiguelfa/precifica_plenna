import { useEffect, useState } from 'react'
import { PracticeAssumptionsPanel } from '../components/legal/PracticeAssumptionsPanel'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { NumberField } from '../components/ui/NumberField'
import { TextField } from '../components/ui/TextField'
import { createDefaultPracticeAssumptions } from '../lib/legalPricing/calculate'
import {
  deleteEmployeeProfile,
  deleteFixedCostProfile,
  listEmployeeProfiles,
  listFixedCostProfiles,
  upsertEmployeeProfile,
  upsertFixedCostProfile,
  type EmployeeProfile,
  type FixedCostProfile,
} from '../lib/data/legalProfiles'
import { getLegalSettings, saveLegalSettings } from '../lib/data/legalSettings'
import { formatBRL } from '../lib/format'
import { LAWYER_ROLE_LABELS } from '../types/legalPricing'
import type { LawyerRole, PracticeAssumptions } from '../types/legalPricing'

const ROLE_OPTIONS = Object.entries(LAWYER_ROLE_LABELS) as [LawyerRole, string][]

const emptyEmployee: { name: string; role: LawyerRole; monthlyCost: number } = {
  name: '',
  role: 'associado_senior',
  monthlyCost: 0,
}
const emptyFixedCost = { name: '', monthlyCost: 0 }

export default function LegalProfiles() {
  const [employees, setEmployees] = useState<EmployeeProfile[]>([])
  const [fixedCosts, setFixedCosts] = useState<FixedCostProfile[]>([])
  const [assumptions, setAssumptions] = useState<PracticeAssumptions>(createDefaultPracticeAssumptions())
  const [newEmployee, setNewEmployee] = useState(emptyEmployee)
  const [newFixedCost, setNewFixedCost] = useState(emptyFixedCost)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [assumptionsStatus, setAssumptionsStatus] = useState<string | null>(null)

  async function refresh() {
    try {
      const [e, f, a] = await Promise.all([listEmployeeProfiles(), listFixedCostProfiles(), getLegalSettings()])
      setEmployees(e)
      setFixedCosts(f)
      setAssumptions(a)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar perfis.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    refresh()
  }, [])

  async function handleSaveAssumptions() {
    setAssumptionsStatus(null)
    try {
      await saveLegalSettings(assumptions)
      setAssumptionsStatus('Premissas salvas.')
    } catch (err) {
      setAssumptionsStatus(err instanceof Error ? `Erro: ${err.message}` : 'Erro ao salvar.')
    }
  }

  async function addEmployee() {
    if (!newEmployee.name.trim()) return
    await upsertEmployeeProfile(newEmployee)
    setNewEmployee(emptyEmployee)
    refresh()
  }

  async function addFixedCost() {
    if (!newFixedCost.name.trim()) return
    await upsertFixedCostProfile(newFixedCost)
    setNewFixedCost(emptyFixedCost)
    refresh()
  }

  if (loading) return <p className="text-sm text-slate-400 dark:text-slate-500">Carregando perfis…</p>
  if (error) return <p className="text-sm text-red-600 dark:text-red-400">{error}</p>

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold text-slate-900 dark:text-slate-100">Perfis salvos</h1>

      <Card className="divide-y divide-slate-200 dark:divide-slate-800">
        <PracticeAssumptionsPanel assumptions={assumptions} onChange={setAssumptions} />
        <div className="flex flex-wrap items-center gap-3 p-4">
          <Button onClick={handleSaveAssumptions}>Salvar premissas</Button>
          {assumptionsStatus && <p className="text-sm text-slate-600 dark:text-slate-400">{assumptionsStatus}</p>}
        </div>
      </Card>

      <Card className="p-5">
        <h2 className="mb-3 text-sm font-semibold text-slate-700 dark:text-slate-300">Funcionários</h2>
        <div className="mb-4 grid grid-cols-1 gap-2 sm:grid-cols-4">
          <TextField
            label="Nome"
            value={newEmployee.name}
            onChange={(v) => setNewEmployee({ ...newEmployee, name: v })}
          />
          <label className="block text-sm">
            <span className="mb-1 block font-medium text-slate-700 dark:text-slate-300">Cargo</span>
            <select
              value={newEmployee.role}
              onChange={(e) => setNewEmployee({ ...newEmployee, role: e.target.value as LawyerRole })}
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
            label="Custo mensal"
            suffix="R$"
            value={newEmployee.monthlyCost}
            onChange={(v) => setNewEmployee({ ...newEmployee, monthlyCost: v })}
          />
          <Button className="self-end" onClick={addEmployee}>
            + Adicionar
          </Button>
        </div>
        <ul className="divide-y divide-slate-100 dark:divide-slate-800">
          {employees.map((e) => (
            <li key={e.id} className="flex items-center justify-between py-2 text-sm">
              <div>
                <p className="font-medium text-slate-800 dark:text-slate-200">{e.name}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {LAWYER_ROLE_LABELS[e.role]} · {formatBRL(e.monthlyCost)}/mês
                </p>
              </div>
              <Button variant="danger" size="sm" onClick={() => deleteEmployeeProfile(e.id).then(refresh)}>
                Remover
              </Button>
            </li>
          ))}
          {employees.length === 0 && (
            <p className="py-2 text-sm text-slate-400 dark:text-slate-500">Nenhum funcionário salvo.</p>
          )}
        </ul>
      </Card>

      <Card className="p-5">
        <h2 className="mb-3 text-sm font-semibold text-slate-700 dark:text-slate-300">Custos fixos</h2>
        <p className="mb-3 text-xs text-slate-500 dark:text-slate-400">
          Ex.: condomínio, energia, aluguel, softwares de escritório — custos que não variam por caso e são
          rateados entre os casos do mês.
        </p>
        <div className="mb-4 grid grid-cols-1 gap-2 sm:grid-cols-3">
          <TextField
            label="Nome"
            value={newFixedCost.name}
            onChange={(v) => setNewFixedCost({ ...newFixedCost, name: v })}
            placeholder="Ex.: Condomínio, Energia elétrica…"
          />
          <NumberField
            label="Custo mensal"
            suffix="R$"
            value={newFixedCost.monthlyCost}
            onChange={(v) => setNewFixedCost({ ...newFixedCost, monthlyCost: v })}
          />
          <Button className="self-end" onClick={addFixedCost}>
            + Adicionar
          </Button>
        </div>
        <ul className="divide-y divide-slate-100 dark:divide-slate-800">
          {fixedCosts.map((f) => (
            <li key={f.id} className="flex items-center justify-between py-2 text-sm">
              <div>
                <p className="font-medium text-slate-800 dark:text-slate-200">{f.name}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">{formatBRL(f.monthlyCost)}/mês</p>
              </div>
              <Button variant="danger" size="sm" onClick={() => deleteFixedCostProfile(f.id).then(refresh)}>
                Remover
              </Button>
            </li>
          ))}
          {fixedCosts.length === 0 && (
            <p className="py-2 text-sm text-slate-400 dark:text-slate-500">Nenhum custo fixo salvo.</p>
          )}
        </ul>
      </Card>
    </div>
  )
}
